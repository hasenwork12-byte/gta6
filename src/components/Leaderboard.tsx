"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { points, site } from "@/config";
import { fmtNum, shortAddr } from "@/lib/format";
import DemoBadge from "./DemoBadge";
import PigAvatar from "./PigAvatar";

export type BoardRow = { wallet: string; points: number; lastDay: number };
type Tab = "all" | "today";
type Ranked = BoardRow & { rank: number; move: number | "new" };

// ── Tiers: named levels on the way to (and past) a copy ────────────────────────
const TIERS = [
  { min: points.redeemCost * 2.5, name: "Pig Lord", tone: "text-gold border-gold/40 bg-gold/10" },
  { min: points.redeemCost, name: "Big Boar", tone: "text-good border-good/40 bg-good/10" },
  { min: points.redeemCost * 0.5, name: "Hog", tone: "text-accent2 border-accent2/40 bg-accent2/10" },
  { min: points.redeemCost * 0.25, name: "Oinker", tone: "text-accent border-accent/40 bg-accent/10" },
  { min: 0, name: "Piglet", tone: "text-muted border-line/15 bg-line/[0.04]" },
];
const tierOf = (xp: number) => TIERS.find((t) => xp >= t.min)!;

function TierChip({ xp }: { xp: number }) {
  const t = tierOf(xp);
  return <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${t.tone}`}>{t.name}</span>;
}

function Move({ move }: { move: Ranked["move"] }) {
  if (move === "new") return <span className="rounded-md bg-accent2/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent2">NEW</span>;
  if (move === 0) return <span className="font-mono text-[11px] text-muted">–</span>;
  const up = move > 0;
  return (
    <span className={`font-mono text-[11px] font-bold ${up ? "text-good" : "text-[#ff5c6c]"}`} title={`${up ? "Up" : "Down"} ${Math.abs(move)} since the last drop`}>
      {up ? "▲" : "▼"}
      {Math.abs(move)}
    </span>
  );
}

function XpBar({ xp }: { xp: number }) {
  const pct = Math.min(100, (xp / points.redeemCost) * 100);
  return (
    <div className="h-2.5 overflow-hidden rounded-full border border-line/10 bg-bg">
      <div
        className={`h-full rounded-full ${pct >= 100 ? "bg-gradient-to-r from-good to-[#22d3ee]" : "bg-gradient-to-r from-accent to-accent2"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function WalletText({ wallet, demo }: { wallet: string; demo: boolean }) {
  return demo ? (
    <span>{shortAddr(wallet, 4)}</span>
  ) : (
    <a className="hover:text-accent2" href={site.explorerAccount(wallet)} target="_blank" rel="noreferrer">
      {shortAddr(wallet, 4)}
    </a>
  );
}

/** Rank by the current tab, plus movement since the previous snapshot (all-time tab only). */
function rankRows(rows: BoardRow[], tab: Tab): Ranked[] {
  if (tab === "today") {
    return [...rows]
      .filter((r) => r.lastDay > 0)
      .sort((a, b) => b.lastDay - a.lastDay)
      .map((r, i) => ({ ...r, rank: i + 1, move: 0 }));
  }
  const prev = [...rows].map((r) => ({ w: r.wallet, xp: r.points - r.lastDay })).sort((a, b) => b.xp - a.xp);
  const prevRank = new Map(prev.map((p, i) => [p.w, i + 1]));
  return rows.map((r, i) => ({
    ...r,
    rank: i + 1,
    move: r.points - r.lastDay <= 0 ? "new" : (prevRank.get(r.wallet) ?? i + 1) - (i + 1),
  }));
}

/** Live countdown to the next daily XP drop (snapshot runs at 00:00 UTC). */
function useNextDrop() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const d = new Date(now);
      setLeft(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - now);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  if (left === null) return "--:--:--";
  const s = Math.floor(left / 1000);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((v) => String(v).padStart(2, "0")).join(":");
}

const valueOf = (r: BoardRow, tab: Tab) => (tab === "today" ? r.lastDay : r.points);

// Podium: 2nd, 1st, 3rd on wide screens; 1st first on phones.
const PODIUM = [
  { at: 1, medal: "🥈", ring: "border-line/30", glow: "from-line/10", lift: "sm:mt-8" },
  { at: 0, medal: "🥇", ring: "border-gold/60", glow: "from-gold/25", lift: "" },
  { at: 2, medal: "🥉", ring: "border-accent2/50", glow: "from-accent2/20", lift: "sm:mt-12" },
];

export default function Leaderboard({
  rows,
  demo,
  variant = "full",
}: {
  rows: BoardRow[];
  demo: boolean;
  variant?: "full" | "compact";
}) {
  const full = variant === "full";
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [lookup, setLookup] = useState("");
  const { publicKey } = useWallet();
  const me = lookup || publicKey?.toBase58() || "";
  const countdown = useNextDrop();

  const ranked = useMemo(() => rankRows(rows, tab), [rows, tab]);
  const top = ranked.slice(0, 3);
  const rest = ranked.slice(3, full ? undefined : 8);

  const droppedToday = rows.reduce((a, r) => a + r.lastDay, 0);
  const unlocked = rows.filter((r) => r.points >= points.redeemCost).length;

  const mine = me ? ranked.find((r) => r.wallet === me) : undefined;
  const above = mine && mine.rank > 1 ? ranked[mine.rank - 2] : undefined;

  const onFind = (e: FormEvent) => {
    e.preventDefault();
    setLookup(query.trim());
  };

  if (rows.length === 0) {
    return (
      <div className="card p-10 text-center text-sm text-muted">
        No XP dropped yet. The first drop comes at the second daily snapshot. 🐷
      </div>
    );
  }

  const share = mine
    ? `https://x.com/intent/post?text=${encodeURIComponent(
        `I'm #${mine.rank} on the $${site.ticker} leaderboard with ${fmtNum(mine.points, 1)} XP 🐷 Next stop: GTA 6 🎮`,
      )}`
    : "";

  return (
    <div className="space-y-4">
      {/* Live strip */}
      <div className={`grid grid-cols-2 gap-3 ${full ? "sm:grid-cols-4" : ""}`}>
        <div className="card relative overflow-hidden p-4">
          <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent/20 blur-2xl" />
          <p className="label">Next XP drop</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular text-fg" suppressHydrationWarning>
            {countdown}
          </p>
        </div>
        {full && (
          <>
            <div className="card p-4">
              <p className="label">Stackers ranked</p>
              <p className="mt-1 font-display text-2xl font-extrabold">{fmtNum(rows.length)}</p>
            </div>
            <div className="card p-4">
              <p className="label">Last drop</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-gold">+{fmtNum(droppedToday, 0)} XP</p>
            </div>
          </>
        )}
        <div className="card p-4">
          <p className="label">GTA unlocked</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-good">
            {fmtNum(unlocked)} <span className="text-sm text-muted">wallets</span>
          </p>
        </div>
      </div>

      {/* Tabs + find me */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Leaderboard period" className="flex w-fit gap-1 rounded-2xl border-2 border-line/[0.08] bg-surface/70 p-1">
          {(
            [
              ["all", "All time"],
              ["today", "Today's gainers 🔥"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${tab === id ? "bg-line/[0.1] text-fg" : "text-muted hover:text-fg"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {full && (
          <form onSubmit={onFind} className="flex gap-2">
            <label htmlFor="board-find" className="sr-only">
              Find a wallet on the leaderboard
            </label>
            <input
              id="board-find"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find my rank: paste wallet"
              spellCheck={false}
              autoComplete="off"
              className="h-10 min-w-0 flex-1 rounded-xl border-2 border-line/10 bg-bg/60 px-3 font-mono text-xs outline-none placeholder:text-muted focus:border-accent/60 sm:w-64"
            />
            <button className="btn-ghost !py-2 text-xs" disabled={!query.trim()}>
              Find
            </button>
          </form>
        )}
      </div>
      {demo && <DemoBadge />}

      {/* "Where am I" card: relative rank motivates everyone, not just the top 3 */}
      {full && me && (
        <div className="card flex flex-col gap-3 border-accent/40 bg-gradient-to-r from-accent/10 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
          {mine ? (
            <>
              <div className="flex items-center gap-3">
                <PigAvatar wallet={mine.wallet} crown={mine.rank === 1} className="h-12 w-12 shrink-0" />
                <div>
                  <p className="font-display text-xl font-extrabold">
                    You&apos;re #{mine.rank} <TierChip xp={mine.points} />
                  </p>
                  <p className="text-sm text-muted">
                    {above
                      ? `${fmtNum(valueOf(above, tab) - valueOf(mine, tab), 1)} XP behind #${above.rank}. Keep stacking.`
                      : "Top of the board. Pig Lord energy. 👑"}
                  </p>
                </div>
              </div>
              <a href={share} target="_blank" rel="noreferrer" className="btn-primary !py-2 text-xs">
                Flex on X
              </a>
            </>
          ) : (
            <p className="text-sm text-muted">
              {shortAddr(me, 5)} isn&apos;t in the top {fmtNum(rows.length)}
              {tab === "all" && ranked.length > 0
                ? `. You need ${fmtNum(ranked[ranked.length - 1].points, 1)} XP to get on the board.`
                : " today."}
            </p>
          )}
        </div>
      )}

      {/* Podium */}
      <div className="grid items-start gap-3 sm:grid-cols-3">
        {PODIUM.filter((p) => top[p.at]).map((p) => {
          const r = top[p.at];
          const isFirst = p.at === 0;
          return (
            <div
              key={r.wallet}
              className={`card relative overflow-hidden border-2 p-5 text-center ${p.ring} ${p.lift} ${isFirst ? "shadow-[0_0_40px_-8px_rgb(var(--gold)/0.45),0_6px_0_0_rgb(0_0_0/0.45)]" : "order-last sm:order-none"} ${
                r.wallet === me ? "ring-2 ring-accent" : ""
              }`}
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${p.glow} to-transparent`} />
              <div className="relative">
                <div className="relative mx-auto w-fit">
                  <PigAvatar wallet={r.wallet} crown={isFirst} className={`${isFirst ? "h-20 w-20 animate-float" : "h-16 w-16"}`} />
                  <span className="absolute -bottom-1 -right-2 text-2xl" aria-hidden>
                    {p.medal}
                  </span>
                </div>
                <p className="mt-3 font-mono text-sm">
                  <WalletText wallet={r.wallet} demo={demo} />
                </p>
                <div className="mt-1.5 flex items-center justify-center gap-2">
                  <TierChip xp={r.points} />
                  {tab === "all" && <Move move={r.move} />}
                </div>
                <p className="mt-3 font-display text-4xl font-extrabold tracking-tight">
                  {tab === "today" && "+"}
                  {fmtNum(valueOf(r, tab), 1)}
                  <span className="ml-1 text-base text-muted">XP</span>
                </p>
                {tab === "all" ? (
                  <>
                    <div className="mt-3">
                      <XpBar xp={r.points} />
                    </div>
                    <p className="mt-2 font-mono text-[11px] text-muted">
                      {r.points >= points.redeemCost ? "GTA 6 unlocked ✓" : `${fmtNum((r.points / points.redeemCost) * 100, 0)}% to GTA 6`}
                      {r.lastDay > 0 && <span className="text-good"> · +{fmtNum(r.lastDay, 1)} today</span>}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 font-mono text-[11px] text-muted">{fmtNum(r.points, 1)} XP total</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Everyone else */}
      {rest.length > 0 && (
        <ol className="card divide-y-2 divide-line/[0.05] overflow-hidden">
          {rest.map((r, i) => (
            <li
              key={r.wallet}
              className={`grid animate-rise grid-cols-[2.25rem_2.5rem_1fr_auto] items-center gap-3 px-4 py-3 transition hover:bg-line/[0.03] sm:grid-cols-[2.5rem_2.5rem_11rem_1fr_7rem] sm:px-5 ${
                r.wallet === me ? "bg-accent/10" : ""
              }`}
              style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
            >
              <span className="font-display text-lg font-extrabold text-muted">#{r.rank}</span>
              <PigAvatar wallet={r.wallet} className="h-10 w-10" />
              <div className="min-w-0">
                <p className="truncate font-mono text-xs">
                  <WalletText wallet={r.wallet} demo={demo} />
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <TierChip xp={r.points} />
                  {tab === "all" && <Move move={r.move} />}
                </div>
              </div>
              <div className="hidden sm:block">
                {tab === "all" ? <XpBar xp={r.points} /> : <p className="font-mono text-[11px] text-muted">{fmtNum(r.points, 1)} XP total</p>}
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold">
                  {tab === "today" && "+"}
                  {fmtNum(valueOf(r, tab), 1)} XP
                </p>
                {tab === "all" && r.lastDay > 0 && <p className="font-mono text-[11px] text-good">+{fmtNum(r.lastDay, 1)} today</p>}
                {tab === "all" && r.lastDay === 0 && <p className="font-mono text-[11px] text-muted">no XP today 😴</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
