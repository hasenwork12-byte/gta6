import { createHash, createPublicKey, randomUUID, verify } from "crypto";
import { PublicKey } from "@solana/web3.js";
import { CREATOR_WALLET, points, stockKey, TOKEN_LIVE, TREASURY_WALLET } from "@/config";
import { botAddress, coinCreator } from "./bot";
import { demoPoints, demoRedemptions } from "./demo";
import { decryptCode, encryptCode } from "./keyvault";
import { buildClaimMessage, buildRedeemMessage, buildRevealMessage } from "./redeem-message";
import { holderBalances, isValidAddress, tokenPriceUsd, walletTokenBalance } from "./solana";
import { getStore, POINTS_LIVE } from "./store";
import type { PointsInfo, PublicRedemption, Redemption, RedemptionKind } from "./types";

const DAY_MS = 86_400_000;
const g = globalThis as unknown as { __pigDemoStock?: boolean };
const store = () => {
  const s = getStore(demoPoints, demoRedemptions);
  // Demo mode: a few obviously fake codes so instant delivery can be tried locally.
  if (!POINTS_LIVE && !g.__pigDemoStock) {
    g.__pigDemoStock = true;
    for (const p of points.platforms) {
      for (const region of points.regions) {
        void s.addStock(
          stockKey(p.id, region),
          [1, 2, 3, 4, 5].map((n) => ({
            id: `demo-${p.id}-${region}-${n}`,
            enc: encryptCode(`DEMO-${p.id.toUpperCase()}-${n}-NOT-REAL`),
            tx: `DEMO-PURCHASE-${p.id}`,
            addedAt: Date.now(),
          })),
        );
      }
    }
  }
  return s;
};

let _excluded: { at: number; set: Set<string> } | null = null;
/**
 * Wallets that never earn XP, redeem or receive gifts: the Pig Bank, the dev wallet
 * (the coin's creator, read from pump.fun's bonding curve, so it can't be missed),
 * the bot wallet and anything in points.excluded.
 */
export async function excludedWallets(): Promise<Set<string>> {
  if (_excluded && Date.now() - _excluded.at < 10 * 60_000) return _excluded.set;
  const set = new Set([TREASURY_WALLET, CREATOR_WALLET, botAddress() ?? "", ...points.excluded].filter(Boolean));
  if (TOKEN_LIVE) {
    try {
      set.add((await coinCreator()).creator.toBase58());
    } catch {
      // Not readable right now (RPC hiccup): the configured wallets above still apply.
    }
  }
  _excluded = { at: Date.now(), set };
  return set;
}
const isExcluded = async (w: string) => (await excludedWallets()).has(w);

export async function listRedemptions(): Promise<Redemption[]> {
  return store().listRedemptions();
}

export async function listPublicRedemptions(): Promise<{ rows: PublicRedemption[]; demo: boolean }> {
  const rows = (await listRedemptions())
    .filter((r) => r.status !== "rejected")
    .map(({ id, wallet, kind, recipient, platform, createdAt, status, tx, demo }) => ({
      id,
      wallet,
      kind: kind ?? "self",
      recipient: recipient ?? null,
      platform,
      createdAt,
      status,
      tx,
      demo: Boolean(demo) || !POINTS_LIVE,
    }));
  return { rows, demo: !POINTS_LIVE };
}

export async function getPointsInfo(wallet: string): Promise<PointsInfo> {
  const [bal, price, p, meta, all] = await Promise.all([
    walletTokenBalance(wallet),
    tokenPriceUsd(),
    store().getPoints(wallet),
    store().getSnapMeta(),
    store().listRedemptions(),
  ]);
  const now = Date.now();
  const windowMs = points.cooldownDays * DAY_MS;
  const usdValue = bal * price;
  const cooldownUntil = p.lastRedeemAt && now - p.lastRedeemAt < windowMs ? p.lastRedeemAt + windowMs : null;
  const donationsUsed = all.filter(
    (r) => r.wallet === wallet && (r.kind ?? "self") !== "self" && r.status !== "rejected" && now - r.createdAt < windowMs,
  ).length;
  const giftsToClaim = all
    .filter((r) => r.kind === "gift" && r.status === "unclaimed" && r.recipient === wallet)
    .map((r) => ({ id: r.id, from: r.wallet, createdAt: r.createdAt }));
  const myCodes = all
    .filter((r) => ownsCode(r, wallet) && (r.status === "pending" || r.status === "fulfilled"))
    .map((r) => ({
      id: r.id,
      kind: r.kind ?? "self",
      platform: r.platform,
      region: r.region,
      createdAt: r.createdAt,
      status: r.status,
      hasCode: Boolean(r.keyId),
      revealed: (r.revealCount ?? 0) > 0,
    }));
  return {
    demo: !POINTS_LIVE,
    wallet,
    tokenBalance: bal,
    usdValue,
    points: p.centi / 100,
    lastDay: p.lastDayCenti / 100,
    perDay: (await isExcluded(wallet)) ? 0 : usdValue / points.usdPerPointDay,
    cost: points.redeemCost,
    cooldownUntil,
    donationsUsed,
    donationsMax: points.maxDonationsPerWindow,
    giftsToClaim,
    myCodes,
    lastSnapshotAt: meta?.at ?? null,
  };
}

