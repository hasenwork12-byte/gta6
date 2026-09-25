"use client";

import { fmtNum, fmtUsd } from "@/lib/format";
import { useDashboard } from "./DashboardContext";
import DemoBadge from "./DemoBadge";
import RollingNumber from "./RollingNumber";

export default function BigStats() {
  const { data, error } = useDashboard();
  if (!data) return null;
  const s = data.snapshot;
  const stats = [
    {
      label: "Treasury balance",
      value: s.balanceSol,
      fmt: (n: number) => fmtNum(n, 3),
      unit: "SOL",
      sub: `≈ ${fmtUsd(s.balanceSol * s.solUsd)}`,
    },
    {
      label: s.feesPartial ? "Fees collected (recent)" : "Fees collected",
      value: s.totalFeesSol,
      fmt: (n: number) => fmtNum(n, 3),
      unit: "SOL",
      sub: `≈ ${fmtUsd(s.totalFeesSol * s.solUsd)}`,
    },
    {
      label: "Games redeemed",
      value: s.gamesRedeemed,
      fmt: (n: number) => fmtNum(n),
      unit: "",
      sub: `${fmtNum(s.gamesDelivered)} delivered`,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="label">By the numbers</p>
        {s.demo && <DemoBadge />}
      </div>
      <div className="grid gap-px overflow-hidden rounded-2xl border border-line/[0.08] bg-line/[0.08] md:grid-cols-3">
        {stats.map((st) => (
          <div key={st.label} className="bg-bg p-6 sm:p-8">
            <p className="label">{st.label}</p>
            <div className="mt-4 flex items-end gap-2">
              <RollingNumber value={st.value} format={st.fmt} className="text-5xl font-medium tracking-tight sm:text-6xl" />
              {st.unit && <span className="pb-1 font-mono text-muted">{st.unit}</span>}
            </div>
            <p className="mt-3 font-mono text-sm text-muted">{st.sub}</p>
          </div>
        ))}
      </div>
      {error && <p className="mt-3 text-xs text-amber-300">RPC hiccup — showing last known values.</p>}
    </div>
  );
}
