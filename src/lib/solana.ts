import { Connection, LAMPORTS_PER_SOL, PublicKey, type ParsedTransactionMeta, type TokenBalance } from "@solana/web3.js";
import { TOKEN_LIVE, TOKEN_MINT, TREASURY_LIVE, TREASURY_WALLET } from "@/config";
import { summarizeBuybacks } from "./buyback";
import { demoBalance, demoLedger, demoSnapshot, DEMO_TOKEN_USD } from "./demo";
import { listRedemptions } from "./points";
import type { Dashboard, LedgerEntry, TreasurySnapshot } from "./types";

const RPC_URL = (process.env.SOLANA_RPC_URL || "").trim() || "https://api.mainnet-beta.solana.com";
const LEDGER_LIMIT = Math.min(Math.max(Number(process.env.LEDGER_TX_LIMIT) || 60, 1), 1000);

const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

let _conn: Connection | null = null;
const conn = () => (_conn ??= new Connection(RPC_URL, "confirmed"));

// Tiny in-memory TTL cache so bursts of visitors don't hammer the RPC.
const cache = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await fn();
  cache.set(key, { at: Date.now(), value });
  return value;
}

export function isValidAddress(a: string) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)) return false;
  try {
    new PublicKey(a);
    return true;
  } catch {
    return false;
  }
}

async function solUsd(): Promise<number> {
  return cached("solusd", 60_000, async () => {
    try {
      const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", {
        cache: "no-store",
      });
      const j = await r.json();
      const p = Number(j?.solana?.usd);
      if (p > 0) return p;
    } catch {}
    return Number(process.env.SOL_USD_FALLBACK) || 0;
  });
}

