// Persistent storage for points and redemptions.
//
// Production: Upstash Redis (add it in Vercel → Storage → Marketplace; the
// integration sets KV_REST_API_URL / KV_REST_API_TOKEN automatically).
// Without Redis the site uses an in-memory DEMO store that resets on restart.
//
// Points are stored as integer "centipoints" (1 point = 100) to avoid floats.
import { Redis } from "@upstash/redis";
import { TOKEN_LIVE } from "@/config";
import type { Redemption } from "./types";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
export const STORE_LIVE = Boolean(url && token);
/** Real points only when both the token and the database are configured. */
export const POINTS_LIVE = STORE_LIVE && TOKEN_LIVE;

export type SnapMeta = { at: number; price: number };
export type SnapDay = { at: number; price: number; holders: number; awarded: number; pointsIssued: number };
export type RedeemOutcome = "ok" | "insufficient" | "cooldown" | "queue_full";

export interface Store {
  getPoints(wallet: string): Promise<{ centi: number; lastDayCenti: number; lastRedeemAt: number | null }>;
  redeem(r: Redemption, costCenti: number, cooldownMs: number, maxPending: number): Promise<RedeemOutcome>;
  listRedemptions(): Promise<Redemption[]>;
  getRedemption(id: string): Promise<Redemption | null>;
  /** Moves a pending redemption to fulfilled/rejected; rejection refunds the points. */
  resolveRedemption(id: string, status: "fulfilled" | "rejected", tx: string | null, note: string | null): Promise<Redemption | null>;
  /** Returns false if the nonce was already used. */
  useNonce(nonce: string, ttlSec: number): Promise<boolean>;
  getSnapMeta(): Promise<SnapMeta | null>;
  getSnapBalances(): Promise<Record<string, number>>;
  applySnapshot(args: {
    balances: Record<string, number>;
    awardsCenti: Record<string, number>;
    meta: SnapMeta;
    day: SnapDay;
  }): Promise<void>;
}

const K = {
  points: "points",
  lastDay: "points:lastday",
  lastRedeem: "redeem:last",
  redemptions: "redemptions",
  pending: "redemptions:pending",
  snapBalances: "snap:balances",
  snapMeta: "snap:meta",
  snapDays: "snap:days",
};

// Atomic check-and-deduct so two requests can't spend the same points.
const REDEEM_LUA = `
local pts = tonumber(redis.call('HGET', KEYS[1], ARGV[1]) or '0')
if pts < tonumber(ARGV[2]) then return 'insufficient' end
local last = tonumber(redis.call('HGET', KEYS[2], ARGV[1]) or '0')
if last > 0 and tonumber(ARGV[3]) - last < tonumber(ARGV[4]) then return 'cooldown' end
local pending = tonumber(redis.call('GET', KEYS[4]) or '0')
if pending >= tonumber(ARGV[5]) then return 'queue_full' end
redis.call('HINCRBY', KEYS[1], ARGV[1], -tonumber(ARGV[2]))
redis.call('HSET', KEYS[2], ARGV[1], ARGV[3])
redis.call('HSET', KEYS[3], ARGV[6], ARGV[7])
redis.call('INCR', KEYS[4])
return 'ok'
`;

const RESOLVE_LUA = `
local raw = redis.call('HGET', KEYS[1], ARGV[1])
if not raw then return nil end
local r = cjson.decode(raw)
if r.status ~= 'pending' then return raw end
r.status = ARGV[2]
if ARGV[3] ~= '' then r.tx = ARGV[3] end
if ARGV[4] ~= '' then r.note = ARGV[4] end
local out = cjson.encode(r)
redis.call('HSET', KEYS[1], ARGV[1], out)
redis.call('DECR', KEYS[2])
if ARGV[2] == 'rejected' then
  redis.call('HINCRBY', KEYS[3], r.wallet, tonumber(ARGV[5]))
  redis.call('HDEL', KEYS[4], r.wallet)
end
return out
`;

class RedisStore implements Store {
  private r = new Redis({ url, token, automaticDeserialization: false });

  async getPoints(wallet: string) {
    const [c, d, l] = await Promise.all([
      this.r.hget<string>(K.points, wallet),
      this.r.hget<string>(K.lastDay, wallet),
      this.r.hget<string>(K.lastRedeem, wallet),
    ]);
    return { centi: Number(c ?? 0), lastDayCenti: Number(d ?? 0), lastRedeemAt: l ? Number(l) : null };
  }

  async redeem(rec: Redemption, costCenti: number, cooldownMs: number, maxPending: number) {
    const res = await this.r.eval(
      REDEEM_LUA,
      [K.points, K.lastRedeem, K.redemptions, K.pending],
      [rec.wallet, String(costCenti), String(rec.createdAt), String(cooldownMs), String(maxPending), rec.id, JSON.stringify(rec)],
    );
    return String(res) as RedeemOutcome;
  }

