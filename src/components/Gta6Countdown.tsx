"use client";

import { useEffect, useState } from "react";
import { gta6Launch } from "@/config";

const LAUNCH = Date.parse(gta6Launch.iso);

/** Ticking days / hours / minutes / seconds until GTA 6 launches. Turns into "Out now" after. */
export default function Gta6Countdown({ className = "" }: { className?: string }) {
  // Time only after mount, so server and client render the same HTML.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = now === null ? null : Math.max(0, LAUNCH - now);
  const out = left === 0;
  const s = left === null ? 0 : Math.floor(left / 1000);
  const parts: [string, number | null][] = [
    ["days", left === null ? null : Math.floor(s / 86400)],
    ["hrs", left === null ? null : Math.floor((s % 86400) / 3600)],
    ["min", left === null ? null : Math.floor((s % 3600) / 60)],
    ["sec", left === null ? null : s % 60],
  ];

  return (
    <div className={`hud rounded-2xl p-3 sm:p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="label !text-gold">{out ? "GTA 6 is out" : "GTA 6 comes out in"}</p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{gta6Launch.label}</p>
      </div>
      {out ? (
        <p className="mt-2 font-display text-2xl font-extrabold">Out now. Go claim yours.</p>
      ) : (
        <div className="mt-2 grid grid-cols-4 gap-1.5 sm:gap-2">
          {parts.map(([unit, v]) => (
            <div key={unit} className="rounded-xl border-2 border-line/[0.08] bg-bg/70 px-1 py-1.5 text-center">
              <p className="font-display text-2xl font-extrabold leading-none tabular sm:text-3xl" suppressHydrationWarning>
                {v === null ? "--" : String(v).padStart(2, "0")}
              </p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted sm:text-[10px]">{unit}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
