// Stock + queue check in demo mode with real signatures: 6 wallets claim the same platform/region
// (demo stock is 5), the 6th waits in the queue, then admin adds a code and it is delivered.
(async () => {
  for (const k of ["KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "NEXT_PUBLIC_TOKEN_MINT"]) delete process.env[k];
  process.env.DEMO_START_XP = "500";
  const { Keypair } = await import("@solana/web3.js");
  const { createPrivateKey, sign: edSign } = await import("crypto");
  const p = await import("../src/lib/points");
  const m = await import("../src/lib/redeem-message");
  const { points } = await import("../src/config");
  const sign = (kp: InstanceType<typeof Keypair>, msg: string) => edSign(null, Buffer.from(msg, "utf8"), createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(kp.secretKey.slice(0, 32))]), format: "der", type: "pkcs8" })).toString("base64");
  const platform = points.platforms[1].id, region = points.regions[0];
  const claim = async (kp: InstanceType<typeof Keypair>) => {
    const wallet = kp.publicKey.toBase58(), issuedAt = new Date().toISOString();
    return p.redeem({ wallet, kind: "self", recipient: "", platform, region, email: "", issuedAt,
      signature: sign(kp, m.buildRedeemMessage({ wallet, kind: "self", recipient: "", platform, region, issuedAt })) });
  };
  const wallets = Array.from({ length: 6 }, () => Keypair.generate());
  const results = [];
  for (const w of wallets) results.push(await claim(w));
  console.log("claims 1-5 delivered:", results.slice(0, 5).map((r: any) => r.delivered).join(","));
  console.log("claim 6 (stock empty):", JSON.stringify(results[5]));
  console.log("stock now:", (await p.getStockCounts())[`${platform}|${region}`] ?? 0);
  const add = await p.addStock(platform, region, ["REAL-LOOKING-TEST-CODE-123"], "TEST-PURCHASE-TX");
  console.log("admin adds 1 code:", JSON.stringify(add));
  const last = wallets[5], wallet = last.publicKey.toBase58(), id = (results[5] as any).id, issuedAt = new Date().toISOString();
  const reveal = await p.revealCode({ id, wallet, issuedAt, signature: sign(last, m.buildRevealMessage({ id, wallet, issuedAt })) });
  console.log("wallet 6 reveals:", JSON.stringify(reveal));
  const again = await claim(wallets[0]);
  console.log("wallet 1 claims again same day:", JSON.stringify(again));
})();
