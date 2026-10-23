/**
 * Two crossing "caution tape" strips that scroll forever. Separators are a
 * tiny pig snout (inline SVG), so no emoji or icon font is needed.
 */
const WORDS = ["Hold $PIG", "Stack XP", "Claim GTA 6", "Feed the pig", "Don't jeet", "Paid in games", "Oink oink"];

function Snout() {
  return (
    <svg viewBox="0 0 20 14" className="h-[0.8em] w-auto shrink-0" aria-hidden>
      <ellipse cx="10" cy="7" rx="9" ry="6.5" fill="currentColor" />
      <ellipse cx="6.8" cy="7" rx="1.6" ry="2.4" fill="rgb(var(--bg))" />
      <ellipse cx="13.2" cy="7" rx="1.6" ry="2.4" fill="rgb(var(--bg))" />
    </svg>
  );
}

function Strip({ reverse = false, tone }: { reverse?: boolean; tone: string }) {
  const run = [...WORDS, ...WORDS];
  return (
    <div className={`flex overflow-hidden border-y-2 border-black/40 py-2.5 sm:py-3 ${tone}`}>
      <div
        className="flex shrink-0 animate-marquee items-center gap-5 pr-5 font-display text-lg font-extrabold uppercase tracking-tight sm:gap-7 sm:pr-7 sm:text-2xl"
        style={{ ["--marquee-duration" as string]: "38s", animationDirection: reverse ? "reverse" : "normal" }}
      >
        {[...run, ...run].map((w, i) => (
          <span key={i} className="flex items-center gap-5 whitespace-nowrap sm:gap-7">
            {w}
            <Snout />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SloganTape() {
  return (
    <div className="relative z-10 -my-2 overflow-hidden py-8 sm:py-10" aria-hidden>
      <div className="relative z-10 -mx-12 -rotate-[2.5deg]">
        <Strip tone="bg-gradient-to-r from-accent to-accent2 text-[#1d0612]" />
      </div>
      <div className="-mx-12 -mt-3 rotate-[1.8deg] sm:-mt-6">
        <Strip reverse tone="bg-gold text-[#2a1800]" />
      </div>
    </div>
  );
}
