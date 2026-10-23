"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { site } from "@/config";
import { fmtCompact, fmtDate, fmtNum } from "@/lib/format";
import type { BuybackPoint } from "@/lib/types";

type Measure = "tokens" | "sol";

const H = 220;
const PAD = { top: 16, right: 14, bottom: 26, left: 46 };

/** Rounds the axis max up to a tidy number and returns ~4 evenly spaced ticks. */
function niceTicks(max: number) {
  if (max <= 0) return [0, 1];
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

/**
 * Running total of buybacks over time: a step line (totals only change at a
 * buyback) with a dot per buyback. One series, so no legend; the toggle picks
 * the measure. Hover or tap anywhere to read the nearest buyback.
 */
export default function BuybackChart({ history, burn }: { history: BuybackPoint[]; burn: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [measure, setMeasure] = useState<Measure>("tokens");
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pts = useMemo(() => {
    let tok = 0;
    let sol = 0;
    return history.map((h) => ({ ...h, cumTokens: (tok += h.tokens), cumSol: (sol += h.sol) }));
  }, [history]);

  const val = (p: (typeof pts)[number]) => (measure === "tokens" ? p.cumTokens : p.cumSol);
  const fmtAxis = (v: number) => (measure === "tokens" ? fmtCompact(v) : fmtNum(v, v < 10 ? 1 : 0));
  const fmtFull = (v: number) => (measure === "tokens" ? `${fmtNum(v)} $${site.ticker}` : `${fmtNum(v, 3)} SOL`);

  const ticks = niceTicks(pts.length ? val(pts[pts.length - 1]) : 1);
  const yMax = ticks[ticks.length - 1];
  const t0 = pts.length ? pts[0].time : 0;
  // Leave a little room after the last buyback so the final step is visible.
  const t1 = pts.length ? pts[pts.length - 1].time + Math.max(86400, (pts[pts.length - 1].time - t0) * 0.06) : 1;
  const iw = Math.max(0, w - PAD.left - PAD.right);
  const ih = H - PAD.top - PAD.bottom;
  const x = (t: number) => PAD.left + (t1 === t0 ? 0 : ((t - t0) / (t1 - t0)) * iw);
  const y = (v: number) => PAD.top + ih - (v / yMax) * ih;

  // Step-after path starting from zero.
  let line = "";
  if (pts.length) {
    line = `M${x(t0)},${y(0)}`;
    let prev = 0;
    for (const p of pts) {
      line += ` L${x(p.time)},${y(prev)} L${x(p.time)},${y(val(p))}`;
      prev = val(p);
    }
    line += ` L${x(t1)},${y(prev)}`;
  }
  const area = line ? `${line} L${x(t1)},${y(0)} Z` : "";

  const onMove = (clientX: number) => {
    const el = box.current;
    if (!el || !pts.length) return;
    const px = clientX - el.getBoundingClientRect().left;
    let best = 0;
    pts.forEach((p, i) => {
      if (Math.abs(x(p.time) - px) < Math.abs(x(pts[best].time) - px)) best = i;
    });
    setHover(best);
  };

  const hp = hover !== null ? pts[hover] : null;
  const midIdx = Math.floor(pts.length / 2);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          {measure === "tokens" ? `$${site.ticker} bought back${burn ? " & burned" : ""}` : "SOL spent on buybacks"}
          <span className="ml-1.5 font-normal text-muted">· running total</span>
        </p>
        <div role="tablist" aria-label="Chart measure" className="flex gap-1 rounded-xl border-2 border-line/[0.08] bg-bg/60 p-0.5">
          {(
            [
              ["tokens", `$${site.ticker}`],
              ["sol", "SOL"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={measure === id}
              onClick={() => setMeasure(id)}
              className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold transition ${measure === id ? "bg-line/[0.12] text-fg" : "text-muted hover:text-fg"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={box}
        className="relative touch-pan-y select-none"
        style={{ height: H }}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => onMove(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
      >
        {w > 0 && pts.length > 0 && (
          <svg width={w} height={H} className="block" role="img" aria-label={`Running total of buybacks: ${fmtFull(val(pts[pts.length - 1]))} across ${pts.length} buybacks`}>
            <defs>
              <linearGradient id="bb-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgb(var(--gold))" stopOpacity="0.28" />
                <stop offset="1" stopColor="rgb(var(--gold))" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* recessive grid + y labels */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={w - PAD.right} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" strokeOpacity={t === 0 ? 0.18 : 0.06} />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[10px]">
                  {fmtAxis(t)}
                </text>
              </g>
            ))}

            {/* x labels: first, middle, last buyback */}
            {[...new Set([0, midIdx, pts.length - 1])].map((i, k, arr) => (
              <text
                key={i}
                x={x(pts[i].time)}
                y={H - 6}
                textAnchor={k === 0 ? "start" : k === arr.length - 1 && arr.length > 1 ? "end" : "middle"}
                className="fill-muted font-mono text-[10px]"
              >
                {fmtDate(pts[i].time).replace(/, \d{4}$/, "")}
              </text>
            ))}

            <path d={area} fill="url(#bb-area)" />
            <path d={line} fill="none" stroke="rgb(var(--gold))" strokeWidth={2} strokeLinejoin="round" />

            {hp && <line x1={x(hp.time)} x2={x(hp.time)} y1={PAD.top} y2={PAD.top + ih} stroke="rgb(var(--line))" strokeOpacity={0.25} strokeDasharray="3 3" />}

            {pts.map((p, i) => (
              <circle
                key={p.signature}
                cx={x(p.time)}
                cy={y(val(p))}
                r={hover === i ? 6 : 4}
                fill="rgb(var(--gold))"
                stroke="rgb(var(--surface))"
                strokeWidth={2}
              />
            ))}
          </svg>
        )}

        {hp && (
          <div
            className="pointer-events-none absolute top-1 z-10 w-48 rounded-xl border-2 border-line/10 bg-bg/95 px-3 py-2 text-xs shadow-[0_4px_0_0_rgb(0_0_0/0.4)] backdrop-blur"
            style={{ left: Math.min(Math.max(x(hp.time) - 96, 0), Math.max(0, w - 192)) }}
          >
            <p className="font-mono text-[10px] text-muted">
              Buyback #{(hover ?? 0) + 1} · {fmtDate(hp.time)}
            </p>
            <p className="mt-1 font-semibold">
              {fmtNum(hp.sol, 3)} SOL → {fmtCompact(hp.tokens)} ${site.ticker}
            </p>
            <p className="mt-0.5 text-muted">
              Total: <span className="text-fg">{fmtFull(val(hp))}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
