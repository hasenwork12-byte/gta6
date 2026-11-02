"use client";

import { TREASURY_WALLET, site } from "@/config";
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
      label: "In the Pig Bank",
      value: s.balanceSol,
      fmt: (n: number) => fmtNum(n, 3),
      unit: "SOL",
      sub: `≈ ${fmtUsd(s.balanceSol * s.solUsd)}`,
    },
    {
      label: s.feesPartial ? "Pig fed (recent)" : "Pig fed, all time",
      value: s.totalFeesSol,
      fmt: (n: number) => fmtNum(n, 3),
      unit: "SOL",
      sub: `≈ ${fmtUsd(s.totalFeesSol * s.solUsd)}`,
    },
    {
      label: "Games claimed",
      value: s.gamesRedeemed,
      fmt: (n: number) => fmtNum(n),
      unit: "",
      sub: `${fmtNum(s.gamesDelivered)} delivered`,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="tag">The scoreboard</p>
        {s.demo && <DemoBadge />}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {stats.map((st, i) => (
          <div key={st.label} className={`card p-4 sm:p-8 ${i === 0 ? "col-span-2 md:col-span-1" : ""}`}>
            <p className="label">{st.label}</p>
            <div className="mt-3 flex flex-wrap items-end gap-x-2 sm:mt-4">
              <RollingNumber value={st.value} format={st.fmt} className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl" />
              {st.unit && <span className="pb-1 font-mono text-muted">{st.unit}</span>}
            </div>
            <p className="mt-2 font-mono text-xs text-muted sm:mt-3 sm:text-sm">{st.sub}</p>
          </div>
        ))}
      </div>
      {!s.demo && TREASURY_WALLET && (
        <p className="mt-3 text-xs text-muted">
          Totalled straight from the Pig Bank wallet&apos;s on-chain transactions.{" "}
          <a className="link" href={site.explorerAccount(TREASURY_WALLET)} target="_blank" rel="noreferrer">
            Check it yourself on Solscan ↗
          </a>
        </p>
      )}
      {error && <p className="mt-3 text-xs text-amber-300">RPC hiccup — showing last known values.</p>}
    </div>
  );
}
