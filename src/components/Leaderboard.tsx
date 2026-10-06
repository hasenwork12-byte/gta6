import { points, site } from "@/config";
import { fmtNum, shortAddr } from "@/lib/format";
import DemoBadge from "./DemoBadge";

type Row = { wallet: string; points: number };

const MEDALS = [
  { emoji: "🥇", ring: "border-gold/60", glow: "from-gold/25", h: "sm:mt-0" },
  { emoji: "🥈", ring: "border-line/30", glow: "from-line/10", h: "sm:mt-6" },
  { emoji: "🥉", ring: "border-accent2/50", glow: "from-accent2/20", h: "sm:mt-10" },
];
// Podium order on wide screens: 2nd, 1st, 3rd.
const PODIUM_ORDER = [1, 0, 2];

function WalletLink({ wallet, demo, className = "" }: { wallet: string; demo: boolean; className?: string }) {
  return demo ? (
    <span className={className}>{shortAddr(wallet, 4)}</span>
  ) : (
    <a className={`hover:text-accent2 ${className}`} href={site.explorerAccount(wallet)} target="_blank" rel="noreferrer">
      {shortAddr(wallet, 4)}
    </a>
  );
}

function XpBar({ xp }: { xp: number }) {
  const pct = Math.min(100, (xp / points.redeemCost) * 100);
  return (
    <div className="h-2.5 overflow-hidden rounded-full border border-line/10 bg-bg">
      <div className={`h-full rounded-full ${pct >= 100 ? "bg-good" : "bg-gradient-to-r from-accent to-accent2"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Top 3 on a podium, everyone else as ranked rows with an XP bar. */
export default function Leaderboard({ rows, demo, limit = rows.length }: { rows: Row[]; demo: boolean; limit?: number }) {
  if (rows.length === 0) {
    return (
      <div className="card p-10 text-center text-sm text-muted">
        No XP dropped yet. The first drop comes at the second daily snapshot. 🐷
      </div>
    );
  }
  const top = rows.slice(0, 3);
  const rest = rows.slice(3, limit);

  return (
    <div className="space-y-4">
      {demo && <DemoBadge />}
      <div className="grid items-start gap-3 sm:grid-cols-3">
        {PODIUM_ORDER.filter((i) => top[i]).map((i) => {
          const r = top[i];
          const m = MEDALS[i];
          return (
            <div key={r.wallet} className={`card relative overflow-hidden border-2 p-5 text-center ${m.ring} ${m.h} ${i === 0 ? "" : "order-last sm:order-none"}`}>
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${m.glow} to-transparent`} />
              <div className="relative">
                <span className="text-4xl" aria-hidden>
                  {m.emoji}
                </span>
                <p className="label mt-2">Rank #{i + 1}</p>
                <p className="mt-1 font-mono text-sm">
                  <WalletLink wallet={r.wallet} demo={demo} />
                </p>
                <p className="mt-3 font-display text-4xl font-extrabold tracking-tight">
                  {fmtNum(r.points, 1)}
                  <span className="ml-1 text-base text-muted">XP</span>
                </p>
                <div className="mt-3">
                  <XpBar xp={r.points} />
                </div>
                <p className="mt-2 font-mono text-[11px] text-muted">
                  {r.points >= points.redeemCost ? "GTA 6 unlocked ✓" : `${fmtNum((r.points / points.redeemCost) * 100, 0)}% to GTA 6`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <ol className="card divide-y-2 divide-line/[0.05] overflow-hidden">
          {rest.map((r, i) => (
            <li key={r.wallet} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[3rem_9rem_1fr_6rem] sm:px-5">
              <span className="font-display text-lg font-extrabold text-muted">#{i + 4}</span>
              <WalletLink wallet={r.wallet} demo={demo} className="font-mono text-xs" />
              <div className="hidden sm:block">
                <XpBar xp={r.points} />
              </div>
              <span className="text-right font-mono text-sm font-semibold">{fmtNum(r.points, 1)} XP</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
