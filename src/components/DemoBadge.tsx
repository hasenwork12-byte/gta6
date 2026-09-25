export default function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Placeholder numbers shown until the real token mint and treasury wallet are configured."
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
      Demo data
    </span>
  );
}

export function LiveBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-good ${className}`}>
      <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-good" />
      Live · on-chain
    </span>
  );
}
