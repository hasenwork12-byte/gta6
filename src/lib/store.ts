// Persistent storage for points and redemptions.
//
// Production: Upstash Redis (add it in Vercel → Storage → Marketplace; the
// integration sets KV_REST_API_URL / KV_REST_API_TOKEN automatically).
// Without Redis the site uses an in-memory DEMO store that resets on restart.
//
// Points are stored as integer "centipoints" (1 point = 100) to avoid floats.
import { Redis } from "@upstash/redis";
import { TOKEN_LIVE } from "@/config";
import type { Redemption, StockItem } from "./types";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
export const STORE_LIVE = Boolean(url && token);
/** Real points only when both the token and the database are configured. */
export const POINTS_LIVE = STORE_LIVE && TOKEN_LIVE;

export type SnapMeta = { at: number; price: number };
export type SnapDay = { at: number; price: number; holders: number; awarded: number; pointsIssued: number };
export type RedeemOutcome = "ok" | "insufficient" | "cooldown" | "donation_limit" | "queue_full";
export type ClaimOutcome = "ok" | "not_found" | "not_claimable" | "not_yours";
export type RedeemLimits = { windowMs: number; maxPending: number; maxDonations: number };
export type AssignOutcome = "ok" | "empty" | "not_pending";

const kindOf = (r: Redemption) => r.kind ?? "self";

export interface Store {
  getPoints(wallet: string): Promise<{ centi: number; lastDayCenti: number; lastRedeemAt: number | null }>;
  /**
   * Atomically checks balance + limits and reserves the points.
   * kind "self" uses the one-per-window cooldown; "gift"/"team" use the separate donation allowance.
   * Every open request (unclaimed or pending) counts toward the queue cap.
   */
  redeem(r: Redemption, costCenti: number, limits: RedeemLimits): Promise<RedeemOutcome>;
  /** Recipient claims a gift: fills in delivery details and moves it into the queue. */
  claimGift(id: string, wallet: string, d: { platform: string; region: string; email: string; claimedAt: number }): Promise<ClaimOutcome>;
  listRedemptions(): Promise<Redemption[]>;
  /** Wallets with the most points, highest first. */
  topPoints(limit: number): Promise<{ wallet: string; centi: number }[]>;
  /** Points each wallet earned at the latest snapshot (centi), in the same order. */
  lastDays(wallets: string[]): Promise<number[]>;
  getRedemption(id: string): Promise<Redemption | null>;
  /**
   * Fulfils a pending redemption, or rejects a pending/unclaimed one.
   * Rejection refunds the points and gives back the cooldown / donation slot.
   */
  resolveRedemption(id: string, status: "fulfilled" | "rejected", tx: string | null, note: string | null): Promise<Redemption | null>;
  /** Returns false if the nonce was already used. */
  useNonce(nonce: string, ttlSec: number): Promise<boolean>;

  // ── Code stock ──
  addStock(skey: string, items: StockItem[]): Promise<void>;
  /** Number of codes in stock per `platform|region`. */
  stockCounts(): Promise<Record<string, number>>;
  /**
   * Atomically takes one code for platform+region and fulfils the pending redemption with it
   * (receipt = the code's purchase tx).
   */
  assignFromStock(id: string, platform: string, region: string, now: number): Promise<AssignOutcome>;
  getAssignedCode(id: string): Promise<StockItem | null>;
  markRevealed(id: string, now: number): Promise<void>;
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
  donateTimes: "redeem:donations",
  redemptions: "redemptions",
  pending: "redemptions:pending",
  snapBalances: "snap:balances",
  snapMeta: "snap:meta",
  snapDays: "snap:days",
  stock: (skey: string) => `stock:${skey}`,
  stockIndex: "stock:index",
  assigned: "stock:assigned",
};

// KEYS: redemptions, pending, stockList, assigned   ARGV: id, platform, region, now
const ASSIGN_LUA = `
local raw = redis.call('HGET', KEYS[1], ARGV[1])
if not raw then return 'not_pending' end
local r = cjson.decode(raw)
if r.status ~= 'pending' then return 'not_pending' end
local item = redis.call('LPOP', KEYS[3])
if not item then return 'empty' end
local k = cjson.decode(item)
r.status = 'fulfilled'
r.platform = ARGV[2]
r.region = ARGV[3]
r.tx = k.tx
r.keyId = k.id
r.fulfilledAt = tonumber(ARGV[4])
redis.call('HSET', KEYS[1], ARGV[1], cjson.encode(r))
redis.call('HSET', KEYS[4], ARGV[1], item)
redis.call('DECR', KEYS[2])
return 'ok'
`;

