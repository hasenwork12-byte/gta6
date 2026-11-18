// Checks that a bot run's receipts (run log + per-day sums) show up in the site's snapshot.
// Uses the in-memory store and a throwaway key; signs and sends nothing.
(async () => {
  const { Keypair } = await import("@solana/web3.js");
  const [mint, creator] = process.argv.slice(2);
  process.env.NEXT_PUBLIC_TOKEN_MINT = mint;
  process.env.NEXT_PUBLIC_TREASURY_WALLET = creator;
  process.env.BOT_SECRET_KEY = JSON.stringify(Array.from(Keypair.generate().secretKey));
  for (const k of ["KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]) delete process.env[k];
  const log = await import("../src/lib/botlog");
  const { getSnapshot } = await import("../src/lib/solana");
  const now = Math.floor(Date.now() / 1000);
  // Exactly what runBot writes after a claim of 0.25 SOL, a 0.05 SOL buyback and its burn.
  const totals = await log.getTotals();
  Object.assign(totals, { claimedSol: 0.25, owedSol: 0, buybackSol: 0.05, tokensBought: 1_500_000, tokensBurned: 1_500_000, lastClaimAt: now, lastRunAt: now });
  await log.addToDay(now, { claimedSol: 0.25 });
  await log.addToDay(now, { burnSol: 0.05, burnTokens: 1_500_000 });
  await log.saveRun({ at: now, claimTx: "TESTCLAIM", claimedSol: 0.25, swapTx: "TESTSWAP", buybackSol: 0.05, tokensBought: 1_500_000, burnTx: "TESTBURN", tokensBurned: 1_500_000 }, totals);
  const s: any = await getSnapshot();
  const today = s.daily?.[s.daily.length - 1];
  console.log(JSON.stringify({ demo: s.demo, fees: s.fees, totalFeesSol: s.totalFeesSol, buyback: { ...s.buyback, history: s.buyback?.history?.slice(0, 2) }, today }, null, 2));
})();
