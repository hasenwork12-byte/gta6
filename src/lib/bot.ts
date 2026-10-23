// The fee bot. Each run:
//   1. claims pump.fun creator fees (bonding curve + PumpSwap) into the bot wallet,
//   2. spends the buyback share of what it claimed on $PIG via Jupiter,
//   3. burns every $PIG the bot wallet holds (when buyback.burn is on),
//   4. sends the rest to the Pig Bank, if the Pig Bank is a different wallet.
// The bot wallet must be the coin's creator wallet. Its secret key lives only in
// the BOT_SECRET_KEY env var on the server. Every step is logged with its tx id.
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { TOKEN_LIVE, TOKEN_MINT, TREASURY_WALLET, buyback } from "@/config";
import { getTotals, releaseLock, saveRun, saveTotals, takeLock, type BotRun, type BotTotals } from "./botlog";

const RPC_URL = (process.env.SOLANA_RPC_URL || "").trim() || "https://api.mainnet-beta.solana.com";
const conn = new Connection(RPC_URL, "confirmed");

const PUMP = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const PUMP_AMM = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
const WSOL = new PublicKey("So11111111111111111111111111111111111111112");
const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ATA_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
/** Rent-exempt minimum of a 0-byte account; the bonding-curve vault always keeps this. */
const VAULT_RENT_LAMPORTS = 890_880;

const num = (v: string | undefined, d: number) => (Number(v) > 0 ? Number(v) : d);
// usepaid claims as little as ~0.001 SOL (measured on their launch-day claims).
const MIN_CLAIM_SOL = num(process.env.BOT_MIN_CLAIM_SOL, 0.001);
/** How often the watcher re-checks the fee vaults between runs. */
const POLL_MS = 5_000;
/**
 * Claim rhythm copied from usepaid's claim wallet (PaidybYx…) on launch day: first claim
 * seconds after launch, then one roughly every 1m45s-2m while fees keep coming in.
 * Call the bot every minute; it claims at most once per this many seconds.
 */
const CLAIM_EVERY_SEC = num(process.env.BOT_CLAIM_EVERY_SEC, 105);
/** Below this the swap would cost more in fees than it buys; it just waits for the next claim. */
const MIN_BUYBACK_SOL = 0.001;
/** Always left in the bot wallet for transaction fees. */
const GAS_RESERVE_SOL = num(process.env.BOT_GAS_RESERVE_SOL, 0.02);
const MIN_SWEEP_SOL = 0.005;

// ── Keys ──────────────────────────────────────────────────────────────────────
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function b58decode(s: string): Uint8Array {
  let n = 0n;
  for (const c of s) {
    const i = B58.indexOf(c);
    if (i < 0) throw new Error("BOT_SECRET_KEY is not valid base58.");
    n = n * 58n + BigInt(i);
  }
  const bytes: number[] = [];
  while (n > 0n) {
    bytes.unshift(Number(n & 0xffn));
    n >>= 8n;
  }
  for (const c of s) {
    if (c !== "1") break;
    bytes.unshift(0);
  }
  return Uint8Array.from(bytes);
}

let _kp: Keypair | null | undefined;
/** Accepts the base58 string Phantom exports, or a JSON byte array (Solana CLI keyfile). */
function botKeypair(): Keypair | null {
  if (_kp !== undefined) return _kp;
  const raw = (process.env.BOT_SECRET_KEY || "").trim();
  if (!raw) return (_kp = null);
  const bytes = raw.startsWith("[") ? Uint8Array.from(JSON.parse(raw) as number[]) : b58decode(raw);
  return (_kp = Keypair.fromSecretKey(bytes));
}

export const BOT_LIVE = TOKEN_LIVE && Boolean((process.env.BOT_SECRET_KEY || "").trim());
export const botAddress = () => botKeypair()?.publicKey.toBase58() ?? null;

// ── Reading unclaimed fees ────────────────────────────────────────────────────
const pda = (seeds: (Buffer | Uint8Array)[], program: PublicKey) => PublicKey.findProgramAddressSync(seeds, program)[0];

