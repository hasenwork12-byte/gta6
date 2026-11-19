import { Connection, LAMPORTS_PER_SOL, PublicKey, type ParsedTransactionMeta, type TokenBalance } from "@solana/web3.js";
import { CREATOR_WALLET, TOKEN_LIVE, TOKEN_MINT, TREASURY_LIVE, TREASURY_WALLET } from "@/config";
import { BOT_LIVE, botAddress, readUnclaimed } from "./bot";
import { getDays, getTotals, listRuns } from "./botlog";
import { summarizeBuybacks } from "./buyback";
import { demoBalance, demoLedger, demoSnapshot, DEMO_TOKEN_USD } from "./demo";
import { getStockCounts, listRedemptions } from "./points";
import type { Dashboard, LedgerEntry, TreasurySnapshot } from "./types";
import { dailySeries, dayStarts } from "./analytics";

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

/** How long a good SOL price is reused before checking again. */
export const SOL_PRICE_TTL_MS = 5 * 60_000;
/** After every source fails, wait this long before trying again (instead of a full TTL). */
const SOL_PRICE_RETRY_MS = 30_000;
const WSOL_MINT = "So11111111111111111111111111111111111111112";

// Tried in order; the first sane number wins. Several sources, because free APIs rate-limit server IPs.
const SOL_SOURCES: { name: string; url: string; read: (j: any) => unknown }[] = [
  { name: "jupiter", url: `https://lite-api.jup.ag/price/v3?ids=${WSOL_MINT}`, read: (j) => j?.[WSOL_MINT]?.usdPrice },
  { name: "coingecko", url: "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", read: (j) => j?.solana?.usd },
  { name: "coinbase", url: "https://api.coinbase.com/v2/prices/SOL-USD/spot", read: (j) => j?.data?.amount },
  { name: "binance", url: "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT", read: (j) => j?.price },
];

let solPrice: { usd: number; at: number; source: string } | null = null;
let solCheckedAt = 0;
let solInflight: Promise<void> | null = null;

async function refreshSolUsd() {
  for (const s of SOL_SOURCES) {
    try {
      const r = await fetch(s.url, { cache: "no-store", signal: AbortSignal.timeout(4_000) });
      if (!r.ok) continue;
      const p = Number(s.read(await r.json()));
      if (p > 1 && p < 100_000) {
        solPrice = { usd: p, at: Date.now(), source: s.name };
        return;
      }
    } catch {}
  }
}

/**
 * Live SOL/USD. Rechecked every 5 minutes; a failed check keeps the last good
 * price (never caches a 0) and retries sooner.
 */
export async function getSolPrice(): Promise<{ usd: number; at: number; source: string }> {
  const age = Date.now() - (solPrice?.at ?? 0);
  const sinceCheck = Date.now() - solCheckedAt;
  if (!solPrice || (age >= SOL_PRICE_TTL_MS && sinceCheck >= SOL_PRICE_RETRY_MS)) {
    solCheckedAt = Date.now();
    solInflight ??= refreshSolUsd().finally(() => (solInflight = null));
    await solInflight;
  }
  if (solPrice) return solPrice;
  return { usd: Number(process.env.SOL_USD_FALLBACK) || 0, at: 0, source: "fallback" };
}

