/**
 * A quiet ticker under the hero. One line, the rules, no carnival tape.
 */
const WORDS = ["Hold $PIG", "Earn XP", "Claim GTA 6", "80% games", "20% burn", "00:00 UTC", "100 XP", "Paid in games"];

function Strip({ reverse = false, tone }: { reverse?: boolean; tone: string }) {
  const run = [...WORDS, ...WORDS];
  return (
    <div className={`flex overflow-hidden border-y border-white/10 py-3 ${tone}`}>
      <div
        className="flex shrink-0 animate-marquee items-center gap-8 pr-8 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] sm:text-xs"
        style={{ ["--marquee-duration" as string]: "52s", animationDirection: reverse ? "reverse" : "normal" }}
      >
        {[...run, ...run].map((w, i) => (
          <span key={i} className="flex items-center gap-8 whitespace-nowrap">
            {w}
            <span className="h-1 w-1 rounded-full bg-current opacity-60" />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SloganTape() {
  return (
    <div className="relative z-10 overflow-hidden" aria-hidden>
      <Strip tone="bg-white/[0.03] text-muted" />
    </div>
  );
}
