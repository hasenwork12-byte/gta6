"use client";

import { points } from "@/config";
import { fmtNum, fmtUsd } from "@/lib/format";
import { useDashboard } from "../DashboardContext";
import RollingNumber from "../RollingNumber";
import BentoCard from "./BentoCard";
import FeesChart, { type FeePoint } from "./FeesChart";

export default function TreasuryPreview({
  fees,
  refTime,
  className = "",
  href = "/treasury",
}: {
  fees: FeePoint[];
  refTime: number;
  className?: string;
  href?: string;
}) {
  const { data } = useDashboard();
  const s = data?.snapshot;
  const usd = s ? s.balanceSol * s.solUsd : 0;
  const price = points.gamePriceUsd;
  const funded = Math.floor(usd / price);
  const remainder = usd - funded * price;

  return (
    <BentoCard label="Treasury" href={href} demo={s?.demo} className={className}>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <RollingNumber value={s?.balanceSol ?? 0} format={(n) => fmtNum(n, 3)} className="text-4xl font-medium tracking-tight" />
        <span className="pb-0.5 font-mono text-sm text-muted">SOL · ≈ {fmtUsd(usd)}</span>
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <FeesChart fees={fees} refTime={refTime} />
      </div>

      <div className="mt-5 border-t border-line/[0.07] pt-4">
        <div className="flex items-baseline justify-between gap-3 text-xs">
          <span className="text-muted">{funded > 0 ? `${funded} funded · next copy` : "Next copy"}</span>
          <span className="font-mono">
            <span className="text-fg">{fmtUsd(remainder, 0)}</span>
            <span className="text-muted"> / {fmtUsd(price, 0)}</span>
          </span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/[0.07]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={price}
          aria-valuenow={Math.round(remainder)}
          aria-label="Progress to next game purchase"
        >
          <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-[width] duration-1000" style={{ width: `${Math.min(100, (remainder / price) * 100)}%` }} />
        </div>
      </div>
    </BentoCard>
  );
}
