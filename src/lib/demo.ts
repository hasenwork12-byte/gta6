// Deterministic DEMO data. Every surface that renders this shows a
// "DEMO DATA" badge, and demo rows never link to real transactions.
import { buyback, points } from "@/config";
import { dailySeries, dayStarts } from "./analytics";
import { summarizeBuybacks } from "./buyback";
import type { LedgerEntry, Redemption, TreasurySnapshot } from "./types";

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Fake numbers only when NEXT_PUBLIC_DEMO_DATA=true (local testing). Otherwise, before the
 * coin is live, every surface shows zeros and empty lists instead of made-up activity.
 */
export const SHOW_DEMO_DATA = process.env.NEXT_PUBLIC_DEMO_DATA === "true";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fakeAddr(r: () => number, len = 44) {
  let s = "";
  for (let i = 0; i < len; i++) s += B58[Math.floor(r() * B58.length)];
  return s;
}

// Fixed reference time so server and client render identical demo data.
const DEMO_NOW = Date.UTC(2026, 8, 25, 12, 0, 0) / 1000;
export const DEMO_SOL_USD = 185;

/** Demo token price in USD (250,000 tokens ≈ $100). */
export const DEMO_TOKEN_USD = 0.0004;

export function demoRedemptions(): Redemption[] {
  if (!SHOW_DEMO_DATA) return [];
  const r = rng(7);
  return Array.from({ length: 11 }, (_, i): Redemption => {
    const wallet = fakeAddr(r);
    const platform = r() > 0.5 ? "ps5" : "xbox";
    // A few gifts and team donations so every card type is visible in demo mode.
    const kind = i === 1 || i === 5 ? "gift" : i === 3 || i === 8 ? "team" : "self";
    const recipient = kind === "gift" ? fakeAddr(r) : null;
    return {
      id: `demo-${11 - i}`,
      wallet,
      kind,
      recipient,
      platform: kind === "team" || (kind === "gift" && i === 1) ? "" : platform,
      region: "Other",
      email: "",
      cost: points.redeemCost,
      createdAt: (DEMO_NOW - i * 3.2 * 86400) * 1000,
      claimedAt: null,
      status: i === 1 ? "unclaimed" : i < 3 ? "pending" : "fulfilled",
      tx: null,
      note: null,
      demo: true,
    };
  });
}

/** Deterministic starting points for any address in demo mode. */
export function demoPoints(addr: string) {
  // Local testing: give every wallet the same XP so the claim flow can be tried end to end.
  const start = Number(process.env.DEMO_START_XP);
  if (start > 0) return start;
  if (!SHOW_DEMO_DATA) return 0;
  let h = 7;
  for (const c of addr) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return Math.floor(rng(h)() * points.redeemCost * 1.5);
}

/** Demo total supply: 1B, a typical pump.fun launch. */
export const DEMO_SUPPLY = 1_000_000_000;
/** Demo fees sitting in the creator vaults, waiting for the bot. */
const DEMO_UNCLAIMED = 0.0842;

export function demoLedger(): LedgerEntry[] {
  if (!SHOW_DEMO_DATA) return [];
  const r = rng(42);
  const out: LedgerEntry[] = [];
  let t = DEMO_NOW;
  for (let i = 0; i < 130; i++) {
    t -= Math.floor(1800 + r() * 14000);
    const isPurchase = i % 19 === 4;
    out.push({
      signature: "DEMO" + fakeAddr(r, 60),
      time: t,
      direction: isPurchase ? "out" : "in",
      sol: isPurchase ? +(points.gamePriceUsd / DEMO_SOL_USD).toFixed(4) : +(0.02 + r() * 0.6).toFixed(4),
      counterparty: fakeAddr(r),
      label: isPurchase ? "Game purchase" : "Creator fee",
      kind: isPurchase ? "game" : "fee",
    });
  }
  // Scale the fees so they add up to the demo lifetime total (a bit more than 5x what the buybacks spent).
  const bb = demoBuybacks();
  const target = demoFeesSol(bb);
  const feeSum = out.filter((e) => e.kind === "fee").reduce((a, e) => a + e.sol, 0);
  for (const e of out) if (e.kind === "fee") e.sol = +((e.sol * target) / feeSum).toFixed(4);
  return [...out, ...bb].sort((a, b) => b.time - a.time);
}

