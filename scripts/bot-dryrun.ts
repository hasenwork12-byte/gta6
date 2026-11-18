// Dry run of the fee bot against mainnet. Signs and sends nothing; needs no secret key.
// usage: npx tsx scripts/bot-dryrun.ts <mint> [creatorWallet] [buybackSol] [burnHolder]
// With no creatorWallet, the coin's real creator (read from its bonding curve) is used.
const [mint, creatorArg, solArg, holderArg] = process.argv.slice(2);
if (!mint) throw new Error("usage: npx tsx scripts/bot-dryrun.ts <mint> [creatorWallet] [buybackSol] [burnHolder]");
process.env.NEXT_PUBLIC_TOKEN_MINT = mint;

(async () => {
  const { PublicKey, Connection } = await import("@solana/web3.js");
  const bot = await import("../src/lib/bot");
  const me = creatorArg ? new PublicKey(creatorArg) : (await bot.coinCreator()).creator;
  let holder = holderArg ? new PublicKey(holderArg) : me;
  if (!holderArg) {
    // Pick the biggest holder that is a normal wallet, for the burn check.
    const conn = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com");
    const top = await conn.getTokenLargestAccounts(new PublicKey(mint));
    for (const a of top.value.slice(0, 8)) {
      const info = await conn.getParsedAccountInfo(a.address);
      const owner = (info.value?.data as { parsed?: { info?: { owner?: string } } })?.parsed?.info?.owner;
      if (!owner) continue;
      const ownerAcc = await conn.getAccountInfo(new PublicKey(owner));
      if (ownerAcc && ownerAcc.owner.toBase58() === "11111111111111111111111111111111") { holder = new PublicKey(owner); break; }
    }
  }
  console.log(JSON.stringify(await bot.dryRunBot(me, Number(solArg || 0.001), holder), null, 2));
})();
