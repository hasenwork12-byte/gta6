// Finds recent pump.fun coins whose creator is a normal wallet with SOL and fees waiting (for dry runs).
(async () => {
  const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import("@solana/web3.js");
  const conn = new Connection(process.env.SOLANA_RPC_URL!);
  const lists = await Promise.all([
    fetch("https://api.dexscreener.com/token-profiles/latest/v1").then((r) => r.json()),
    fetch("https://api.dexscreener.com/token-boosts/latest/v1").then((r) => r.json()),
  ]);
  const mints = [...new Set(lists.flat().filter((t: any) => t.chainId === "solana" && t.tokenAddress?.endsWith("pump")).map((t: any) => t.tokenAddress))];
  const PUMP = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
  for (const m of mints.slice(0, 40) as string[]) {
    process.env.NEXT_PUBLIC_TOKEN_MINT = m;
    const curve = await conn.getAccountInfo(PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), new PublicKey(m).toBuffer()], PUMP)[0]);
    if (!curve) continue;
    const creator = new PublicKey(curve.data.subarray(49, 81));
    const acc = await conn.getAccountInfo(creator);
    if (!acc || acc.owner.toBase58() !== "11111111111111111111111111111111" || acc.data.length) continue;
    const { readUnclaimed } = await import("../src/lib/bot");
    const un = await readUnclaimed(creator);
    console.log(m, creator.toBase58(), "bal", (acc.lamports / LAMPORTS_PER_SOL).toFixed(4), "unclaimed", un.toFixed(4), "graduated", curve.data[48] === 1);
  }
})();
