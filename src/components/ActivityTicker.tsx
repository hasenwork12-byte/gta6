"use client";

import { fmtNum, fmtDateTime } from "@/lib/format";
import { useDashboard } from "./DashboardContext";
import Ticker from "./Ticker";

export default function ActivityTicker() {
  const { data } = useDashboard();
  const entries = data?.recent ?? [];
  if (entries.length === 0) return null;
  const demo = data?.snapshot.demo;
  return (
    <div className="flex items-center gap-3 overflow-hidden border-y-2 border-line/[0.07] bg-surface/50 py-2.5">
      <span className="label shrink-0 pl-4 sm:pl-6">{demo ? "Demo feed" : "Live"} 🐷</span>
      <Ticker duration={Math.max(30, entries.length * 4)}>
        {entries.map((e) => (
          <span key={e.signature} className="flex items-center gap-2 whitespace-nowrap px-4 font-mono text-xs">
            <span className={e.direction === "in" ? "text-good" : "text-accent"}>
              {e.direction === "in" ? "+" : "−"}
              {fmtNum(e.sol, 3)} SOL
            </span>
            <span className="text-fg/80">{e.direction === "in" ? "pig fed" : "copy bought"}</span>
            <span className="text-muted">{fmtDateTime(e.time)}</span>
            <span className="text-line/20">•</span>
          </span>
        ))}
      </Ticker>
    </div>
  );
}
