/**
 * Vice-City-at-dusk art for the hero. Two pieces:
 *  - SunsetScene: hero-wide sky glow and palm silhouettes.
 *  - PigSun: a striped retro sun sinking into a neon grid, placed behind the
 *    Pig Bank so the pig always stands on the horizon, on any screen size.
 * Pure SVG/CSS, decorative only.
 */
function Palm({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 120 260" className={className} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden>
      <g fill="#0b0512">
        <path d="M58 260C60 200 66 150 78 96l6 1C73 151 68 201 68 260Z" />
        <path d="M80 96C64 70 34 62 6 74c26-4 50 4 70 26Z" />
        <path d="M80 96C70 64 46 40 16 36c26 10 46 32 60 62Z" />
        <path d="M80 96C84 62 100 38 124 26c-20 18-32 42-38 72Z" />
        <path d="M56 98C78 76 106 74 124 84c-24-4-46 4-64 20Z" />
        <path d="M80 96C92 84 112 88 120 108c-12-12-26-14-38-8Z" />
        <path d="M80 96C70 92 52 100 44 124c10-14 22-22 38-24Z" />
        <circle cx="80" cy="99" r="5" />
      </g>
    </svg>
  );
}

export default function SunsetScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.07] to-transparent" />
      <Palm className="absolute -left-10 bottom-[8%] hidden h-[340px] opacity-90 lg:block xl:h-[420px]" />
      <Palm className="absolute -right-12 bottom-[6%] hidden h-[300px] opacity-80 lg:block xl:h-[380px]" flip />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-bg" />
    </div>
  );
}

/** Sun + grid floor. Put it inside a `relative` box that also holds the pig. */
export function PigSun() {
  // Sun bands get thicker toward the horizon, like an 80s poster.
  const gaps = [56, 64, 71, 77, 82, 86, 90];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {/* horizon sits at ~70% of the box: right around the pig's feet */}
      <svg viewBox="0 0 200 100" className="absolute bottom-[30%] left-1/2 w-[125%] -translate-x-1/2 opacity-60">
        <defs>
          <linearGradient id="sun-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd36b" />
            <stop offset=".55" stopColor="#ff9f43" />
            <stop offset="1" stopColor="#ff3d8b" />
          </linearGradient>
          <mask id="sun-cuts">
            <rect width="200" height="100" fill="#fff" />
            {gaps.map((y, i) => (
              <rect key={y} x="0" y={y} width="200" height={1.2 + i * 0.7} fill="#000" />
            ))}
          </mask>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#sun-grad)" mask="url(#sun-cuts)" />
      </svg>
      <div className="absolute bottom-[30%] left-1/2 h-px w-[160%] -translate-x-1/2 bg-gradient-to-r from-transparent via-accent2/70 to-transparent" />
      <div className="absolute left-1/2 top-[70%] h-[40%] w-[180%] -translate-x-1/2 overflow-hidden [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]">
        <div className="sunset-grid absolute inset-0" />
      </div>
    </div>
  );
}
