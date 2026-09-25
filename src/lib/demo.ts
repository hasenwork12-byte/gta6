// Deterministic DEMO data. Every surface that renders this shows a
// "DEMO DATA" badge, and demo rows never link to real transactions.
import { points } from "@/config";
import type { LedgerEntry, Redemption, TreasurySnapshot } from "./types";

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

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
  const r = rng(7);
  return Array.from({ length: 11 }, (_, i) => ({
    id: `demo-${11 - i}`,
    wallet: fakeAddr(r),
    platform: r() > 0.5 ? "ps5" : "xbox",
    region: "Other",
    email: "",
    cost: points.redeemCost,
    createdAt: (DEMO_NOW - i * 3.2 * 86400) * 1000,
    status: i < 2 ? "pending" : "fulfilled",
    tx: null,
    note: null,
    demo: true,
  }));
}

/** Deterministic starting points for any address in demo mode. */
export function demoPoints(addr: string) {
  let h = 7;
  for (const c of addr) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return Math.floor(rng(h)() * 1500);
}

export function demoLedger(): LedgerEntry[] {
  const r = rng(42);
  const out: LedgerEntry[] = [];
  let t = DEMO_NOW;
  for (let i = 0; i < 48; i++) {
    t -= Math.floor(1800 + r() * 14000);
    const isPurchase = i % 9 === 4;
    out.push({
      signature: "DEMO" + fakeAddr(r, 60),
      time: t,
      direction: isPurchase ? "out" : "in",
      sol: isPurchase ? +(points.gamePriceUsd / DEMO_SOL_USD).toFixed(4) : +(0.02 + r() * 0.6).toFixed(4),
      counterparty: fakeAddr(r),
      label: isPurchase ? "Game purchase" : "Creator fee",
    });
  }
  return out;
}

export function demoSnapshot(): TreasurySnapshot {
  // ≈ $42 of $70 toward the next copy; lifetime fees = 9 copies bought + balance.
  const delivered = 9;
  const balanceSol = 0.2297;
  return {
    demo: true,
    treasuryWallet: "DEMO-TREASURY",
    balanceSol,
    solUsd: DEMO_SOL_USD,
    totalFeesSol: +(balanceSol + (delivered * points.gamePriceUsd) / DEMO_SOL_USD).toFixed(4),
    feesPartial: false,
    holders: 1843,
    gamesRedeemed: 11,
    gamesDelivered: delivered,
    updatedAt: DEMO_NOW,
  };
}

/** Demo token balance for any address — deterministic, clearly labelled in UI. */
export function demoBalance(addr: string) {
  let h = 0;
  for (const c of addr) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const r = rng(h);
  return Math.floor(r() * 600_000);
}