/** Token USD price from the deepest-liquidity Solana pair on DexScreener. */
export async function tokenPriceUsd(): Promise<number> {
  if (!TOKEN_LIVE) return DEMO_TOKEN_USD;
  return cached("tokenusd", 60_000, async () => {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN_MINT}`, { cache: "no-store" });
    const j = await r.json();
    type Pair = { chainId: string; priceUsd?: string; liquidity?: { usd?: number } };
    const pairs = ((j?.pairs ?? []) as Pair[])
      .filter((p) => p.chainId === "solana" && Number(p.priceUsd) > 0)
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
    return pairs.length ? Number(pairs[0].priceUsd) : 0;
  });
}

/**
 * Every holder's total balance (UI units), keyed by owner wallet.
 * Needs an RPC that allows getProgramAccounts (e.g. Helius).
 */
export async function holderBalances(): Promise<Record<string, number>> {
  const mint = new PublicKey(TOKEN_MINT);
  const { value } = await conn().getTokenSupply(mint);
  const scale = 10 ** value.decimals;
  const out: Record<string, number> = {};
  let found = false;
  for (const program of [TOKEN_PROGRAM, TOKEN_2022_PROGRAM]) {
    const accounts = await conn()
      .getProgramAccounts(program, {
        dataSlice: { offset: 32, length: 40 }, // owner (32) + amount u64 (8)
        filters: [
          ...(program.equals(TOKEN_PROGRAM) ? [{ dataSize: 165 }] : []),
          { memcmp: { offset: 0, bytes: mint.toBase58() } },
        ],
      })
      .catch((e) => {
        if (program.equals(TOKEN_PROGRAM)) throw e;
        return [];
      });
    for (const a of accounts) {
      const data = a.account.data;
      const amount = Number(data.readBigUInt64LE(32)) / scale;
      if (amount <= 0) continue;
      const owner = new PublicKey(data.subarray(0, 32)).toBase58();
      out[owner] = (out[owner] ?? 0) + amount;
      found = true;
    }
    if (found) break;
  }
  return out;
}

async function holderCount(): Promise<number | null> {
  if (!TOKEN_LIVE) return null;
  return cached("holders", 10 * 60_000, async () => {
    try {
      const n = Object.keys(await holderBalances()).length;
      return n > 0 ? n : null;
    } catch {
      return null; // Public RPC usually rejects getProgramAccounts — use Helius.
    }
  });
}

/** A single wallet's token balance (UI units). */
export async function walletTokenBalance(wallet: string): Promise<number> {
  if (!TOKEN_LIVE) return demoBalance(wallet);
  const res = await conn().getParsedTokenAccountsByOwner(new PublicKey(wallet), { mint: new PublicKey(TOKEN_MINT) });
  return res.value.reduce((a, acc) => a + Number(acc.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0), 0);
}

/** How much $PIG the treasury gained (+) or lost (−) in a transaction, and how much every other owner gained. */
function pigDeltas(meta: ParsedTransactionMeta, treasury: string) {
  const out = { treasury: 0, othersGained: 0 };
  if (!TOKEN_LIVE) return out;
  const byOwner = new Map<string, number>();
  const add = (list: TokenBalance[] | null | undefined, sign: number) => {
    for (const b of list ?? []) {
      if (b.mint !== TOKEN_MINT || !b.owner) continue;
      byOwner.set(b.owner, (byOwner.get(b.owner) ?? 0) + sign * Number(b.uiTokenAmount.uiAmount ?? 0));
    }
  };
  add(meta.postTokenBalances, 1);
  add(meta.preTokenBalances, -1);
  for (const [owner, v] of byOwner) {
    if (owner === treasury) out.treasury = v;
    else if (v > 0) out.othersGained += v;
  }
  return out;
}

/** Total $PIG supply (UI units). Burns lower it. */
async function tokenSupply(): Promise<number | null> {
  if (!TOKEN_LIVE) return null;
  return cached("supply", 5 * 60_000, async () => {
    try {
      const { value } = await conn().getTokenSupply(new PublicKey(TOKEN_MINT));
      return Number(value.uiAmount ?? 0) || null;
    } catch {
      return null;
    }
  });
}

export async function getLedger(): Promise<{ entries: LedgerEntry[]; partial: boolean; demo: boolean }> {
  if (!TREASURY_LIVE) return { entries: demoLedger(), partial: false, demo: true };
  return cached("ledger", 45_000, async () => {
    const treasury = new PublicKey(TREASURY_WALLET);
    const sigs = await conn().getSignaturesForAddress(treasury, { limit: LEDGER_LIMIT });
    const purchaseTx = new Set((await listRedemptions()).map((r) => r.tx).filter(Boolean));
    const entries: LedgerEntry[] = [];

    // Fetch in small chunks — the public RPC rejects large JSON-RPC batches.
    for (let i = 0; i < sigs.length; i += 5) {
      const chunk = sigs.slice(i, i + 5).filter((s) => !s.err);
      const txs = await Promise.all(
        chunk.map((s) =>
          conn()
            .getParsedTransaction(s.signature, { maxSupportedTransactionVersion: 0 })
            .catch(() => null),
        ),
      );
      txs.forEach((tx, k) => {
        if (!tx?.meta) return;
        const keys = tx.transaction.message.accountKeys.map((a) => a.pubkey.toBase58());
        const idx = keys.indexOf(treasury.toBase58());
        if (idx < 0) return;
        const deltas = tx.meta.postBalances.map((post, j) => post - tx.meta!.preBalances[j]);
        const d = deltas[idx];
        const pig = pigDeltas(tx.meta, treasury.toBase58());
        if (d === 0 && pig.treasury === 0) return;
        const direction = d > 0 ? "in" : "out";
        const sig = chunk[k].signature;
        const time = tx.blockTime ?? chunk[k].blockTime ?? 0;

        // Buyback: the pig spent SOL and received $PIG. Burn: $PIG left the pig and nobody received it.
        if (pig.treasury > 0 && d < 0) {
          entries.push({ signature: sig, time, direction: "out", sol: Math.abs(d) / LAMPORTS_PER_SOL, counterparty: null, label: "Buyback", kind: "buyback", tokens: pig.treasury });
          return;
        }
        if (pig.treasury < 0 && pig.othersGained === 0) {
          entries.push({ signature: sig, time, direction: "out", sol: Math.abs(Math.min(d, 0)) / LAMPORTS_PER_SOL, counterparty: null, label: "Burn", kind: "burn", tokens: -pig.treasury });
          return;
        }
        if (d === 0) return;
        // Counterparty = account with the largest opposite balance change.
        let cp: string | null = null;
        let best = 0;
        deltas.forEach((v, j) => {
          if (j === idx) return;
          const opposite = direction === "in" ? -v : v;
          if (opposite > best) {
            best = opposite;
            cp = keys[j];
          }
        });
        const kind = purchaseTx.has(sig) ? "game" : direction === "in" ? "fee" : "transfer";
        entries.push({
          signature: sig,
          time,
          direction,
          sol: Math.abs(d) / LAMPORTS_PER_SOL,
          counterparty: cp,
          label: kind === "game" ? "Game purchase" : kind === "fee" ? "Creator fee" : "Outgoing transfer",
          kind,
        });
      });
    }
    return { entries, partial: sigs.length >= LEDGER_LIMIT, demo: false };
  });
}

async function redemptionCounts() {
  const all = await listRedemptions();
  return {
    gamesRedeemed: all.filter((r) => r.status !== "rejected").length,
    gamesDelivered: all.filter((r) => r.status === "fulfilled").length,
  };
}

export async function getSnapshot(): Promise<TreasurySnapshot> {
  if (!TREASURY_LIVE) {
    const [h, counts] = await Promise.all([holderCount(), redemptionCounts()]);
    return { ...demoSnapshot(), ...counts, ...(h === null ? {} : { holders: h }) };
  }
  const [lamports, price, holders, ledger, counts, supply] = await Promise.all([
    cached("balance", 20_000, () => conn().getBalance(new PublicKey(TREASURY_WALLET))),
    solUsd(),
    holderCount(),
    getLedger(),
    redemptionCounts(),
    tokenSupply(),
  ]);
  const fees = ledger.entries.filter((e) => e.kind === "fee").reduce((a, e) => a + e.sol, 0);
  return {
    demo: false,
    treasuryWallet: TREASURY_WALLET,
    balanceSol: lamports / LAMPORTS_PER_SOL,
    solUsd: price,
    totalFeesSol: fees,
    feesPartial: ledger.partial,
    holders,
    ...counts,
    updatedAt: Math.floor(Date.now() / 1000),
    buyback: summarizeBuybacks(ledger.entries, fees, supply, ledger.partial),
  };
}

export async function getDashboard(): Promise<Dashboard> {
  const [snapshot, ledger] = await Promise.all([getSnapshot(), getLedger()]);
  return { snapshot, recent: ledger.entries.slice(0, 20) };
}
