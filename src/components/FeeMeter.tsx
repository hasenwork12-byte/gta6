"use client";

import { useEffect, useState } from "react";
import { Bot, Gamepad2, Hourglass, Wallet } from "lucide-react";
import { fmtNum, fmtUsd } from "@/lib/format";
import { useDashboard } from "./DashboardContext";
import DemoBadge from "./DemoBadge";
import RollingNumber from "./RollingNumber";

/** "00:12:41" counting up from a unix time. Days are shown once it passes 24h. */
function useElapsed(since: number | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!since || now === null) return "--:--:--";
  const s = Math.max(0, Math.floor(now / 1000) - since);
  const d = Math.floor(s / 86400);
  const hms = [Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60].map((v) => String(v).padStart(2, "0")).join(":");
  return d > 0 ? `${d}d ${hms}` : hms;
}

/**
 * The money machine at a glance: fees earned (live), claimed vs waiting,
 * how long since the bot last claimed, and how many GTA 6 keys are ready.
 */
export default function FeeMeter() {
  const { data } = useDashboard();
  const s = data?.snapshot;
  const sinceClaim = useElapsed(s?.fees.lastClaimAt ?? null);
  if (!s) return null;
  const f = s.fees;

  const cells = [
    { icon: Wallet, label: "Claimed", value: `${fmtNum(f.claimedSol, 3)} SOL`, sub: fmtUsd(f.claimedSol * s.solUsd) },
    { icon: Hourglass, label: "Waiting to claim", value: `${fmtNum(f.unclaimedSol, 4)} SOL`, sub: f.bot ? "bot grabs it next run" : "claimed by hand" },
    { icon: Gamepad2, label: "GTA 6 keys ready", value: fmtNum(s.keysInStock), sub: `${fmtNum(s.gamesDelivered)} delivered` },
  ];

  return (
    <div className="hud relative overflow-hidden rounded-3xl p-4 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <p className="label flex items-center gap-2 !text-gold">
          <span className="h-2 w-2 animate-pulseDot rounded-full bg-good" />
          Fee meter · live
        </p>
        {s.demo && <DemoBadge className="!py-0.5" />}
      </div>

      <div className="relative mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
        <RollingNumber value={f.earnedSol} format={(n) => fmtNum(n, 4)} className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl" />
        <span className="pb-1.5 font-mono text-sm text-muted">SOL earned in fees</span>
      </div>
      <p className="relative mt-1 font-mono text-sm text-gold">≈ {fmtUsd(f.earnedSol * s.solUsd)} all time</p>

      <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {cells.map((c, i) => (
          <div key={c.label} className={`rounded-2xl border-2 border-line/[0.08] bg-bg/60 p-3 ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              <c.icon className="h-3.5 w-3.5" aria-hidden />
              {c.label}
            </p>
            <p className="mt-1.5 font-display text-xl font-extrabold tabular sm:text-2xl">{c.value}</p>
            <p className="font-mono text-[11px] text-muted">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2 border-t-2 border-line/[0.06] pt-3 font-mono text-xs">
        <span className="flex items-center gap-1.5 text-muted">
          <Bot className="h-4 w-4 text-gold" aria-hidden />
          {f.bot ? "Auto-claim bot on" : "Auto-claim bot off"}
        </span>
        <span className="text-muted">
          Last claim{" "}
          <span className="font-bold tabular text-fg" suppressHydrationWarning>
            {f.lastClaimAt ? sinceClaim : "not yet"}
          </span>{" "}
          {f.lastClaimAt ? "ago" : ""}
        </span>
      </div>
    </div>
  );
}