/**
 * SOL waiting to be claimed by `creator`: the bonding-curve creator vault
 * (lamports above rent) plus PumpSwap's creator vault (a WSOL token account).
 * Seeds are from pump.fun's public IDLs.
 */
export async function readUnclaimed(creator: PublicKey): Promise<number> {
  const curveVault = pda([Buffer.from("creator-vault"), creator.toBuffer()], PUMP);
  const ammAuthority = pda([Buffer.from("creator_vault"), creator.toBuffer()], PUMP_AMM);
  const ammVault = pda([ammAuthority.toBuffer(), TOKEN_PROGRAM.toBuffer(), WSOL.toBuffer()], ATA_PROGRAM);
  const [curve, amm] = await conn.getMultipleAccountsInfo([curveVault, ammVault]);
  const curveLamports = curve ? Math.max(0, curve.lamports - VAULT_RENT_LAMPORTS) : 0;
  // SPL token account layout: amount is a u64 at byte 64.
  const ammLamports = amm && amm.data.length >= 72 ? Number(amm.data.readBigUInt64LE(64)) : 0;
  return (curveLamports + ammLamports) / LAMPORTS_PER_SOL;
}

// ── Sending ───────────────────────────────────────────────────────────────────
async function sendAndWait(tx: VersionedTransaction, timeoutMs = 40_000): Promise<string> {
  const sig = await conn.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const { value } = await conn.getSignatureStatuses([sig]);
    const st = value[0];
    if (st?.err) throw new Error(`Transaction ${sig} failed: ${JSON.stringify(st.err)}`);
    if (st?.confirmationStatus === "confirmed" || st?.confirmationStatus === "finalized") return sig;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Transaction ${sig} not confirmed in time.`);
}

async function sendIxs(kp: Keypair, ixs: TransactionInstruction[]) {
  const { blockhash } = await conn.getLatestBlockhash("confirmed");
  const msg = new TransactionMessage({ payerKey: kp.publicKey, recentBlockhash: blockhash, instructions: ixs }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign([kp]);
  return sendAndWait(tx);
}

// ── Safety checks: nothing is signed unless it provably touches only our coin ─
let _verifiedMint: string | null = null;
/**
 * Proves TOKEN_MINT is the coin this bot wallet launched: pump.fun's bonding
 * curve for that mint (an account only pump.fun can write) records the bot
 * wallet as creator. A wrong or swapped contract address can never pass.
 */
async function assertOurCoin(kp: Keypair) {
  if (_verifiedMint === TOKEN_MINT) return;
  const mint = new PublicKey(TOKEN_MINT);
  const curve = await conn.getAccountInfo(pda([Buffer.from("bonding-curve"), mint.toBuffer()], PUMP));
  if (!curve || !curve.owner.equals(PUMP)) throw new Error(`Refusing: ${TOKEN_MINT} is not a pump.fun coin.`);
  // BondingCurve layout (pump IDL): 8 discriminator, 5 × u64, complete (bool), creator (pubkey) at 49.
  const creator = new PublicKey(curve.data.subarray(49, 81));
  if (!creator.equals(kp.publicKey)) {
    throw new Error(`Refusing: ${TOKEN_MINT} was created by ${creator.toBase58()}, not the bot wallet ${kp.publicKey.toBase58()}.`);
  }
  // then is_mayhem_mode (81), is_cashback_coin (82).
  if (curve.data[82] === 1) throw new Error("Refusing: this coin was launched in cashback mode, so it has no creator fees.");
  _verifiedMint = TOKEN_MINT;
}

/** Throws unless every instruction runs one of the allowed programs and the bot pays the fee. */
function assertPrograms(tx: VersionedTransaction, kp: Keypair, allowed: PublicKey[], what: string) {
  const keys = tx.message.staticAccountKeys;
  if (!keys[0]?.equals(kp.publicKey)) throw new Error(`Refusing ${what}: fee payer is not the bot wallet.`);
  if (tx.message.addressTableLookups.length) throw new Error(`Refusing ${what}: unexpected lookup tables.`);
  for (const ix of tx.message.compiledInstructions) {
    const program = keys[ix.programIdIndex];
    if (!allowed.some((a) => a.equals(program))) throw new Error(`Refusing ${what}: unknown program ${program.toBase58()}.`);
  }
}

/** Dry-runs a transaction and returns the watched accounts as they would be afterwards. */
async function simulate(tx: VersionedTransaction, watch: PublicKey[], what: string) {
  const sim = await conn.simulateTransaction(tx, {
    sigVerify: false,
    accounts: { encoding: "base64", addresses: watch.map((w) => w.toBase58()) },
  });
  if (sim.value.err) throw new Error(`Refusing ${what}: dry run failed ${JSON.stringify(sim.value.err)}.`);
  return sim.value.accounts ?? [];
}

const tokenAmountOf = (data: Buffer | null | undefined) => (data && data.length >= 72 ? data.readBigUInt64LE(64) : 0n);

// ── Steps ─────────────────────────────────────────────────────────────────────
const CLAIM_PROGRAMS = [
  PUMP,
  PUMP_AMM,
  new PublicKey("pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ"), // pump fees
  new PublicKey("ComputeBudget111111111111111111111111111111"),
  SystemProgram.programId,
  TOKEN_PROGRAM,
  new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
  ATA_PROGRAM,
];

/**
 * PumpPortal builds the claim transaction (all of the creator's fees at once).
 * Before signing: only pump.fun / token / system programs, and a dry run must
 * show the bot wallet not losing more than the network fee.
 */
async function claimFees(kp: Keypair): Promise<string> {
  const r = await fetch("https://pumpportal.fun/api/trade-local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey: kp.publicKey.toBase58(), action: "collectCreatorFee", priorityFee: 0.00001 }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Fee claim build failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
  const tx = VersionedTransaction.deserialize(new Uint8Array(await r.arrayBuffer()));
  assertPrograms(tx, kp, CLAIM_PROGRAMS, "fee claim");
  const before = await conn.getBalance(kp.publicKey, "confirmed");
  const [after] = await simulate(tx, [kp.publicKey], "fee claim");
  if (!after || after.lamports < before - 0.005 * LAMPORTS_PER_SOL) throw new Error("Refusing fee claim: dry run shows SOL leaving the bot wallet.");
  tx.sign([kp]);
  return sendAndWait(tx);
}

async function tokenDecimals(): Promise<number> {
  const { value } = await conn.getTokenSupply(new PublicKey(TOKEN_MINT));
  return value.decimals;
}

/** Jupiter Swap API v2: /order returns a ready transaction, /execute lands it. */
async function buyPig(kp: Keypair, lamports: number): Promise<{ sig: string; tokens: number }> {
  const headers: Record<string, string> = process.env.JUP_API_KEY ? { "x-api-key": process.env.JUP_API_KEY } : {};
  const q = new URLSearchParams({
    inputMint: WSOL.toBase58(),
    outputMint: TOKEN_MINT,
    amount: String(lamports),
    taker: kp.publicKey.toBase58(),
    // web3.js v1 can only sign v0 transactions.
    maxSupportedTransactionVersion: "0",
  });
  const order = await (await fetch(`https://api.jup.ag/swap/v2/order?${q}`, { headers, cache: "no-store" })).json();
  if (!order?.transaction) throw new Error(`Jupiter order failed: ${order?.errorMessage ?? order?.error ?? "no transaction"}`);
  // The quote must be SOL → exactly our mint.
  if (order.outputMint !== TOKEN_MINT || order.inputMint !== WSOL.toBase58()) {
    throw new Error(`Refusing swap: Jupiter quoted ${order.inputMint} → ${order.outputMint}, expected SOL → ${TOKEN_MINT}.`);
  }
  const tx = VersionedTransaction.deserialize(Buffer.from(order.transaction, "base64"));
  if (!tx.message.staticAccountKeys[0]?.equals(kp.publicKey)) throw new Error("Refusing swap: fee payer is not the bot wallet.");

  // Dry run: our coin's balance must go up, and the bot must not lose more SOL than it meant to spend.
  const mint = new PublicKey(TOKEN_MINT);
  const tokenProgram = (await conn.getAccountInfo(mint))!.owner;
  const ata = pda([kp.publicKey.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()], ATA_PROGRAM);
  const [solBefore, ataBefore] = await Promise.all([conn.getBalance(kp.publicKey, "confirmed"), conn.getAccountInfo(ata)]);
  const [solAfter, ataAfter] = await simulate(tx, [kp.publicKey, ata], "swap");
  const gained = tokenAmountOf(ataAfter ? Buffer.from(ataAfter.data[0], "base64") : null) - tokenAmountOf(ataBefore?.data);
  if (gained <= 0n) throw new Error(`Refusing swap: dry run shows no ${TOKEN_MINT} arriving in the bot wallet.`);
  // Allow the spend plus network fees and the one-time token account rent.
  if (!solAfter || solAfter.lamports < solBefore - lamports - 0.01 * LAMPORTS_PER_SOL) throw new Error("Refusing swap: dry run spends more SOL than the buyback amount.");

  tx.sign([kp]);
  const res = await (
    await fetch("https://api.jup.ag/swap/v2/execute", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ signedTransaction: Buffer.from(tx.serialize()).toString("base64"), requestId: order.requestId }),
      cache: "no-store",
    })
  ).json();
  if (res?.status !== "Success") throw new Error(`Jupiter swap failed: ${res?.error ?? res?.code ?? "unknown"}${res?.signature ? ` (${res.signature})` : ""}`);
  const raw = Number(res.totalOutputAmount ?? res.outputAmountResult ?? order.outAmount ?? 0);
  return { sig: res.signature, tokens: raw / 10 ** (await tokenDecimals()) };
}

