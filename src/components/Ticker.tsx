import type { CSSProperties, ReactNode } from "react";

/** Infinite horizontal marquee. Content is rendered twice for a seamless loop. */
export default function Ticker({ children, duration = 40 }: { children: ReactNode; duration?: number }) {
  return (
    <div className="group mask-fade-x min-w-0 flex-1 overflow-hidden">
      <div
        className="flex w-max animate-marquee group-hover:[animation-play-state:paused]"
        style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
      >
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center" aria-hidden={k === 1 || undefined}>
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
