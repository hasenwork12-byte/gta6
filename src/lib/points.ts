import { createHash, createPublicKey, randomUUID, verify } from "crypto";
import { PublicKey } from "@solana/web3.js";
import { points, TREASURY_WALLET } from "@/config";
import { demoPoints, demoRedemptions } from "./demo";
import { buildRedeemMessage } from "./redeem-message";
import { holderBalances, tokenPriceUsd, walletTokenBalance } from "./solana";
import { getStore, POINTS_LIVE } from "./store";
import type { PointsInfo, PublicRedemption, Redemption } from "./types";

const DAY_MS = 86_400_000;
const store = () => getStore(demoPoints, demoRedemptions);

const isExcluded = (w: string) => w === TREASURY_WALLET || points.excluded.includes(w);

export async function listRedemptions(): Promise<Redemption[]> {
  return store().listRedemptions();
}

export async function listPublicRedemptions(): Promise<{ rows: PublicRedemption[]; demo: boolean }> {
  const rows = (await listRedemptions())
    .filter((r) => r.status !== "rejected")
    .map(({ id, wallet, platform, createdAt, status, tx, demo }) => ({
      id,
      wallet,
      platform,
      createdAt,
      status,
      tx,
      demo: Boolean(demo) || !POINTS_LIVE,
    }));
  return { rows, demo: !POINTS_LIVE };
}

export async function getPointsInfo(wallet: string): Promise<PointsInfo> {
  const [bal, price, p, meta] = await Promise.all([
    walletTokenBalance(wallet),
    tokenPriceUsd(),
    store().getPoints(wallet),
    store().getSnapMeta(),
  ]);
  const usdValue = bal * price;
  const cooldownUntil =
    p.lastRedeemAt && Date.now() - p.lastRedeemAt < points.cooldownDays * DAY_MS
      ? p.lastRedeemAt + points.cooldownDays * DAY_MS
      : null;
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

export type RedeemRequest = {
  wallet: string;
  platform: string;
  region: string;
  email: string;
  issuedAt: string;
  signature: string; // base64
};

export async function redeem(req: RedeemRequest): Promise<{ ok: true; id: string } | { ok: false; error: string; status: number }> {
  const bad = (error: string, status = 400) => ({ ok: false as const, error, status });

  if (!points.platforms.some((p) => p.id === req.platform)) return bad("Choose PlayStation 5 or Xbox Series X|S.");
  if (!points.regions.includes(req.region)) return bad("Choose your region.");
  if (!EMAIL_RE.test(req.email) || req.email.length > 200) return bad("Enter a valid email for code delivery.");
  if (isExcluded(req.wallet)) return bad("This wallet can't redeem.", 403);

  const issued = Date.parse(req.issuedAt);
  if (!Number.isFinite(issued) || Math.abs(Date.now() - issued) > 10 * 60_000) {
    return bad("Signature expired — please sign again.");
  }
  const message = buildRedeemMessage(req);
  if (!verifySignature(req.wallet, message, req.signature)) return bad("Signature check failed.", 401);

  const nonce = createHash("sha256").update(req.signature).digest("hex");
  if (!(await store().useNonce(nonce, 3600))) return bad("This signature was already used.", 409);

  const rec: Redemption = {
    id: randomUUID().slice(0, 8),
    wallet: req.wallet,
    platform: req.platform,
    region: req.region,
    email: req.email.trim(),
    cost: points.redeemCost,
    createdAt: Date.now(),
    status: "pending",
    tx: null,
    note: null,
    ...(POINTS_LIVE ? {} : { demo: true }),
  };
  const outcome = await store().redeem(rec, points.redeemCost * 100, points.cooldownDays * DAY_MS, points.maxPendingRedemptions);
  switch (outcome) {
    case "ok":
      return { ok: true, id: rec.id };
    case "insufficient":
      return bad(`You need ${points.redeemCost.toLocaleString()} points to redeem.`, 402);
    case "cooldown":
      return bad(`Each wallet can redeem once every ${points.cooldownDays} days.`, 429);
    case "queue_full":
      return bad("The redemption queue is full while the treasury catches up. Your points are safe — try again soon.", 503);
  }
}

export async function resolveRedemption(id: string, action: "fulfill" | "reject", tx: string | null, note: string | null) {
  return store().resolveRedemption(id, action === "fulfill" ? "fulfilled" : "rejected", tx, note);
}
