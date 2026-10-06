"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { points, site } from "@/config";
import { fmtNum, fmtUsd } from "@/lib/format";

const PRESETS = [100, 500, 1_000, 5_000, 10_000];
const MAX = 25_000;
const DAY_MS = 86_400_000;

/**
 * "I hold $X → GTA 6 in N days." Answers the one question every visitor has.
 * Assumes a flat price; the first snapshot only records balances, so a new
 * holder starts earning one day later.
 */
export default function EarnCalculator({ className = "" }: { className?: string }) {
  const [usd, setUsd] = useState(1_000);
  // Date only after mount, so server and client render the same HTML.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  const perDay = usd / points.usdPerPointDay;
  const days = perDay > 0 ? Math.ceil(points.redeemCost / perDay) + 1 : null;
  const date = days && now ? new Date(now + days * DAY_MS) : null;
  const perMonth = perDay * 30;

  return (
    <div className={`card relative overflow-hidden p-5 sm:p-7 ${className}`}>
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <p className="label">Calculator</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">How long until my copy?</h2>

          <label htmlFor="earn-usd" className="mt-6 block text-sm text-muted">
            If I hold this much ${site.ticker}…
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-line/15 bg-bg/60 px-4 focus-within:border-accent/60">
            <span className="font-display text-3xl text-muted">$</span>
            <input
              id="earn-usd"
              inputMode="numeric"
              value={usd ? fmtNum(usd) : ""}
              onChange={(e) => setUsd(Math.min(10_000_000, Number(e.target.value.replace(/[^\d]/g, "")) || 0))}
              className="h-16 min-w-0 flex-1 bg-transparent font-display text-3xl font-semibold tabular outline-none"
              aria-describedby="earn-result"
            />
          </div>
          <input
            type="range"
            min={10}
            max={MAX}
            step={10}
            value={Math.min(usd, MAX)}
            onChange={(e) => setUsd(Number(e.target.value))}
            className="mt-4 w-full accent-[rgb(var(--accent-1))]"
            aria-label="Amount held in US dollars"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setUsd(p)}
                className={`rounded-full border px-3 py-1 font-mono text-xs transition ${
                  usd === p ? "border-accent/60 bg-accent/15 text-fg" : "border-line/15 text-muted hover:border-line/30 hover:text-fg"
                }`}
              >
                {fmtUsd(p, 0)}
              </button>
            ))}
          </div>
        </div>

        <div id="earn-result" aria-live="polite" className="rounded-2xl border border-line/[0.08] bg-bg/50 p-5 sm:p-6">
          <p className="text-sm text-muted">…GTA 6 is yours in about</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="accent-text font-display text-6xl font-extrabold tracking-tight tabular sm:text-7xl">
              {days ? fmtNum(days) : "—"}
            </span>
            <span className="font-display text-xl font-semibold">{days === 1 ? "day" : "days"}</span>
          </p>
          {date && (
            <p className="mt-1 text-sm text-muted">
              around{" "}
              <span className="text-fg">
                {date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </p>
          )}

          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line/[0.07] pt-4 font-mono text-xs">
            <div>
              <dt className="text-muted">Points / day</dt>
              <dd className="mt-1 text-sm text-fg">+{fmtNum(perDay, perDay < 10 ? 1 : 0)}</dd>
            </div>
            <div>
              <dt className="text-muted">Points / month</dt>
              <dd className="mt-1 text-sm text-fg">+{fmtNum(perMonth, 0)}</dd>
            </div>
          </dl>
          {days !== null && days < points.cooldownDays && (
            <p className="mt-4 text-xs leading-relaxed text-muted">
              You can redeem one copy for yourself every {points.cooldownDays} days. Extra points can be{" "}
              <Link href="/redeem" className="link">gifted to a friend</Link>.
            </p>
          )}
        </div>
      </div>

      <p className="relative mt-5 text-xs leading-relaxed text-muted">
        Estimate only. Assumes the ${site.ticker} price stays flat. You earn on the lower of your balance and price at
        two daily snapshots, so your first day only counts once the second snapshot runs. Points have no cash value.
      </p>
    </div>
  );
}
