const tones = {
  good: "border-good/30 bg-good/10 text-good",
  warn: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  muted: "border-line/15 text-muted",
} as const;

/** Status label with a dot, so state is never shown by colour alone. */
export default function StatusPill({ tone, children }: { tone: keyof typeof tones; children: React.ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tones[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