/**
 * Daily points snapshot (called by Vercel Cron).
 * A wallet earns for the lower of its balances at this and the previous
 * snapshot, valued at the lower of the two prices — so buying just before a
 * snapshot or pumping the price at snapshot time doesn't pay.
 */
export async function runSnapshot(now = Date.now()) {
  if (!POINTS_LIVE) throw new Error("Points are in demo mode — set the token mint and Redis first.");
  const meta = await store().getSnapMeta();
  if (meta && now - meta.at < 22 * 3_600_000) {
    return { skipped: true, reason: "Last snapshot was less than 22h ago", lastAt: meta.at };
  }
  const [balances, price] = await Promise.all([holderBalances(), tokenPriceUsd()]);
  if (!(price > 0)) throw new Error("Could not fetch token price");

  const prev = meta ? await store().getSnapBalances() : {};
  const usePrice = meta ? Math.min(meta.price, price) : price;
  const awardsCenti: Record<string, number> = {};
  let issued = 0;
  if (meta) {
    const excluded = await excludedWallets();
    for (const [owner, bal] of Object.entries(balances)) {
      if (excluded.has(owner) || !prev[owner]) continue;
      const held = Math.min(prev[owner], bal);
      const centi = Math.floor(((held * usePrice) / points.usdPerPointDay) * 100);
      if (centi > 0) {
        awardsCenti[owner] = centi;
        issued += centi;
      }
    }
  }
  await store().applySnapshot({
    balances,
    awardsCenti,
    meta: { at: now, price },
    day: { at: now, price: usePrice, holders: Object.keys(balances).length, awarded: Object.keys(awardsCenti).length, pointsIssued: issued / 100 },
  });
  return {
    skipped: false,
    firstSnapshot: !meta,
    holders: Object.keys(balances).length,
    walletsAwarded: Object.keys(awardsCenti).length,
    pointsIssued: issued / 100,
    price: usePrice,
  };
}

// ── Redemption ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function verifySignature(wallet: string, message: string, signatureB64: string) {
  try {
    const raw = new PublicKey(wallet).toBytes();
    const der = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(raw)]);
    const key = createPublicKey({ key: der, format: "der", type: "spki" });
    return verify(null, Buffer.from(message, "utf8"), key, Buffer.from(signatureB64, "base64"));
  } catch {
    return false;
  }
}

type Result = { ok: true; id: string; delivered?: boolean; code?: string } | { ok: false; error: string; status: number };
const bad = (error: string, status = 400) => ({ ok: false as const, error, status });

function checkDelivery(platform: string, region: string, email: string) {
  if (!points.platforms.some((p) => p.id === platform)) return bad("Choose PlayStation 5 or Xbox Series X|S.");
  if (!points.regions.includes(region)) return bad("Choose your region.");
  // Codes are delivered on the site; email is optional (for a heads-up if the request has to wait).
  if (email && (!EMAIL_RE.test(email) || email.length > 200)) return bad("That email doesn't look right.");
  return null;
}

/** Tries to hand a code from stock to a pending self/gift redemption. Returns true if delivered. */
async function tryAssign(id: string): Promise<boolean> {
  const r = await store().getRedemption(id);
  if (!r || r.status !== "pending" || (r.kind ?? "self") === "team" || !r.platform || !r.region) return false;
  return (await store().assignFromStock(id, r.platform, r.region, Date.now())) === "ok";
}

