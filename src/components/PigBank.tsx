"use client";

import { points } from "@/config";
import { gamesSol } from "@/lib/buyback";
import { fmtNum, fmtUsd } from "@/lib/format";
import { useDashboard } from "./DashboardContext";
import DemoBadge from "./DemoBadge";
import RollingNumber from "./RollingNumber";

/**
 * The treasury as a glass piggy bank. Gold "liquid" fills the body with the
 * progress toward the next copy; the SOL balance sits in its belly.
 * Artwork matches public/logo.svg (same coordinates, inside translate(0 -4)).
 */

// Body ellipse spans y 23..55 (pre-translate). Liquid top for a given fill %.
const BODY_TOP = 23;
const BODY_BOTTOM = 55;

// One tile of the liquid surface: wavelength 16, repeated well past both edges.
const WAVE = (() => {
  let d = "M-32 2";
  for (let x = -32; x < 112; x += 16) d += ` q4 -2.2 8 0 t8 0`;
  return d + " V40 H-32 Z";
})();

const COINS = [
  { x: 25, delay: "0s" },
  { x: 29.5, delay: "0.9s" },
  { x: 33, delay: "1.7s" },
];

export default function PigBank({ className = "" }: { className?: string }) {
  const { data } = useDashboard();
  const s = data?.snapshot;
  // Only the part not owed to buybacks can buy games.
  const pot = s ? gamesSol(s.balanceSol, s.buyback.reservedSol) : 0;
  const usd = s ? pot * s.solUsd : 0;
  const price = points.gamePriceUsd;
  const funded = Math.floor(usd / price);
  const remainder = usd - funded * price;
  const pct = Math.max(4, Math.min(100, (remainder / price) * 100));
  const level = BODY_BOTTOM - ((BODY_BOTTOM - BODY_TOP) * pct) / 100;

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-accent/35 to-gold/25 blur-3xl" aria-hidden />

      <div className="relative">
        <svg viewBox="-6 -16 76 78" className="h-auto w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.5)]" aria-hidden>
          <defs>
            <clipPath id="pigbank-body" clipPathUnits="userSpaceOnUse">
              <ellipse cx="30" cy="39" rx="20" ry="15" />
            </clipPath>
            <linearGradient id="pigbank-liquid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe08a" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="pigbank-rim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff9f43" />
              <stop offset="1" stopColor="#ff3d8b" />
            </linearGradient>
            <linearGradient id="pigbank-coin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffe29a" />
              <stop offset="1" stopColor="#f5a524" />
            </linearGradient>
          </defs>

          <g transform="translate(0 -4)">
            {/* coins dropping into the slot (behind the controller and body) */}
            {COINS.map((c) => (
              <g key={c.x} className="svg-box animate-coinDrop" style={{ animationDelay: c.delay }}>
                <circle cx={c.x} cy={10} r={3.4} fill="url(#pigbank-coin)" stroke="#c97a10" strokeWidth=".7" />
              </g>
            ))}

            {/* tail + legs */}
            <path d="M9.6 38.2c-3.4-.7-4.9 2.7-2.4 3.8 2.2.9 3.2-1.9 1-2.6" fill="none" stroke="#ff3d8b" strokeWidth="1.9" strokeLinecap="round" />
            <rect x="14.5" y="47" width="7" height="10" rx="3" fill="#e8307a" />
            <rect x="36.5" y="47" width="7" height="10" rx="3" fill="#e8307a" />

            {/* controller in the coin slot */}
            <g transform="translate(28.5 16.8) rotate(-14) scale(0.8)">
              <path
                d="M-7 -5H7C10 -5 11.2 -2.6 11.8 .4L12.6 4.2C13.1 6.8 10.4 8 8.8 6.3L6.4 3.8H-6.4L-8.8 6.3C-10.4 8 -13.1 6.8 -12.6 4.2L-11.8 .4C-11.2 -2.6 -10 -5 -7 -5Z"
                fill="#f4f1f7"
                stroke="#1a0d14"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <rect x="-9" y="-1.4" width="5.2" height="1.9" rx=".5" fill="#1a0d14" />
              <rect x="-7.35" y="-3.05" width="1.9" height="5.2" rx=".5" fill="#1a0d14" />
              <circle cx="6" cy="-2.3" r="1.25" fill="#ff3d8b" />
              <circle cx="8.4" cy="-.1" r="1.25" fill="#ff9f43" />
              <circle cx="3.6" cy="-.1" r="1.25" fill="#ff9f43" />
              <circle cx="6" cy="2.1" r="1.25" fill="#ff3d8b" />
            </g>

            {/* glass body */}
            <ellipse cx="30" cy="39" rx="21" ry="16" fill="#2a1030" />
            <g clipPath="url(#pigbank-body)">
              <g transform={`translate(0 ${level})`} className="transition-transform duration-1000">
                <path d={WAVE} fill="url(#pigbank-liquid)" className="animate-wave" />
                {/* a few coin glints in the gold */}
                <circle cx="20" cy="6" r="1.1" fill="#fff6d6" opacity=".7" />
                <circle cx="38" cy="10" r=".8" fill="#fff6d6" opacity=".6" />
                <circle cx="27" cy="14" r=".9" fill="#fff6d6" opacity=".5" />
              </g>
            </g>
            <ellipse cx="30" cy="39" rx="21" ry="16" fill="none" stroke="url(#pigbank-rim)" strokeWidth="2.2" />
            <ellipse cx="22" cy="31" rx="7.5" ry="2.6" fill="#fff" opacity=".18" />

            {/* ear */}
            <path d="M38.2 27.2L44.6 17.4Q47.6 23.4 46 29.6Z" fill="#ff8a4c" />
            <path d="M40.6 26.6L44.2 21Q45.6 24.6 44.8 28Z" fill="#ffc9a3" />
            {/* snout */}
            <ellipse cx="50.5" cy="41" rx="6.5" ry="5.5" fill="#ff7aa8" />
            <ellipse cx="48.4" cy="41" rx="1.15" ry="1.7" fill="#7a1740" />
            <ellipse cx="52.6" cy="41" rx="1.15" ry="1.7" fill="#7a1740" />
            {/* face */}
            <circle cx="43" cy="33.5" r="2" fill="#1a0d14" />
            <circle cx="43.7" cy="32.8" r=".65" fill="#fff" />
            {/* coin slot */}
            <rect x="21.5" y="23" width="14" height="3.4" rx="1.7" fill="#1a0d14" />
          </g>
        </svg>

        {/* Balance in the belly. Positioned over the body centre (x 30, y 35 in the viewBox). */}
        <div className="absolute left-[47.4%] top-[65%] -translate-x-1/2 -translate-y-1/2">
          <div className="rounded-2xl border border-line/10 bg-bg/80 px-3 py-1.5 text-center shadow-[0_16px_40px_-24px_rgb(0_0_0/0.8)] backdrop-blur sm:px-4 sm:py-2">
            <RollingNumber
              value={pot}
              format={(n) => fmtNum(n, 3)}
              className="font-display text-xl font-extrabold leading-none tracking-tight sm:text-3xl"
            />
            <span className="ml-1 font-mono text-[10px] font-semibold text-muted sm:text-xs">SOL</span>
            <p className="mt-0.5 font-mono text-[10px] text-gold sm:text-xs">≈ {fmtUsd(usd)}</p>
          </div>
        </div>
      </div>

      {/* Progress to the next copy */}
      <div className="relative mx-auto -mt-2 flex w-fit max-w-full flex-wrap items-center justify-center gap-2">
        <span className="chip">
          <span className="text-gold">{fmtNum(Math.min(100, (remainder / price) * 100), 0)}% full</span>
        </span>
        <span className="chip text-muted">
          copy #{funded + 1}: <span className="text-fg">{fmtUsd(remainder, 0)}</span> / {fmtUsd(price, 0)}
        </span>
        {s?.demo && <DemoBadge className="!py-0.5" />}
      </div>
      <p className="mx-auto mt-3 max-w-sm text-center text-xs leading-relaxed text-muted">
        {funded > 0
          ? `The pot already covers ${fmtNum(funded)} ${funded === 1 ? "copy" : "copies"}. The bar is only the next one.`
          : "The bar is progress toward the first copy."}{" "}
        Buyback money is kept out of this pot.
      </p>
    </div>
  );
}