// Atomic check-and-deduct so two requests can't spend the same points.
// KEYS: points, lastRedeem, redemptions, pending, donateTimes
// ARGV: wallet, costCenti, now, windowMs, maxPending, id, json, isDonation, maxDonations
const REDEEM_LUA = `
local pts = tonumber(redis.call('HGET', KEYS[1], ARGV[1]) or '0')
if pts < tonumber(ARGV[2]) then return 'insufficient' end
local now = tonumber(ARGV[3])
local win = tonumber(ARGV[4])
local times = {}
if ARGV[8] == '1' then
  local raw = redis.call('HGET', KEYS[5], ARGV[1])
  if raw then
    for _, t in ipairs(cjson.decode(raw)) do
      if now - t < win then table.insert(times, t) end
    end
  end
  if #times >= tonumber(ARGV[9]) then return 'donation_limit' end
else
  local last = tonumber(redis.call('HGET', KEYS[2], ARGV[1]) or '0')
  if last > 0 and now - last < win then return 'cooldown' end
end
local pending = tonumber(redis.call('GET', KEYS[4]) or '0')
if pending >= tonumber(ARGV[5]) then return 'queue_full' end
redis.call('HINCRBY', KEYS[1], ARGV[1], -tonumber(ARGV[2]))
if ARGV[8] == '1' then
  table.insert(times, now)
  redis.call('HSET', KEYS[5], ARGV[1], cjson.encode(times))
else
  redis.call('HSET', KEYS[2], ARGV[1], ARGV[3])
end
redis.call('HSET', KEYS[3], ARGV[6], ARGV[7])
redis.call('INCR', KEYS[4])
return 'ok'
`;

// KEYS: redemptions   ARGV: id, wallet, platform, region, email, claimedAt
const CLAIM_LUA = `
local raw = redis.call('HGET', KEYS[1], ARGV[1])
if not raw then return 'not_found' end
local r = cjson.decode(raw)
if r.kind ~= 'gift' or r.status ~= 'unclaimed' then return 'not_claimable' end
if r.recipient ~= ARGV[2] then return 'not_yours' end
r.platform = ARGV[3]
r.region = ARGV[4]
r.email = ARGV[5]
r.claimedAt = tonumber(ARGV[6])
r.status = 'pending'
redis.call('HSET', KEYS[1], ARGV[1], cjson.encode(r))
return 'ok'
`;

