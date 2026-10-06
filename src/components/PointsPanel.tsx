"use client";

import { site } from "@/config";
import { fmtDate, fmtNum, fmtUsd, shortAddr } from "@/lib/format";
import type { PointsInfo } from "@/lib/types";
import DemoBadge from "./DemoBadge";
import RollingNumber from "./RollingNumber";

/** Points balance, accrual rate and progress to the next redemption. */
export default function PointsPanel({ info }: { info: PointsInfo }) {
  const pct = Math.min(100, (info.points / info.cost) * 100);
  const missing = Math.max(0, info.cost - info.points);
  const daysLeft = info.perDay > 0 ? Math.ceil(missing / info.perDay) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-sm text-muted">{shortAddr(info.wallet, 6)}</p>
        {info.demo && <DemoBadge />}
      </div>

      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <RollingNumber value={info.points} format={(n) => fmtNum(n, 2)} className="font-display text-5xl font-extrabold tracking-tight" />
        <span className="pb-1 font-mono text-muted">/ {fmtNum(info.cost)} XP</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full border border-line/10 bg-bg">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ${
            pct >= 100 ? "bg-good" : "bg-gradient-to-r from-accent to-accent2"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <Item label={`$${site.ticker} held`} value={fmtNum(info.tokenBalance)} />
        <Item label="Value now" value={fmtUsd(info.usdValue)} />
        <Item label="Earning" value={`${fmtNum(info.perDay, 2)} XP/day`} />
        <Item label="Last XP drop" value={`+${fmtNum(info.lastDay, 2)} XP`} />
      </dl>

      <p className="text-xs leading-relaxed text-muted">
        {pct >= 100
          ? "GTA 6 unlocked. Go claim it. 🎮"
          : daysLeft !== null
            ? `At today's value, about ${fmtNum(daysLeft)} more ${daysLeft === 1 ? "day" : "days"} to reach ${fmtNum(info.cost)} XP. Earnings change with the token price.`
            : `Hold $${site.ticker} to start stacking XP at the next daily drop.`}
        {info.cooldownUntil &&
          ` This wallet claimed for itself recently. Next copy for yourself from ${fmtDate(info.cooldownUntil / 1000)} (gifting and donating still work).`}
        {info.demo && " Demo mode: these numbers are placeholders, not read from the chain."}
      </p>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="mt-1 font-mono text-base text-fg">{value}</dd>
    </div>
  );
}
