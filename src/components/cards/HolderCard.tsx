import { points, site } from "@/config";
import { fmtNum, shortAddr } from "@/lib/format";

export default function HolderCard({ rank, wallet, pts, demo }: { rank: number; wallet: string; pts: number; demo: boolean }) {
  const pct = Math.min(100, (pts / points.redeemCost) * 100);
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted">#{rank}</span>
        <span className="font-mono text-xs text-muted">{shortAddr(wallet, 5)}</span>
      </div>
      <p className="mt-4 font-mono text-3xl">{fmtNum(pts, 1)}</p>
      <p className="label mt-1">points</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line/[0.07]">
        <div className={`h-full rounded-full ${pct >= 100 ? "bg-good" : "bg-gradient-to-r from-accent to-accent2"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted">
        {pct >= 100 ? "Enough for a copy" : `${fmtNum(pct, 0)}% to a copy`}
      </p>
    </>
  );
  return demo ? (
    <div className="card card-hover p-5">{inner}</div>
  ) : (
    <a href={site.explorerAccount(wallet)} target="_blank" rel="noreferrer" className="card card-hover block p-5">
      {inner}
    </a>
  );
}
