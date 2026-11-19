// Log of everything the fee bot does: claims, buybacks, burns and sweeps.
// Stored in the same Upstash Redis as points; in memory when there's no Redis.
// The ledger scanner only sees the latest Pig Bank transactions, so this log is
// what keeps the full buyback & burn history (with tx ids) on the site.
import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const redis = url && token ? new Redis({ url, token }) : null;

const K = { runs: "bot:runs", totals: "bot:totals", lock: "bot:lock" };
const MAX_RUNS = 1000;

/** One bot run. Only the steps that actually happened are filled in. */
export type BotRun = {
  at: number; // unix seconds
  claimTx?: string;
  claimedSol?: number;
  swapTx?: string;
  buybackSol?: number;
  tokensBought?: number;
  burnTx?: string;
  tokensBurned?: number;
  sweepTx?: string;
  sweptSol?: number;
  error?: string;
};

export type BotTotals = {
  claimedSol: number;
  buybackSol: number;
  tokensBought: number;
  tokensBurned: number;
  sweptSol: number;
  /** Buyback share of claimed fees not spent yet; carried to the next run. */
  owedSol: number;
  lastClaimAt: number | null;
  lastRunAt: number | null;
  /** Coin the bot found on its own before NEXT_PUBLIC_TOKEN_MINT was deployed. */
  mint?: string;
};

const EMPTY: BotTotals = {
  claimedSol: 0,
  buybackSol: 0,
  tokensBought: 0,
  tokensBurned: 0,
  sweptSol: 0,
  owedSol: 0,
  lastClaimAt: null,
  lastRunAt: null,
};

const mem = globalThis as unknown as { __pigBot?: { runs: BotRun[]; totals: BotTotals; lockUntil: number } };
const m = () => (mem.__pigBot ??= { runs: [], totals: { ...EMPTY }, lockUntil: 0 });

export async function getTotals(): Promise<BotTotals> {
  if (!redis) return { ...m().totals };
  const t = await redis.get<BotTotals>(K.totals);
  return { ...EMPTY, ...(t ?? {}) };
}

/** Newest first. */
export async function listRuns(limit = 200): Promise<BotRun[]> {
  if (!redis) return m().runs.slice(0, limit);
  return (await redis.lrange<BotRun>(K.runs, 0, limit - 1)) ?? [];
}

/** Saves a run and the updated totals. */
export async function saveRun(run: BotRun, totals: BotTotals) {
  if (!redis) {
    m().runs.unshift(run);
    m().runs.length = Math.min(m().runs.length, MAX_RUNS);
    m().totals = totals;
    return;
  }
  await redis.lpush(K.runs, run);
  await redis.ltrim(K.runs, 0, MAX_RUNS - 1);
  await redis.set(K.totals, totals);
}

export async function saveTotals(totals: BotTotals) {
  if (!redis) m().totals = totals;
  else await redis.set(K.totals, totals);
}

/** Only one run at a time (cron + manual trigger could overlap). */
export async function takeLock(seconds: number): Promise<boolean> {
  if (!redis) {
    if (Date.now() < m().lockUntil) return false;
    m().lockUntil = Date.now() + seconds * 1000;
    return true;
  }
  return (await redis.set(K.lock, "1", { nx: true, ex: seconds })) === "OK";
}

export async function releaseLock() {
  if (!redis) m().lockUntil = 0;
  else await redis.del(K.lock);
}

/** Per-UTC-day sums kept for good (the run list above is trimmed), for the analytics bars. */
export type BotDay = { claimedSol: number; burnSol: number; burnTokens: number };
const dayKey = (unix: number) => `bot:day:${new Date(unix * 1000).toISOString().slice(0, 10)}`;
const memDays = globalThis as unknown as { __pigBotDays?: Record<string, BotDay> };
const md = () => (memDays.__pigBotDays ??= {});

/** Adds to the day's sums. `burnSol` = what the burned tokens cost to buy. */
export async function addToDay(unix: number, add: Partial<BotDay>) {
  const key = dayKey(unix);
  const fields = Object.entries(add).filter(([, v]) => v && v > 0) as [keyof BotDay, number][];
  if (!fields.length) return;
  if (!redis) {
    const d = (md()[key] ??= { claimedSol: 0, burnSol: 0, burnTokens: 0 });
    for (const [k, v] of fields) d[k] += v;
    return;
  }
  for (const [k, v] of fields) await redis.hincrbyfloat(key, k, v);
}

/** Sums for each day start (unix seconds at 00:00 UTC), in the same order. */
export async function getDays(dayStarts: number[]): Promise<BotDay[]> {
  const empty = (): BotDay => ({ claimedSol: 0, burnSol: 0, burnTokens: 0 });
  if (!redis) return dayStarts.map((d) => ({ ...empty(), ...md()[dayKey(d)] }));
  const rows = await Promise.all(dayStarts.map((d) => redis.hgetall<Record<string, string | number>>(dayKey(d))));
  return rows.map((r) => ({
    claimedSol: Number(r?.claimedSol ?? 0),
    burnSol: Number(r?.burnSol ?? 0),
    burnTokens: Number(r?.burnTokens ?? 0),
  }));
}