/** Burns every $PIG in the bot wallet (BurnChecked works for both token programs). */
async function burnAll(kp: Keypair): Promise<{ sig: string; tokens: number } | null> {
  const { value } = await conn.getParsedTokenAccountsByOwner(kp.publicKey, { mint: new PublicKey(TOKEN_MINT) });
  const ixs: TransactionInstruction[] = [];
  let tokens = 0;
  for (const acc of value) {
    const info = acc.account.data.parsed?.info?.tokenAmount;
    const amount = BigInt(info?.amount ?? "0");
    if (amount <= 0n) continue;
    const data = Buffer.alloc(10);
    data.writeUInt8(15, 0); // BurnChecked
    data.writeBigUInt64LE(amount, 1);
    data.writeUInt8(info.decimals, 9);
    ixs.push(
      new TransactionInstruction({
        programId: acc.account.owner,
        keys: [
          { pubkey: acc.pubkey, isSigner: false, isWritable: true },
          { pubkey: new PublicKey(TOKEN_MINT), isSigner: false, isWritable: true },
          { pubkey: kp.publicKey, isSigner: true, isWritable: false },
        ],
        data,
      }),
    );
    tokens += Number(info.uiAmount ?? 0);
  }
  if (!ixs.length) return null;
  return { sig: await sendIxs(kp, ixs), tokens };
}

