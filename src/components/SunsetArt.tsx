// Original hero illustration: striped sun, retro perspective grid, a generic
// city skyline and two palms. Pure SVG, no external assets.

function Palm({ x, y, h, lean, scale = 1 }: { x: number; y: number; h: number; lean: number; scale?: number }) {
  const topX = x + lean;
  const topY = y - h;
  const fronds = [-168, -140, -112, -70, -38, -8, 18];
  return (
    <g fill="url(#palm)" stroke="url(#palm)">
      <path
        d={`M${x} ${y} C ${x + lean * 0.1} ${y - h * 0.4}, ${x + lean * 0.6} ${y - h * 0.8}, ${topX} ${topY}`}
        strokeWidth={7 * scale}
        fill="none"
        strokeLinecap="round"
      />
      {fronds.map((a) => (
        <path
          key={a}
          transform={`translate(${topX} ${topY}) rotate(${a}) scale(${scale})`}
          d="M0 0 Q 26 -18 62 -2 Q 48 -4 40 2 Q 30 -4 22 4 Q 12 -2 0 0 Z"
          strokeWidth="0"
        />
      ))}
    </g>
  );
}

export default function SunsetArt({ className = "" }: { className?: string }) {
  const horizon = 300;
  // Deterministic skyline
  const buildings = Array.from({ length: 26 }, (_, i) => {
    const w = 18 + ((i * 37) % 22);
    const h = 24 + ((i * 53) % 70) + (i % 7 === 3 ? 50 : 0);
    return { w, h };
  });
  let bx = 0;

  return (
    <svg viewBox="0 0 800 440" className={className} aria-hidden preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--accent-2))" />
          <stop offset="0.9" stopColor="rgb(var(--accent-1))" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.62" r="0.55">
          <stop offset="0" stopColor="rgb(var(--accent-1))" stopOpacity="0.35" />
          <stop offset="1" stopColor="rgb(var(--accent-1))" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="grid-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--accent-1))" stopOpacity="0.55" />
          <stop offset="1" stopColor="rgb(var(--accent-1))" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="palm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--accent-1))" stopOpacity="0.9" />
          <stop offset="1" stopColor="rgb(var(--accent-2))" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="city" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(38 20 44)" />
          <stop offset="1" stopColor="rgb(var(--bg))" />
        </linearGradient>
        <clipPath id="sun-clip">
          <rect x="0" y="0" width="800" height={horizon} />
        </clipPath>
      </defs>

      <rect width="800" height="440" fill="url(#glow)" />

      {/* Sun with horizontal cut stripes */}
      <g clipPath="url(#sun-clip)">
        <circle cx="400" cy={horizon - 10} r="150" fill="url(#sun)" />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="240" y={horizon - 90 + i * 12} width="320" height={2 + i * 0.9} fill="rgb(var(--bg))" />
        ))}
      </g>

      {/* Skyline */}
      <g fill="url(#city)">
        {buildings.map((b, i) => {
          const x = bx;
          bx += b.w + 2;
          return <rect key={i} x={x} y={horizon - b.h} width={b.w} height={b.h} />;
        })}
      </g>

      {/* Ground + perspective grid */}
      <rect x="0" y={horizon} width="800" height={440 - horizon} fill="rgb(var(--bg))" />
      <g stroke="url(#grid-fade)" strokeWidth="1">
        {Array.from({ length: 9 }, (_, i) => {
          const y = horizon + Math.pow(i + 1, 1.8) * 2.2;
          return <line key={`h${i}`} x1="0" x2="800" y1={y} y2={y} />;
        })}
        {Array.from({ length: 21 }, (_, i) => {
          const x = (i - 10) * 90;
          return <line key={`v${i}`} x1={400} y1={horizon} x2={400 + x * 2.2} y2={440} />;
        })}
      </g>
      <line x1="0" x2="800" y1={horizon} y2={horizon} stroke="rgb(var(--accent-2))" strokeOpacity="0.7" />

      <Palm x={130} y={horizon + 6} h={200} lean={40} />
      <Palm x={690} y={horizon + 6} h={170} lean={-30} scale={0.85} />
      <Palm x={735} y={horizon + 6} h={120} lean={14} scale={0.65} />
    </svg>
  );
}
