"use client";

import { useState } from "react";
import { points, site } from "@/config";
import { fmtCompact, fmtNum, fmtUsd } from "@/lib/format";
import type { DailyPoint } from "@/lib/types";
import { useDashboard } from "./DashboardContext";
import DemoBadge from "./DemoBadge";

/** $1,234.56 for big totals, $1.2K / $6.45M for card headlines. */
const usdCompact = (v: number) => (v < 1000 ? fmtUsd(v) : "$" + v.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 }));
const dayLabel = (day: number) => new Date(day * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/**
 * Protocol analytics, laid out like a plain on-chain stats board: two big
 * lifetime totals (fees claimed, $PIG burned), then one card per measure with
 * the last 14 UTC days as bars. Values are SOL converted at the live SOL price.
 */
export default function ProtocolAnalytics({ title = "Protocol analytics" }: { title?: string }) {
  const { data } = useDashboard();
  const s = data?.snapshot;
  if (!s?.daily) return null;
  const usd = (sol: number) => sol * s.solUsd;
  const b = s.buyback;

  const feesSol = s.totalFeesSol;
  const burnSol = b.burnedSol;
  const game = points.gamePriceUsd;
  const burnTokens = b.burn ? b.tokensBurned : b.tokensBought;
  const pctSupply = b.supply ? (burnTokens / b.supply) * 100 : null;
  const burnWord = b.burn ? "burned" : "bought back";

  const cards = [
    {
      label: "Fees",
      total: usd(feesSol),
      note: `Daily in UTC · last ${s.daily.length} days shown.`,
      pick: (d: DailyPoint) => usd(d.feesSol),
      tip: (d: DailyPoint) => `${fmtNum(d.feesSol, 3)} SOL claimed`,
    },
    {
      label: `$${site.ticker} ${burnWord}`,
      total: usd(burnSol),
      note: `Daily in UTC · last ${s.daily.length} days shown.`,
      pick: (d: DailyPoint) => usd(d.burnSol),
      tip: (d: DailyPoint) => `${fmtCompact(d.burnTokens)} $${site.ticker} ${burnWord}`,
    },
    {
      label: "Spent on GTA 6",
      total: s.gamesDelivered * game,
      note: `${fmtNum(s.gamesDelivered)} copies × ${fmtUsd(game, 0)} · last ${s.daily.length} days shown.`,
      pick: (d: DailyPoint) => d.games * game,
      tip: (d: DailyPoint) => `${fmtNum(d.games)} ${d.games === 1 ? "copy" : "copies"} delivered`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-line/[0.06] bg-line/[0.035] p-6 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold tracking-tight sm:text-4xl">{title}</h3>
          {s.demo && <DemoBadge />}
        </div>
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          <Total label="Total fees claimed" value={fmtUsd(usd(feesSol))} sub={`${fmtNum(feesSol, 3)} SOL · since the first claim${s.feesPartial ? " (recent txs only)" : ""}`} />
          <Total
            label={`Total $${site.ticker} ${burnWord}`}
            value={fmtUsd(usd(burnSol))}
            sub={`${fmtCompact(burnTokens)} $${site.ticker}${pctSupply !== null ? ` · ${fmtNum(pctSupply, pctSupply < 1 ? 3 : 2)}% of supply` : ""}${b.burn ? " · gone for good" : ""}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <BarCard key={c.label} {...c} days={s.daily} />
        ))}
      </div>
      <p className="font-mono text-[11px] text-muted">
        Fees and burns are SOL amounts shown at today&apos;s SOL price ({fmtUsd(s.solUsd)}); burns count what the burned ${site.ticker} cost to buy.
      </p>
    </div>
  );
}

function Total({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 break-words text-4xl font-medium tabular-nums tracking-tight sm:text-6xl">{value}</p>
      <p className="mt-2 text-sm text-muted">{sub}</p>
    </div>
  );
}

function BarCard({
  label,
  total,
  note,
  days,
  pick,
  tip,
}: {
  label: string;
  total: number;
  note: string;
  days: DailyPoint[];
  pick: (d: DailyPoint) => number;
  tip: (d: DailyPoint) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const vals = days.map(pick);
  const max = Math.max(...vals, 0);
  const h = hover !== null ? days[hover] : null;

  return (
    <div className="flex min-w-0 flex-col rounded-[28px] border border-line/[0.06] bg-line/[0.035] p-6 sm:p-8">
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-3xl font-medium tabular-nums tracking-tight sm:text-4xl">{usdCompact(total)}</p>
      <p className="mt-1 text-sm text-muted">{note}</p>

      <div className="relative mt-6 rounded-2xl bg-line/[0.03] px-3 pb-2 pt-10 sm:px-4" onMouseLeave={() => setHover(null)}>
        <div className="pointer-events-none absolute inset-x-3 top-2 h-6 truncate font-mono text-[11px] sm:inset-x-4">
          {h ? (
            <span>
              <span className="text-muted">{dayLabel(h.day)} · </span>
              <span className="text-fg">{fmtUsd(pick(h))}</span>
              <span className="text-muted"> · {tip(h)}</span>
            </span>
          ) : (
            <span className="text-muted">Hover or tap a day</span>
          )}
        </div>
        <div className="flex h-44 items-end gap-[5px] sm:h-48" role="img" aria-label={`${label}, last ${days.length} days`}>
          {days.map((d, i) => {
            const pct = max > 0 ? (vals[i] / max) * 100 : 0;
            return (
              <button
                key={d.day}
                type="button"
                aria-label={`${dayLabel(d.day)}: ${fmtUsd(vals[i])}`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onClick={() => setHover(i)}
                className="flex h-full flex-1 items-end"
              >
                <span
                  className={`block w-full rounded-[5px] transition-colors ${hover === i ? "bg-gold" : "bg-line/25"}`}
                  style={{ height: `max(${pct}%, 6px)` }}
                />
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] text-muted">
          <span>{dayLabel(days[0].day)}</span>
          <span>{dayLabel(days[days.length - 1].day)}</span>
        </div>
      </div>
    </div>
  );
}
