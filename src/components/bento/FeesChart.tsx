"use client";

import { useMemo, useRef, useState } from "react";
import { fmtDateTime, fmtNum } from "@/lib/format";

export type FeePoint = { time: number; sol: number }; // unix seconds

const RANGES = [
  { id: "1d", label: "1D", secs: 86_400, name: "24h" },
  { id: "30d", label: "30D", secs: 30 * 86_400, name: "30 days" },
  { id: "all", label: "All time", secs: Infinity, name: "all time" },
] as const;

const W = 600;
const H = 120;
const PAD = 6;

/** Cumulative creator fees over the selected range — single series, so no legend. */
export default function FeesChart({ fees, refTime }: { fees: FeePoint[]; refTime: number }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[0]);
  const [hover, setHover] = useState<{ x: number; y: number; v: number; t: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const s = useMemo(() => {
    const sorted = [...fees].sort((a, b) => a.time - b.time);
    const start =
      range.secs === Infinity ? (sorted.length ? Math.min(sorted[0].time, refTime - 3600) : refTime - 86_400) : refTime - range.secs;
    const pts: { t: number; v: number }[] = [{ t: start, v: 0 }];
    let cum = 0;
    for (const f of sorted) {
      if (f.time < start || f.time > refTime) continue;
      cum += f.sol;
      pts.push({ t: f.time, v: cum });
    }
    pts.push({ t: refTime, v: cum });
    const span = Math.max(1, refTime - start);
    const max = cum || 1;
    const xy = pts.map((p) => ({
      ...p,
      x: ((p.t - start) / span) * W,
      y: H - PAD - (p.v / max) * (H - PAD * 2),
    }));
    const line = xy.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    return { xy, line, area: `${line} L${W} ${H} L0 ${H} Z`, total: cum, start, span };
  }, [fees, refTime, range]);

  const onMove = (e: React.PointerEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const t = s.start + frac * s.span;
    let p = s.xy[0];
    for (const q of s.xy) if (q.t <= t) p = q;
    setHover({ x: frac * 100, y: (p.y / H) * 100, v: p.v, t });
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          Fees · <span className="font-mono text-fg">+{fmtNum(s.total, 3)} SOL</span> in {range.name}
        </p>
        <div role="tablist" aria-label="Chart range" className="flex rounded-full border border-line/10 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={range.id === r.id}
              onClick={() => setRange(r)}
              className={`rounded-full px-2.5 py-1 font-mono text-[11px] transition ${
                range.id === r.id ? "bg-line/[0.1] text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={box}
        className="relative mt-4 min-h-[7rem] flex-1 touch-none select-none sm:min-h-[8rem]"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" role="img" aria-label={`Cumulative creator fees, ${fmtNum(s.total, 3)} SOL over ${range.name}`}>
          <defs>
            <linearGradient id="fees-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgb(var(--accent-1))" stopOpacity="0.28" />
              <stop offset="1" stopColor="rgb(var(--accent-1))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" x2={W} y1={H - 0.5} y2={H - 0.5} stroke="rgb(var(--line))" strokeOpacity="0.1" vectorEffect="non-scaling-stroke" />
          <path d={s.area} fill="url(#fees-area)" />
          <path d={s.line} fill="none" stroke="rgb(var(--accent-1))" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {hover && (
          <>
            <div className="pointer-events-none absolute inset-y-0 w-px bg-line/25" style={{ left: `${hover.x}%` }} />
            <div
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent"
              style={{ left: `${hover.x}%`, top: `${hover.y}%` }}
            />
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg border border-line/10 bg-bg/95 px-2.5 py-1.5 font-mono text-[11px] shadow-lg"
              style={{ left: `${Math.min(Math.max(hover.x, 18), 82)}%`, transform: "translate(-50%, -100%)" }}
            >
              <span className="text-fg">{fmtNum(hover.v, 3)} SOL</span>
              <span className="text-muted"> · {fmtDateTime(hover.t)}</span>
            </div>
          </>
        )}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted">
        <span>{fmtDateTime(s.start)}</span>
        <span>{fmtDateTime(refTime)}</span>
      </div>
    </div>
  );
}