  async listRedemptions() {
    const all = (await this.r.hgetall<Record<string, string>>(K.redemptions)) ?? {};
    return Object.values(all)
      .map((v) => JSON.parse(v) as Redemption)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async getRedemption(id: string) {
    const v = await this.r.hget<string>(K.redemptions, id);
    return v ? (JSON.parse(v) as Redemption) : null;
  }

  async resolveRedemption(id: string, status: "fulfilled" | "rejected", tx: string | null, note: string | null) {
    const existing = await this.getRedemption(id);
    if (!existing) return null;
    const res = await this.r.eval(
      RESOLVE_LUA,
      [K.redemptions, K.pending, K.points, K.lastRedeem],
      [id, status, tx ?? "", note ?? "", String(existing.cost * 100)],
    );
    return res ? (JSON.parse(String(res)) as Redemption) : null;
  }

  async useNonce(nonce: string, ttlSec: number) {
    const ok = await this.r.set(`nonce:${nonce}`, "1", { nx: true, ex: ttlSec });
    return ok === "OK";
  }

  async getSnapMeta() {
    const v = await this.r.get<string>(K.snapMeta);
    return v ? (JSON.parse(v) as SnapMeta) : null;
  }

  async getSnapBalances() {
    const all = (await this.r.hgetall<Record<string, string>>(K.snapBalances)) ?? {};
    return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, Number(v)]));
  }

  async applySnapshot({ balances, awardsCenti, meta, day }: Parameters<Store["applySnapshot"]>[0]) {
    const tx = this.r.multi();
    tx.del(K.snapBalances);
    if (Object.keys(balances).length) tx.hset(K.snapBalances, balances);
    for (const [w, c] of Object.entries(awardsCenti)) tx.hincrby(K.points, w, c);
    tx.del(K.lastDay);
    if (Object.keys(awardsCenti).length) tx.hset(K.lastDay, awardsCenti);
    tx.set(K.snapMeta, JSON.stringify(meta));
    tx.lpush(K.snapDays, JSON.stringify(day));
    tx.ltrim(K.snapDays, 0, 89);
    await tx.exec();
  }
}

// ── In-memory demo store ─────────────────────────────────────────────────────
type Mem = {
  points: Map<string, number>;
  lastDay: Map<string, number>;
  lastRedeem: Map<string, number>;
  redemptions: Map<string, Redemption>;
  nonces: Set<string>;
  snapMeta: SnapMeta | null;
  snapBalances: Record<string, number>;
};

class MemoryStore implements Store {
  constructor(private m: Mem, private seedPoints: (w: string) => number) {}

  private pts(w: string) {
    if (!this.m.points.has(w)) this.m.points.set(w, this.seedPoints(w) * 100);
    return this.m.points.get(w)!;
  }
  private pending() {
    return [...this.m.redemptions.values()].filter((r) => r.status === "pending").length;
  }

  async getPoints(w: string) {
    const centi = this.pts(w);
    return { centi, lastDayCenti: this.m.lastDay.get(w) ?? Math.round(centi / 40), lastRedeemAt: this.m.lastRedeem.get(w) ?? null };
  }
  async redeem(rec: Redemption, costCenti: number, cooldownMs: number, maxPending: number): Promise<RedeemOutcome> {
    if (this.pts(rec.wallet) < costCenti) return "insufficient";
    const last = this.m.lastRedeem.get(rec.wallet);
    if (last && rec.createdAt - last < cooldownMs) return "cooldown";
    if (this.pending() >= maxPending) return "queue_full";
    this.m.points.set(rec.wallet, this.pts(rec.wallet) - costCenti);
    this.m.lastRedeem.set(rec.wallet, rec.createdAt);
    this.m.redemptions.set(rec.id, rec);
    return "ok";
  }
  async listRedemptions() {
    return [...this.m.redemptions.values()].sort((a, b) => b.createdAt - a.createdAt);
  }
  async getRedemption(id: string) {
    return this.m.redemptions.get(id) ?? null;
  }
  async resolveRedemption(id: string, status: "fulfilled" | "rejected", tx: string | null, note: string | null) {
    const r = this.m.redemptions.get(id);
    if (!r) return null;
    if (r.status !== "pending") return r;
    const next = { ...r, status, tx: tx ?? r.tx, note: note ?? r.note };
    this.m.redemptions.set(id, next);
    if (status === "rejected") {
      this.m.points.set(r.wallet, this.pts(r.wallet) + r.cost * 100);
      this.m.lastRedeem.delete(r.wallet);
    }
    return next;
  }
  async useNonce(n: string) {
    if (this.m.nonces.has(n)) return false;
    this.m.nonces.add(n);
    return true;
  }
  async getSnapMeta() {
    return this.m.snapMeta;
  }
  async getSnapBalances() {
    return this.m.snapBalances;
  }
  async applySnapshot({ balances, awardsCenti, meta }: Parameters<Store["applySnapshot"]>[0]) {
    for (const [w, c] of Object.entries(awardsCenti)) this.m.points.set(w, this.pts(w) + c);
    this.m.lastDay = new Map(Object.entries(awardsCenti));
    this.m.snapBalances = balances;
    this.m.snapMeta = meta;
  }
}

// Keep the demo store across hot reloads in dev.
const g = globalThis as unknown as { __pigMem?: Mem };

let _store: Store | null = null;
export function getStore(seedPoints: (w: string) => number, seedRedemptions: () => Redemption[]): Store {
  if (_store) return _store;
  if (POINTS_LIVE) return (_store = new RedisStore());
  if (!g.__pigMem) {
    g.__pigMem = {
      points: new Map(),
      lastDay: new Map(),
      lastRedeem: new Map(),
      redemptions: new Map(seedRedemptions().map((r) => [r.id, r])),
      nonces: new Set(),
      snapMeta: null,
      snapBalances: {},
    };
  }
  return (_store = new MemoryStore(g.__pigMem, seedPoints));
}
