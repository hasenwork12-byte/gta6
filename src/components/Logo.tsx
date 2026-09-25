import { site } from "@/config";

/** Original mark: striped sunset sun with a single leaning palm. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--accent-2))" />
          <stop offset="1" stopColor="rgb(var(--accent-1))" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="34" r="20" fill="url(#logo-sun)" />
      <g fill="rgb(var(--bg))">
        <rect x="10" y="38" width="44" height="2.5" />
        <rect x="10" y="43" width="44" height="3" />
        <rect x="10" y="48.5" width="44" height="3.5" />
      </g>
      <path d="M40 54 C40 41 38 30 34 22" stroke="rgb(var(--bg))" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path
        d="M34 22 c-6 -3 -12 -1 -15 3 c5 -1 10 -1 15 -3z M34 22 c3 -6 9 -8 14 -6 c-5 1 -10 3 -14 6z M34 22 c-2 -5 -7 -8 -12 -8 c4 2 8 5 12 8z M34 22 c6 -1 11 2 13 7 c-4 -3 -9 -5 -13 -7z"
        fill="rgb(var(--bg))"
      />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">
        {site.name}
        <span className="ml-1.5 font-mono text-xs text-muted">${site.ticker}</span>
      </span>
    </span>
  );
}