/** Lifetime demo fees: enough that a small amount is still owed to the next buyback. */
function demoFeesSol(entries: LedgerEntry[]) {
  return (entries.filter((e) => e.kind === "buyback").reduce((a, e) => a + e.sol, 0) + 0.05) / buyback.share;
}

/** About two weeks of buybacks, one every ~2 days, each followed by a burn. Price drifts up a little. */
function demoBuybacks(): LedgerEntry[] {
  const r = rng(77);
  const out: LedgerEntry[] = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const time = DEMO_NOW - (n - i) * 2 * 86400 + Math.floor(r() * 20000);
    const sol = +(0.09 + r() * 0.07).toFixed(4);
    const price = DEMO_TOKEN_USD * (0.7 + i * 0.05);
    const tokens = Math.round((sol * DEMO_SOL_USD) / price);
    out.push({ signature: "DEMO" + fakeAddr(r, 60), time, direction: "out", sol, counterparty: null, label: "Buyback", kind: "buyback", tokens });
    if (buyback.burn) {
      out.push({ signature: "DEMO" + fakeAddr(r, 60), time: time + 300, direction: "out", sol: 0, counterparty: null, label: "Burn", kind: "burn", tokens });
    }
  }
  return out;
}

export function demoSnapshot(): TreasurySnapshot {
  if (!SHOW_DEMO_DATA) {
    const now = Math.floor(Date.now() / 1000);
    return {
      demo: true,
      treasuryWallet: "",
      balanceSol: 0,
      solUsd: DEMO_SOL_USD,
      totalFeesSol: 0,
      feesPartial: false,
      holders: 0,
      gamesRedeemed: 0,
      gamesDelivered: 0,
      updatedAt: now,
      buyback: summarizeBuybacks([], 0, null, false),
      fees: { bot: true, earnedSol: 0, claimedSol: 0, unclaimedSol: 0, lastClaimAt: null, lastRunAt: null },
      daily: dailySeries(dayStarts(now), [], [], buyback.burn, []),
      keysInStock: 0,
    };
  }
  const ledger = demoLedger();
  const spent = ledger.filter((e) => e.kind === "buyback").reduce((a, e) => a + e.sol, 0);
  // Whatever isn't spent on games or buybacks is the balance.
  const fees = demoFeesSol(ledger);
  const bb = summarizeBuybacks(ledger, fees, DEMO_SUPPLY, false);
  const games = ledger.filter((e) => e.kind === "game");
  const balanceSol = +(fees - games.reduce((a, e) => a + e.sol, 0) - spent).toFixed(4);
  return {
    demo: true,
    treasuryWallet: "DEMO-TREASURY",
    balanceSol,
    solUsd: DEMO_SOL_USD,
    totalFeesSol: +fees.toFixed(4),
    feesPartial: false,
    holders: 1843,
    gamesRedeemed: games.length + 2,
    gamesDelivered: games.length,
    updatedAt: DEMO_NOW,
    buyback: bb,
    fees: {
      bot: true,
      earnedSol: +(fees + DEMO_UNCLAIMED).toFixed(4),
      claimedSol: +fees.toFixed(4),
      unclaimedSol: DEMO_UNCLAIMED,
      // Relative to the real clock so the "last claim" timer looks alive in demo mode.
      lastClaimAt: Math.floor(Date.now() / 1000) - 754,
      lastRunAt: Math.floor(Date.now() / 1000) - 154,
    },
    daily: dailySeries(dayStarts(DEMO_NOW), ledger, bb.history, bb.burn, games.map((e) => e.time)),
    keysInStock: 7,
  };
}

/** Demo token balance for any address — deterministic, clearly labelled in UI. */
export function demoBalance(addr: string) {
  if (!SHOW_DEMO_DATA) return 0;
  let h = 0;
  for (const c of addr) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const r = rng(h);
  return Math.floor(r() * 600_000);
}
