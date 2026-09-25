import { createHash, createPublicKey, randomUUID, verify } from "crypto";
import { PublicKey } from "@solana/web3.js";
import { points, TREASURY_WALLET } from "@/config";
import { demoPoints, demoRedemptions, demoTopHolders } from "./demo";
import { buildClaimMessage, buildRedeemMessage } from "./redeem-message";
import { holderBalances, isValidAddress, tokenPriceUsd, walletTokenBalance } from "./solana";
import { getStore, POINTS_LIVE } from "./store";
import type { PointsInfo, PublicRedemption, Redemption, RedemptionKind } from "./types";

const DAY_MS = 86_400_000;
const store = () => getStore(demoPoints, demoRedemptions);

const isExcluded = (w: string) => w === TREASURY_WALLET || points.excluded.includes(w);

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

export async function getTopHolders(limit = 20): Promise<{ rows: { wallet: string; points: number }[]; demo: boolean }> {
  if (!POINTS_LIVE) return { rows: demoTopHolders(limit), demo: true };
  const rows = (await store().topPoints(limit)).map((x) => ({ wallet: x.wallet, points: x.centi / 100 }));
  return { rows, demo: false };
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
  return {
    demo: !POINTS_LIVE,
    wallet,
    tokenBalance: bal,
    usdValue,
    points: p.centi / 100,
    lastDay: p.lastDayCenti / 100,
    perDay: isExcluded(wallet) ? 0 : usdValue / points.usdPerPointDay,
    cost: points.redeemCost,
    cooldownUntil,
    donationsUsed,
    donationsMax: points.maxDonationsPerWindow,
    giftsToClaim,
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
    for (const [owner, bal] of Object.entries(balances)) {
      if (isExcluded(owner) || !prev[owner]) continue;
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

type Result = { ok: true; id: string } | { ok: false; error: string; status: number };
const bad = (error: string, status = 400) => ({ ok: false as const, error, status });

function checkDelivery(platform: string, region: string, email: string) {
  if (!points.platforms.some((p) => p.id === platform)) return bad("Choose PlayStation 5 or Xbox Series X|S.");
  if (!points.regions.includes(region)) return bad("Choose your region.");
  if (!EMAIL_RE.test(email) || email.length > 200) return bad("Enter a valid email for code delivery.");
  return null;
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
  if (kind !== "self" && kind !== "gift" && kind !== "team") return bad("Choose who the copy is for.");
  if (isExcluded(req.wallet)) return bad("This wallet can't redeem.", 403);
  if (kind === "self") {
    const err = checkDelivery(req.platform, req.region, req.email);
    if (err) return err;
  }
  if (kind === "gift") {
    if (!isValidAddress(req.recipient)) return bad("Enter a valid recipient wallet address.");
    if (req.recipient === req.wallet) return bad("To redeem for yourself, choose “For me”.");
    if (isExcluded(req.recipient)) return bad("That wallet can't receive gifts.");
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
      return { ok: true, id: rec.id };
    case "insufficient":
      return bad(`You need ${points.redeemCost.toLocaleString()} points to redeem.`, 402);
    case "cooldown":
      return bad(`You can redeem a copy for yourself once every ${points.cooldownDays} days — you can still gift or donate.`, 429);
    case "donation_limit":
      return bad(`Each wallet can gift or donate up to ${points.maxDonationsPerWindow} copies every ${points.cooldownDays} days.`, 429);
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
      return { ok: true, id: req.id };
    case "not_found":
      return bad("Gift not found.", 404);
    case "not_yours":
      return bad("This gift was sent to a different wallet.", 403);
    case "not_claimable":
      return bad("This gift has already been claimed.", 409);
  }
}

export async function resolveRedemption(id: string, action: "fulfill" | "reject", tx: string | null, note: string | null) {
  return store().resolveRedemption(id, action === "fulfill" ? "fulfilled" : "rejected", tx, note);
}
