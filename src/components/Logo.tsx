import { site } from "@/config";

/** Piggy bank with a game controller dropping into the coin slot (public/logo.svg). */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.svg" alt="" aria-hidden className={className} width={36} height={36} />;
}

export default function Logo({ showTicker = true }: { showTicker?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">
        {site.name}
        {showTicker && <span className="ml-1.5 font-mono text-xs text-muted">${site.ticker}</span>}
      </span>
    </span>
  );
}
