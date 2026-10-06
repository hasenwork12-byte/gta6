/**
 * Pig silhouette that fills from the bottom with the treasury's progress
 * towards the next copy. `pct` is 0 to 100.
 */
export default function PiggyMeter({ pct, className = "h-14 w-14" }: { pct: number; className?: string }) {
  const p = Math.max(0, Math.min(100, pct));
  // Silhouette spans y 19..53 in this viewBox; fill rises from the bottom.
  const top = 53 - (34 * p) / 100;
  const shape = (
    <>
      <ellipse cx="30" cy="35" rx="21" ry="16" />
      <ellipse cx="50.5" cy="37" rx="6.5" ry="5.5" />
      <path d="M38.2 23.2L44.6 13.4Q47.6 19.4 46 25.6Z" />
      <rect x="14.5" y="43" width="7" height="10" rx="3" />
      <rect x="36.5" y="43" width="7" height="10" rx="3" />
    </>
  );
  return (
    <svg viewBox="4 10 56 46" className={className} role="img" aria-label={`Piggy bank ${Math.round(p)}% full`}>
      <defs>
        <clipPath id="piggy-meter-clip">{shape}</clipPath>
        <linearGradient id="piggy-meter-fill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="rgb(var(--accent-1))" />
          <stop offset="1" stopColor="rgb(var(--accent-2))" />
        </linearGradient>
      </defs>
      <g fill="rgb(var(--line) / 0.14)">{shape}</g>
      <g clipPath="url(#piggy-meter-clip)">
        <rect x="0" y={top} width="64" height="64" fill="url(#piggy-meter-fill)" className="transition-all duration-1000" />
      </g>
      <rect x="21.5" y="19" width="14" height="3.4" rx="1.7" fill="rgb(var(--bg))" />
      <circle cx="42" cy="30" r="1.8" fill="rgb(var(--bg))" />
    </svg>
  );
}
