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
        <RollingNumber value={info.points} format={(n) => fmtNum(n, 2)} className="text-5xl font-medium tracking-tight" />
        <span className="pb-1 font-mono text-muted">/ {fmtNum(info.cost)} points</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-line/[0.07]">
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
        <Item label="Earning" value={`${fmtNum(info.perDay, 2)} pts/day`} />
        <Item label="Last snapshot" value={`+${fmtNum(info.lastDay, 2)} pts`} />
      </dl>

      <p className="text-xs leading-relaxed text-muted">
        {pct >= 100
          ? "Enough points to redeem a copy."
          : daysLeft !== null
            ? `At today's value, about ${fmtNum(daysLeft)} more ${daysLeft === 1 ? "day" : "days"} to reach ${fmtNum(info.cost)} points. Earnings change with the token price.`
            : `Hold $${site.ticker} to start earning points at the next daily snapshot.`}
        {info.cooldownUntil &&
          ` This wallet redeemed for itself recently — next copy for yourself from ${fmtDate(info.cooldownUntil / 1000)} (gifting and donating still work).`}
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