// KEYS: redemptions, pending, points, lastRedeem, donateTimes
// ARGV: id, status, tx, note, refundCenti
const RESOLVE_LUA = `
local raw = redis.call('HGET', KEYS[1], ARGV[1])
if not raw then return nil end
local r = cjson.decode(raw)
if r.status ~= 'pending' and r.status ~= 'unclaimed' then return raw end
if ARGV[2] == 'fulfilled' and r.status ~= 'pending' then return raw end
r.status = ARGV[2]
if ARGV[3] ~= '' then r.tx = ARGV[3] end
if ARGV[4] ~= '' then r.note = ARGV[4] end
local out = cjson.encode(r)
redis.call('HSET', KEYS[1], ARGV[1], out)
redis.call('DECR', KEYS[2])
if ARGV[2] == 'rejected' then
  redis.call('HINCRBY', KEYS[3], r.wallet, tonumber(ARGV[5]))
  local kind = r.kind
  if kind == nil or kind == cjson.null then kind = 'self' end
  if kind == 'self' then
    redis.call('HDEL', KEYS[4], r.wallet)
  else
    local tr = redis.call('HGET', KEYS[5], r.wallet)
    if tr then
      local keep = {}
      local removed = false
      for _, t in ipairs(cjson.decode(tr)) do
        if not removed and t == r.createdAt then removed = true else table.insert(keep, t) end
      end
      if #keep == 0 then redis.call('HDEL', KEYS[5], r.wallet) else redis.call('HSET', KEYS[5], r.wallet, cjson.encode(keep)) end
    end
  end
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

  async redeem(rec: Redemption, costCenti: number, l: RedeemLimits) {
    const res = await this.r.eval(
      REDEEM_LUA,
      [K.points, K.lastRedeem, K.redemptions, K.pending, K.donateTimes],
      [
        rec.wallet,
        String(costCenti),
        String(rec.createdAt),
        String(l.windowMs),
        String(l.maxPending),
        rec.id,
        JSON.stringify(rec),
        kindOf(rec) === "self" ? "0" : "1",
        String(l.maxDonations),
      ],
    );
    return String(res) as RedeemOutcome;
  }

  async claimGift(id: string, wallet: string, d: { platform: string; region: string; email: string; claimedAt: number }) {
    const res = await this.r.eval(CLAIM_LUA, [K.redemptions], [id, wallet, d.platform, d.region, d.email, String(d.claimedAt)]);
    return String(res) as ClaimOutcome;
  }

  async listRedemptions() {
    const all = (await this.r.hgetall<Record<string, string>>(K.redemptions)) ?? {};
    return Object.values(all)
      .map((v) => JSON.parse(v) as Redemption)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async topPoints(limit: number) {
    // Fine for thousands of holders; switch to a sorted set if the hash grows very large.
    const all = (await this.r.hgetall<Record<string, string>>(K.points)) ?? {};
    return Object.entries(all)
      .map(([wallet, c]) => ({ wallet, centi: Number(c) }))
      .filter((x) => x.centi > 0)
      .sort((a, b) => b.centi - a.centi)
      .slice(0, limit);
  }

  async lastDays(wallets: string[]) {
    if (!wallets.length) return [];
    const got = (await this.r.hmget<Record<string, string | null>>(K.lastDay, ...wallets)) ?? {};
    return wallets.map((w) => Number(got[w] ?? 0));
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
      [K.redemptions, K.pending, K.points, K.lastRedeem, K.donateTimes],
      [id, status, tx ?? "", note ?? "", String(existing.cost * 100)],
    );
    return res ? (JSON.parse(String(res)) as Redemption) : null;
  }

  async useNonce(nonce: string, ttlSec: number) {
    const ok = await this.r.set(`nonce:${nonce}`, "1", { nx: true, ex: ttlSec });
    return ok === "OK";
  }

  async addStock(skey: string, items: StockItem[]) {
    if (!items.length) return;
    const tx = this.r.multi();
    tx.rpush(K.stock(skey), ...items.map((i) => JSON.stringify(i)));
    tx.sadd(K.stockIndex, skey);
    await tx.exec();
  }

  async stockCounts() {
    const keys = ((await this.r.smembers(K.stockIndex)) ?? []) as string[];
    if (!keys.length) return {};
    const p = this.r.pipeline();
    keys.forEach((k) => p.llen(K.stock(k)));
    const lens = (await p.exec()) as number[];
    return Object.fromEntries(keys.map((k, i) => [k, Number(lens[i] ?? 0)]));
  }

  async assignFromStock(id: string, platform: string, region: string, now: number) {
    const skey = `${platform}|${region}`;
    const res = await this.r.eval(ASSIGN_LUA, [K.redemptions, K.pending, K.stock(skey), K.assigned], [id, platform, region, String(now)]);
    return String(res) as AssignOutcome;
  }

  async getAssignedCode(id: string) {
    const v = await this.r.hget<string>(K.assigned, id);
    return v ? (JSON.parse(v) as StockItem) : null;
  }

  async markRevealed(id: string, now: number) {
    const r = await this.getRedemption(id);
    if (!r) return;
    const next = { ...r, revealCount: (r.revealCount ?? 0) + 1, lastRevealAt: now };
    await this.r.hset(K.redemptions, { [id]: JSON.stringify(next) });
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
  donateTimes: Map<string, number[]>;
  redemptions: Map<string, Redemption>;
  nonces: Set<string>;
  stock: Map<string, StockItem[]>;
  assigned: Map<string, StockItem>;
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
    return [...this.m.redemptions.values()].filter((r) => r.status === "pending" || r.status === "unclaimed").length;
  }

  async getPoints(w: string) {
    const centi = this.pts(w);
    return { centi, lastDayCenti: this.m.lastDay.get(w) ?? Math.round(centi / 40), lastRedeemAt: this.m.lastRedeem.get(w) ?? null };
  }
  async redeem(rec: Redemption, costCenti: number, l: RedeemLimits): Promise<RedeemOutcome> {
    if (this.pts(rec.wallet) < costCenti) return "insufficient";
    const donation = kindOf(rec) !== "self";
    const times = (this.m.donateTimes.get(rec.wallet) ?? []).filter((t) => rec.createdAt - t < l.windowMs);
    if (donation) {
      if (times.length >= l.maxDonations) return "donation_limit";
    } else {
      const last = this.m.lastRedeem.get(rec.wallet);
      if (last && rec.createdAt - last < l.windowMs) return "cooldown";
    }
    if (this.pending() >= l.maxPending) return "queue_full";
    this.m.points.set(rec.wallet, this.pts(rec.wallet) - costCenti);
    if (donation) this.m.donateTimes.set(rec.wallet, [...times, rec.createdAt]);
    else this.m.lastRedeem.set(rec.wallet, rec.createdAt);
    this.m.redemptions.set(rec.id, rec);
    return "ok";
  }
  async claimGift(id: string, wallet: string, d: { platform: string; region: string; email: string; claimedAt: number }): Promise<ClaimOutcome> {
    const r = this.m.redemptions.get(id);
    if (!r) return "not_found";
    if (r.kind !== "gift" || r.status !== "unclaimed") return "not_claimable";
    if (r.recipient !== wallet) return "not_yours";
    this.m.redemptions.set(id, { ...r, ...d, status: "pending" });
    return "ok";
  }
  async listRedemptions() {
    return [...this.m.redemptions.values()].sort((a, b) => b.createdAt - a.createdAt);
  }
  async getRedemption(id: string) {
    return this.m.redemptions.get(id) ?? null;
  }
  async lastDays(wallets: string[]) {
    return wallets.map((w) => this.m.lastDay.get(w) ?? Math.round(this.pts(w) / 40));
  }
  async topPoints(limit: number) {
    return [...this.m.points.entries()]
      .map(([wallet, centi]) => ({ wallet, centi }))
      .filter((x) => x.centi > 0)
      .sort((a, b) => b.centi - a.centi)
      .slice(0, limit);
  }
  async resolveRedemption(id: string, status: "fulfilled" | "rejected", tx: string | null, note: string | null) {
    const r = this.m.redemptions.get(id);
    if (!r) return null;
    if (r.status !== "pending" && r.status !== "unclaimed") return r;
    if (status === "fulfilled" && r.status !== "pending") return r;
    const next = { ...r, status, tx: tx ?? r.tx, note: note ?? r.note };
    this.m.redemptions.set(id, next);
    if (status === "rejected") {
      this.m.points.set(r.wallet, this.pts(r.wallet) + r.cost * 100);
      if (kindOf(r) === "self") this.m.lastRedeem.delete(r.wallet);
      else {
        const times = [...(this.m.donateTimes.get(r.wallet) ?? [])];
        const i = times.indexOf(r.createdAt);
        if (i >= 0) times.splice(i, 1);
        this.m.donateTimes.set(r.wallet, times);
      }
    }
    return next;
  }
  async useNonce(n: string) {
    if (this.m.nonces.has(n)) return false;
    this.m.nonces.add(n);
    return true;
  }
  async addStock(skey: string, items: StockItem[]) {
    this.m.stock.set(skey, [...(this.m.stock.get(skey) ?? []), ...items]);
  }
  async stockCounts() {
    return Object.fromEntries([...this.m.stock.entries()].map(([k, v]) => [k, v.length]));
  }
  async assignFromStock(id: string, platform: string, region: string, now: number): Promise<AssignOutcome> {
    const r = this.m.redemptions.get(id);
    if (!r || r.status !== "pending") return "not_pending";
    const list = this.m.stock.get(`${platform}|${region}`) ?? [];
    const item = list.shift();
    if (!item) return "empty";
    this.m.redemptions.set(id, { ...r, status: "fulfilled", platform, region, tx: item.tx, keyId: item.id, fulfilledAt: now });
    this.m.assigned.set(id, item);
    return "ok";
  }
  async getAssignedCode(id: string) {
    return this.m.assigned.get(id) ?? null;
  }
  async markRevealed(id: string, now: number) {
    const r = this.m.redemptions.get(id);
    if (r) this.m.redemptions.set(id, { ...r, revealCount: (r.revealCount ?? 0) + 1, lastRevealAt: now });
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
      donateTimes: new Map(),
      redemptions: new Map(seedRedemptions().map((r) => [r.id, r])),
      nonces: new Set(),
      stock: new Map(),
      assigned: new Map(),
      snapMeta: null,
      snapBalances: {},
    };
  }
  return (_store = new MemoryStore(g.__pigMem, seedPoints));
}