/** Anyone waiting (oldest first) gets codes as soon as matching stock exists. */
async function fillQueue(platform: string, region: string) {
  const waiting = (await store().listRedemptions())
    .filter((r) => r.status === "pending" && (r.kind ?? "self") !== "team" && r.platform === platform && r.region === region)
    .sort((a, b) => (a.claimedAt ?? a.createdAt) - (b.claimedAt ?? b.createdAt));
  let delivered = 0;
  for (const r of waiting) {
    const res = await store().assignFromStock(r.id, platform, region, Date.now());
    if (res === "empty") break;
    if (res === "ok") delivered++;
  }
  return delivered;
}

async function checkSignature(wallet: string, message: string, issuedAt: string, signature: string) {
  const issued = Date.parse(issuedAt);
  if (!Number.isFinite(issued) || Math.abs(Date.now() - issued) > 10 * 60_000) return bad("Signature expired — please sign again.");
  if (!verifySignature(wallet, message, signature)) return bad("Signature check failed.", 401);
  const nonce = createHash("sha256").update(signature).digest("hex");
  if (!(await store().useNonce(nonce, 3600))) return bad("This signature was already used.", 409);
  return null;
}

export type RedeemRequest = {
  wallet: string;
  kind: RedemptionKind;
  recipient: string;
  platform: string;
  region: string;
  email: string;
  issuedAt: string;
  signature: string; // base64
};

export async function redeem(req: RedeemRequest): Promise<Result> {
  const kind = req.kind;
  if (kind !== "self" && kind !== "gift") return bad("Choose who the copy is for.");
  if (await isExcluded(req.wallet)) return bad("This wallet can't redeem.", 403);
  if (kind === "self") {
    const err = checkDelivery(req.platform, req.region, req.email);
    if (err) return err;
  }
  if (kind === "gift") {
    if (!isValidAddress(req.recipient)) return bad("Enter a valid recipient wallet address.");
    if (req.recipient === req.wallet) return bad("To redeem for yourself, choose “For me”.");
    if (await isExcluded(req.recipient)) return bad("That wallet can't receive gifts.");
  }

  const message = buildRedeemMessage({ ...req, kind });
  const sigErr = await checkSignature(req.wallet, message, req.issuedAt, req.signature);
  if (sigErr) return sigErr;

  const rec: Redemption = {
    id: randomUUID().slice(0, 8),
    wallet: req.wallet,
    kind,
    recipient: kind === "gift" ? req.recipient : null,
    platform: kind === "self" ? req.platform : "",
    region: kind === "self" ? req.region : "",
    email: kind === "self" ? req.email.trim() : "",
    cost: points.redeemCost,
    createdAt: Date.now(),
    claimedAt: null,
    status: kind === "gift" ? "unclaimed" : "pending",
    tx: null,
    note: null,
    ...(POINTS_LIVE ? {} : { demo: true }),
  };
  const outcome = await store().redeem(rec, points.redeemCost * 100, {
    windowMs: points.cooldownDays * DAY_MS,
    maxPending: points.maxPendingRedemptions,
    maxDonations: points.maxDonationsPerWindow,
  });
  switch (outcome) {
    case "ok":
      if (kind !== "self") return { ok: true, id: rec.id, delivered: false };
      const delivered = await tryAssign(rec.id);
      // Demo mode: hand the code straight back. Serverless instances don't share demo memory,
      // so a later reveal request may land on one that never saw this claim.
      const item = delivered && !POINTS_LIVE ? await store().getAssignedCode(rec.id) : null;
      return { ok: true, id: rec.id, delivered, ...(item ? { code: decryptCode(item.enc) } : {}) };
    case "insufficient":
      return bad(`You need ${points.redeemCost.toLocaleString()} points to redeem.`, 402);
    case "cooldown":
      return bad(`You can redeem a copy for yourself once every ${points.cooldownDays} days — you can still gift a copy.`, 429);
    case "donation_limit":
      return bad(`Each wallet can gift up to ${points.maxDonationsPerWindow} copies every ${points.cooldownDays} days.`, 429);
    case "queue_full":
      return bad("The redemption queue is full while the treasury catches up. Your points are safe — try again soon.", 503);
  }
}