async function solUsd(): Promise<number> {
  return (await getSolPrice()).usd;
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
      const ownerKey = new PublicKey(data.subarray(0, 32));
      // Skip program-owned addresses (PDAs): pump.fun's bonding curve, the PumpSwap pool,
      // other pools and vaults. Only real wallets (keys on the ed25519 curve) earn XP.
      if (!PublicKey.isOnCurve(ownerKey.toBytes())) continue;
      const owner = ownerKey.toBase58();
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
const PUMP_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const PUMP_AMM_PROGRAM = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";

/**
 * When the coin was created (unix seconds), so charts start on launch day.
 * NEXT_PUBLIC_LAUNCH_DATE (e.g. 2026-11-19) overrides; otherwise the mint's first
 * transaction, via Helius' oldest-first history call. Null if neither works.
 */
async function coinCreatedAt(): Promise<number | null> {
  const fixed = Date.parse(process.env.NEXT_PUBLIC_LAUNCH_DATE || "");
  if (fixed > 0) return Math.floor(fixed / 1000);
  if (!TOKEN_LIVE) return null;
  return cached("created", 24 * 3600_000, async () => {
    try {
      const r = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getTransactionsForAddress", params: [TOKEN_MINT, { transactionDetails: "signatures", sortOrder: "asc", limit: 1 }] }),
        cache: "no-store",
      });
      const j = await r.json();
      const t = j?.result?.data?.[0]?.blockTime;
      return typeof t === "number" && t > 0 ? t : null;
    } catch {
      return null;
    }
  });
}

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
        const logs = tx.meta.logMessages ?? [];
        // The coin's own creation (and the dev buy inside it) is not a buyback.
        const isCreate = logs.some((l) => /Instruction: Create(V2)?$/.test(l));
        // Creator fees only ever come out of pump.fun / PumpSwap vaults.
        const touchesPump = keys.includes(PUMP_PROGRAM) || keys.includes(PUMP_AMM_PROGRAM);

        if (isCreate) {
          entries.push({ signature: sig, time, direction: "out", sol: Math.abs(Math.min(d, 0)) / LAMPORTS_PER_SOL, counterparty: null, label: "Coin created (dev buy)", kind: "transfer", tokens: pig.treasury > 0 ? pig.treasury : undefined });
          return;
        }
        // Buyback: the pig spent SOL and received $PIG. Burn: $PIG left the pig and nobody received it.
        if (pig.treasury > 0 && d < 0) {
          entries.push({ signature: sig, time, direction: "out", sol: Math.abs(d) / LAMPORTS_PER_SOL, counterparty: null, label: "Buyback", kind: "buyback", tokens: pig.treasury });
          return;
        }
        if (pig.treasury < 0 && pig.othersGained === 0) {
          entries.push({ signature: sig, time, direction: "out", sol: Math.abs(Math.min(d, 0)) / LAMPORTS_PER_SOL, counterparty: null, label: "Burn", kind: "burn", tokens: -pig.treasury });
          return;
        }
        // $PIG left the pig and someone else got it: a sale or a transfer, not a fee.
        if (pig.treasury < 0) {
          entries.push({ signature: sig, time, direction: d > 0 ? "in" : "out", sol: Math.abs(d) / LAMPORTS_PER_SOL, counterparty: null, label: d > 0 ? `Sold $PIG` : `Sent $PIG`, kind: "transfer" });
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
        // Money sent in by hand (funding the wallet) is not a creator fee.
        const kind = purchaseTx.has(sig) ? "game" : direction === "in" ? (touchesPump ? "fee" : "transfer") : "transfer";
        entries.push({
          signature: sig,
          time,
          direction,
          sol: Math.abs(d) / LAMPORTS_PER_SOL,
          counterparty: cp,
          label: kind === "game" ? "Game purchase" : kind === "fee" ? "Creator fee" : direction === "in" ? "Incoming transfer" : "Outgoing transfer",
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

/** When each delivered copy went out (unix seconds), for the daily bars. */
async function deliveredTimes() {
  const all = await listRedemptions();
  return all.filter((r) => r.status === "fulfilled").map((r) => Math.floor((r.fulfilledAt ?? r.createdAt) / 1000));
}

async function keysInStock(): Promise<number> {
  const counts = await getStockCounts().catch(() => ({}) as Record<string, number>);
  return Object.values(counts).reduce((a, n) => a + n, 0);
}

/** The fee bot's log and the fees still waiting in the creator vaults. */
async function botData() {
  const creator = botAddress() || CREATOR_WALLET;
  const [totals, runs, unclaimed] = await Promise.all([
    BOT_LIVE ? getTotals() : null,
    BOT_LIVE ? listRuns(300) : null,
    creator ? cached("unclaimed", 20_000, () => readUnclaimed(new PublicKey(creator)).catch(() => 0)) : 0,
  ]);
  return { totals, runs, unclaimed };
}

export async function getSnapshot(): Promise<TreasurySnapshot> {
  if (!TREASURY_LIVE) {
    const [h, counts, keys, sol] = await Promise.all([holderCount(), redemptionCounts(), keysInStock(), solUsd()]);
    const demo = demoSnapshot();
    // Demo SOL amounts are fake, but the USD they convert at should be the real price.
    return {
      ...demo,
      ...counts,
      ...(h === null ? {} : { holders: h }),
      ...(sol > 0 ? { solUsd: sol } : {}),
      keysInStock: keys || demo.keysInStock,
    };
  }
  const [lamports, price, holders, ledger, counts, supply, keys, bot] = await Promise.all([
    cached("balance", 20_000, () => conn().getBalance(new PublicKey(TREASURY_WALLET))),
    solUsd(),
    holderCount(),
    getLedger(),
    redemptionCounts(),
    tokenSupply(),
    keysInStock(),
    botData(),
  ]);
  const fees = ledger.entries.filter((e) => e.kind === "fee").reduce((a, e) => a + e.sol, 0);
  const sameWallet = botAddress() === TREASURY_WALLET;
  const buybackSummary = summarizeBuybacks(
    ledger.entries,
    fees,
    supply,
    ledger.partial,
    bot.totals && bot.runs ? { totals: bot.totals, runs: bot.runs, sameWallet } : undefined,
  );
  // With the bot, it knows every claim. Without it, fees seen arriving in the Pig Bank count as claimed.
  // The bot's log knows every claim it made; claims it didn't log (made from another
  // computer, or before the log existed) still show up as fees in the Pig Bank ledger.
  const claimed = Math.max(bot.totals?.claimedSol ?? 0, fees);
  const lastFeeAt = ledger.entries.filter((e) => e.kind === "fee").reduce((a, e) => Math.max(a, e.time), 0) || null;
  const starts = dayStarts(Date.now() / 1000, undefined, await coinCreatedAt());
  const [delivered, botDays] = await Promise.all([deliveredTimes(), BOT_LIVE ? getDays(starts) : null]);
  return {
    demo: false,
    treasuryWallet: TREASURY_WALLET,
    balanceSol: lamports / LAMPORTS_PER_SOL,
    solUsd: price,
    totalFeesSol: Math.max(fees, claimed),
    feesPartial: ledger.partial && !bot.totals,
    holders,
    ...counts,
    updatedAt: Math.floor(Date.now() / 1000),
    buyback: buybackSummary,
    fees: {
      bot: BOT_LIVE,
      earnedSol: claimed + bot.unclaimed,
      claimedSol: claimed,
      unclaimedSol: bot.unclaimed,
      lastClaimAt: Math.max(bot.totals?.lastClaimAt ?? 0, lastFeeAt ?? 0) || null,
      lastRunAt: bot.totals?.lastRunAt ?? null,
    },
    daily: dailySeries(starts, ledger.entries, buybackSummary.history, buybackSummary.burn, delivered, botDays),
    keysInStock: keys,
  };
}

export async function getDashboard(): Promise<Dashboard> {
  const [snapshot, ledger] = await Promise.all([getSnapshot(), getLedger()]);
  return { snapshot, recent: ledger.entries.slice(0, 20) };
}
