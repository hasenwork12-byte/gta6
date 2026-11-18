// End-to-end check of "Gift a wallet" in demo mode with real ed25519 signatures:
// A gifts B -> B sees the gift -> B claims (platform+region) -> B reveals the code; A can't.
(async () => {
  for (const k of ["KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "NEXT_PUBLIC_TOKEN_MINT"]) delete process.env[k];
  process.env.DEMO_START_XP = "500";
  const { Keypair } = await import("@solana/web3.js");
  const { createPrivateKey, sign: edSign } = await import("crypto");
  const p = await import("../src/lib/points");
  const m = await import("../src/lib/redeem-message");
  const { points } = await import("../src/config");
  const sign = (kp: InstanceType<typeof Keypair>, msg: string) => edSign(null, Buffer.from(msg, "utf8"), createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(kp.secretKey.slice(0, 32))]), format: "der", type: "pkcs8" })).toString("base64");
  const A = Keypair.generate(), B = Keypair.generate();
  const a = A.publicKey.toBase58(), b = B.publicKey.toBase58();
  const platform = points.platforms[0].id, region = points.regions[0];
  const step = (name: string, v: unknown) => console.log(name.padEnd(34), JSON.stringify(v));

  let at = new Date().toISOString();
  const gift = await p.redeem({ wallet: a, kind: "gift", recipient: b, platform: "", region: "", email: "", issuedAt: at,
    signature: sign(A, m.buildRedeemMessage({ wallet: a, kind: "gift", recipient: b, platform: "", region: "", issuedAt: at })) });
  step("1. A sends gift to B", gift);
  if (!gift.ok) return;
  const id = (gift as { id: string }).id;

  step("2. A's XP after gifting", (await p.getPointsInfo(a)).points);
  const bInfo = await p.getPointsInfo(b);
  step("3. B sees gift waiting", bInfo.giftsToClaim.map((g) => ({ id: g.id, from: g.from === a })));

  at = new Date().toISOString();
  const claim = await p.claimGift({ id, wallet: b, platform, region, email: "", issuedAt: at,
    signature: sign(B, m.buildClaimMessage({ id, wallet: b, platform, region, issuedAt: at })) });
  step("4. B claims it (" + platform + ", " + region + ")", claim);

  at = new Date().toISOString();
  const reveal = await p.revealCode({ id, wallet: b, issuedAt: at, signature: sign(B, m.buildRevealMessage({ id, wallet: b, issuedAt: at })) });
  step("5. B reveals the code", reveal);

  at = new Date().toISOString();
  const steal = await p.revealCode({ id, wallet: a, issuedAt: at, signature: sign(A, m.buildRevealMessage({ id, wallet: a, issuedAt: at })) });
  step("6. A tries to reveal B's code", steal);

  at = new Date().toISOString();
  const again = await p.claimGift({ id, wallet: b, platform, region, email: "", issuedAt: at,
    signature: sign(B, m.buildClaimMessage({ id, wallet: b, platform, region, issuedAt: at })) });
  step("7. B claims the same gift twice", again);

  at = new Date().toISOString();
  const team = await p.redeem({ wallet: a, kind: "team" as never, recipient: "", platform: "", region: "", email: "", issuedAt: at,
    signature: sign(A, m.buildRedeemMessage({ wallet: a, kind: "team" as never, recipient: "", platform: "", region: "", issuedAt: at })) });
  step("8. Team donation (should be refused)", team);
})();