export type ClaimRequest = { id: string; wallet: string; platform: string; region: string; email: string; issuedAt: string; signature: string };

/** The gift's recipient chooses platform/region/email; the gift then joins the queue. */
export async function claimGift(req: ClaimRequest): Promise<Result> {
  const err = checkDelivery(req.platform, req.region, req.email);
  if (err) return err;
  const gift = await store().getRedemption(req.id);
  if (!gift || gift.kind !== "gift") return bad("Gift not found.", 404);
  if (gift.recipient !== req.wallet) return bad("This gift was sent to a different wallet.", 403);
  if (gift.status !== "unclaimed") return bad("This gift has already been claimed.", 409);

  const sigErr = await checkSignature(req.wallet, buildClaimMessage(req), req.issuedAt, req.signature);
  if (sigErr) return sigErr;

  const outcome = await store().claimGift(req.id, req.wallet, {
    platform: req.platform,
    region: req.region,
    email: req.email.trim(),
    claimedAt: Date.now(),
  });
  switch (outcome) {
    case "ok":
      return { ok: true, id: req.id, delivered: await tryAssign(req.id) };
    case "not_found":
      return bad("Gift not found.", 404);
    case "not_yours":
      return bad("This gift was sent to a different wallet.", 403);
    case "not_claimable":
      return bad("This gift has already been claimed.", 409);
  }
}

// ── Code stock & delivery ────────────────────────────────────────────────────

const ownsCode = (r: Redemption, wallet: string) =>
  (r.kind ?? "self") === "gift" ? r.recipient === wallet : (r.kind ?? "self") === "self" && r.wallet === wallet;

export async function getStockCounts(): Promise<Record<string, number>> {
  return store().stockCounts();
}

/** Admin adds purchased codes; waiting requests for that platform+region are served first. */
export async function addStock(platform: string, region: string, codes: string[], tx: string) {
  if (!points.platforms.some((p) => p.id === platform)) throw new Error("Unknown platform.");
  if (!points.regions.includes(region)) throw new Error("Unknown region.");
  if (!tx.trim()) throw new Error("Add the purchase transaction so each delivery has a verifiable receipt.");
  const clean = [...new Set(codes.map((c) => c.trim()).filter(Boolean))];
  if (!clean.length) throw new Error("Paste at least one code (one per line).");
  const now = Date.now();
  await store().addStock(
    stockKey(platform, region),
    clean.map((c) => ({ id: randomUUID().slice(0, 8), enc: encryptCode(c), tx: tx.trim(), addedAt: now })),
  );
  const delivered = await fillQueue(platform, region);
  return { added: clean.length, deliveredToQueue: delivered };
}

/** Admin: take a code from stock for a team donation and show it once. */
export async function assignTeamCode(id: string, platform: string, region: string) {
  const r = await store().getRedemption(id);
  if (!r || r.kind !== "team") throw new Error("Not a team donation.");
  const res = await store().assignFromStock(id, platform, region, Date.now());
  if (res === "empty") throw new Error("No codes in stock for that platform and region.");
  if (res !== "ok") throw new Error("This donation isn't pending.");
  const item = await store().getAssignedCode(id);
  return item ? decryptCode(item.enc) : null;
}

export type RevealRequest = { id: string; wallet: string; issuedAt: string; signature: string };

/** The owner signs a message to see their code. */
export async function revealCode(req: RevealRequest): Promise<{ ok: true; code: string } | { ok: false; error: string; status: number }> {
  const r = await store().getRedemption(req.id);
  if (!r || !ownsCode(r, req.wallet)) return bad("Code not found for this wallet.", 404);
  if (r.status !== "fulfilled") return bad("This code hasn't been delivered yet.", 409);
  const item = await store().getAssignedCode(req.id);
  if (!item) return bad("This copy was delivered by the team directly — check your email or contact us.", 404);
  const sigErr = await checkSignature(req.wallet, buildRevealMessage(req), req.issuedAt, req.signature);
  if (sigErr) return sigErr;
  const code = decryptCode(item.enc);
  await store().markRevealed(req.id, Date.now());
  return { ok: true, code };
}

export async function resolveRedemption(id: string, action: "fulfill" | "reject", tx: string | null, note: string | null) {
  return store().resolveRedemption(id, action === "fulfill" ? "fulfilled" : "rejected", tx, note);
}
