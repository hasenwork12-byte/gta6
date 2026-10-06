/**
 * The big hero mascot: the logo pig, floating, with coins dropping into its
 * coin slot. Same artwork as public/logo.svg, drawn inline so parts can animate.
 * Coins are drawn behind the body, so they "disappear" into the slot.
 */
const COINS = [
  { x: 24.5, delay: "0s" },
  { x: 29.5, delay: "0.8s" },
  { x: 33.5, delay: "1.6s" },
];

const SPARKLES = [
  { x: 2, y: 4, s: 1, delay: "0s" },
  { x: 58, y: -6, s: 0.8, delay: "0.9s" },
  { x: 62, y: 30, s: 0.6, delay: "1.7s" },
  { x: -2, y: 44, s: 0.7, delay: "2.3s" },
];

function Sparkle({ x, y, s, delay }: { x: number; y: number; s: number; delay: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        className="svg-box animate-twinkle"
        style={{ animationDelay: delay }}
        d="M0 -4C.6 -1 1 -.6 4 0C1 .6 .6 1 0 4C-.6 1 -1 .6 -4 0C-1 -.6 -.6 -1 0 -4Z"
        fill="#ffd38a"
      />
    </g>
  );
}

export default function HeroPig({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      {/* sunset glow behind the pig */}
      <div className="absolute inset-[12%] rounded-full bg-gradient-to-br from-accent/40 to-accent2/30 blur-3xl" />

      <div className="relative animate-float">
        <svg viewBox="-8 -30 80 92" className="h-auto w-full drop-shadow-[0_20px_40px_rgba(255,61,139,0.25)]">
          <defs>
            <linearGradient id="hero-pig-body" x1="0.15" y1="0.05" x2="0.85" y2="0.95">
              <stop offset="0" stopColor="#ff9f43" />
              <stop offset="1" stopColor="#ff3d8b" />
            </linearGradient>
            <linearGradient id="hero-coin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffe29a" />
              <stop offset="1" stopColor="#f5a524" />
            </linearGradient>
          </defs>

          {SPARKLES.map((s, i) => (
            <Sparkle key={i} {...s} />
          ))}

          <g transform="translate(0 -4)">
            {/* coins (behind everything else so they sink into the slot) */}
            {COINS.map((c) => (
              <g key={c.x} className="svg-box animate-coinDrop" style={{ animationDelay: c.delay }}>
                <circle cx={c.x} cy={10} r={3.6} fill="url(#hero-coin)" stroke="#c97a10" strokeWidth=".7" />
                <circle cx={c.x} cy={10} r={2.2} fill="none" stroke="#c97a10" strokeWidth=".5" opacity=".7" />
              </g>
            ))}

            {/* tail */}
            <path d="M9.6 38.2c-3.4-.7-4.9 2.7-2.4 3.8 2.2.9 3.2-1.9 1-2.6" fill="none" stroke="#ff3d8b" strokeWidth="1.9" strokeLinecap="round" />
            {/* legs */}
            <rect x="14.5" y="47" width="7" height="10" rx="3" fill="#e8307a" />
            <rect x="36.5" y="47" width="7" height="10" rx="3" fill="#e8307a" />
            {/* controller coming out of the coin slot */}
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
            {/* body */}
            <ellipse cx="30" cy="39" rx="21" ry="16" fill="url(#hero-pig-body)" />
            <ellipse cx="23" cy="32.5" rx="8.5" ry="3.6" fill="#fff" opacity=".22" />
            {/* ear */}
            <path d="M38.2 27.2L44.6 17.4Q47.6 23.4 46 29.6Z" fill="#ff8a4c" />
            <path d="M40.6 26.6L44.2 21Q45.6 24.6 44.8 28Z" fill="#ffc9a3" />
            {/* snout */}
            <ellipse cx="50.5" cy="41" rx="6.5" ry="5.5" fill="#ff7aa8" />
            <ellipse cx="48.4" cy="41" rx="1.15" ry="1.7" fill="#7a1740" />
            <ellipse cx="52.6" cy="41" rx="1.15" ry="1.7" fill="#7a1740" />
            {/* face */}
            <circle cx="42" cy="34" r="2" fill="#1a0d14" />
            <circle cx="42.7" cy="33.3" r=".65" fill="#fff" />
            <ellipse cx="43" cy="40.2" rx="2.4" ry="1.3" fill="#ff3d8b" opacity=".55" />
            {/* coin slot */}
            <rect x="21.5" y="23" width="14" height="3.4" rx="1.7" fill="#1a0d14" />
          </g>
        </svg>
      </div>

      {/* ground shadow */}
      <div className="mx-auto -mt-2 h-4 w-1/2 animate-shadowPulse rounded-[50%] bg-black/60 blur-md" />
    </div>
  );
}