const balanceSol = async (pk: PublicKey) => (await conn.getBalance(pk, "confirmed")) / LAMPORTS_PER_SOL;

// ── The run ───────────────────────────────────────────────────────────────────
export async function runBot(): Promise<{ skipped?: string; run?: BotRun; totals?: BotTotals }> {
  if (!BOT_LIVE) return { skipped: "Bot not configured (needs NEXT_PUBLIC_TOKEN_MINT and BOT_SECRET_KEY)." };
  if (!(await takeLock(58))) return { skipped: "Another run is in progress." };

  const kp = botKeypair()!;
  const now = () => Math.floor(Date.now() / 1000);
  const run: BotRun = { at: now() };
  const totals = await getTotals();
  // Saved after every step, so a timeout halfway never loses track of claimed fees.
  const persist = () => saveTotals(totals);

  try {
    // 0. Prove the contract address is the coin this wallet launched. Nothing runs otherwise.
    await assertOurCoin(kp);

    // 1. Claim
    const unclaimed = await readUnclaimed(kp.publicKey);
    const due = !totals.lastClaimAt || run.at - totals.lastClaimAt >= CLAIM_EVERY_SEC;
    if (due && unclaimed >= MIN_CLAIM_SOL) {
      run.claimTx = await claimFees(kp);
      // What left the fee vaults, so it's right even if part arrives as wrapped SOL.
      const claimed = Math.max(0, unclaimed - (await readUnclaimed(kp.publicKey)));
      run.claimedSol = claimed;
      totals.claimedSol += claimed;
      totals.owedSol += claimed * buyback.share;
      totals.lastClaimAt = now();
      await persist();
    }

    // 2. Buy back what's owed (capped, and never touching the gas reserve)
    // Exactly the buyback share of everything claimed: no cap.
    const spend = Math.min(totals.owedSol, (await balanceSol(kp.publicKey)) - GAS_RESERVE_SOL);
    if (spend >= MIN_BUYBACK_SOL) {
      const { sig, tokens } = await buyPig(kp, Math.floor(spend * LAMPORTS_PER_SOL));
      Object.assign(run, { swapTx: sig, buybackSol: spend, tokensBought: tokens });
      totals.buybackSol += spend;
      totals.tokensBought += tokens;
      totals.owedSol = Math.max(0, totals.owedSol - spend);
      await persist();
    }

    // 3. Burn (also retries tokens left over from an earlier failed burn)
    if (buyback.burn) {
      const burned = await burnAll(kp);
      if (burned) {
        Object.assign(run, { burnTx: burned.sig, tokensBurned: burned.tokens });
        totals.tokensBurned += burned.tokens;
        await persist();
      }
    }

    // 4. Send the games share to the Pig Bank
    if (TREASURY_WALLET && TREASURY_WALLET !== kp.publicKey.toBase58()) {
      const amount = (await balanceSol(kp.publicKey)) - totals.owedSol - GAS_RESERVE_SOL;
      if (amount >= MIN_SWEEP_SOL) {
        const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
        run.sweepTx = await sendIxs(kp, [SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: new PublicKey(TREASURY_WALLET), lamports })]);
        run.sweptSol = lamports / LAMPORTS_PER_SOL;
        totals.sweptSol += run.sweptSol;
      }
    }
  } catch (e) {
    run.error = e instanceof Error ? e.message.slice(0, 300) : "Unknown error";
    console.error("fee bot", e);
  } finally {
    totals.lastRunAt = now();
    const didSomething = run.claimTx || run.swapTx || run.burnTx || run.sweepTx || run.error;
    if (didSomething) await saveRun(run, totals);
    else await persist();
    await releaseLock();
  }
  return { run, totals };
}

/**
 * One cron call = one full run, then keep watching the fee vaults every 5s and
 * run again the moment a claim is due. With the cron firing every minute this
 * reacts within seconds, like usepaid (first claim 8–27s after launch, then one
 * every ~1m45s–2m while fees keep coming in, as little as ~0.001 SOL).
 * Vercel stops a call at 60s and a full run takes up to ~30s, so a new run is
 * only started in the first WATCH_MS; later fees are picked up by the next call.
 */
const WATCH_MS = 25_000;

export async function runBotWatching() {
  const started = Date.now();
  const runs = [await runBot()];
  const kp = botKeypair();
  if (!kp || runs[0].skipped) return runs;
  while (Date.now() - started < WATCH_MS) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const totals = await getTotals();
    const due = !totals.lastClaimAt || Date.now() / 1000 - totals.lastClaimAt >= CLAIM_EVERY_SEC;
    if (due && (await readUnclaimed(kp.publicKey)) >= MIN_CLAIM_SOL) runs.push(await runBot());
  }
  return runs;
}
