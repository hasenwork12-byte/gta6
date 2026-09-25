"use client";

import Link from "next/link";
import { Children, useCallback, useEffect, useRef, useState } from "react";
import DemoBadge from "./DemoBadge";

/**
 * Horizontal, scroll-snapping carousel with "1 / 5" pagination.
 * Pages are derived from the scroll width, so it adapts to any screen size.
 */
export default function Carousel({
  title,
  href,
  demo = false,
  itemClassName = "w-[86%] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]",
  children,
}: {
  title: string;
  href?: string;
  demo?: boolean;
  itemClassName?: string;
  children: React.ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const total = Math.max(1, Math.ceil((el.scrollWidth - 4) / w));
    const max = el.scrollWidth - w;
    const current = el.scrollLeft >= max - 4 ? total : Math.min(total, Math.round(el.scrollLeft / w) + 1);
    setPages(total);
    setPage(current);
  }, []);

  useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return;
    // Watch the track and every card: fonts or content settling can change scrollWidth.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    window.addEventListener("load", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("load", measure);
    };
  }, [measure]);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  const items = Children.toArray(children);

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4 sm:items-center">
        <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {demo && <DemoBadge />}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {href && (
            <Link href={href} className="hidden text-xs text-muted transition hover:text-fg sm:inline">
              View all →
            </Link>
          )}
          <span className="whitespace-nowrap font-mono text-xs tabular text-muted" aria-live="polite">
            {page} / {pages}
          </span>
          <div className="flex gap-1.5">
            {([-1, 1] as const).map((d) => (
              <button
                key={d}
                onClick={() => go(d)}
                disabled={d === -1 ? page <= 1 : page >= pages}
                aria-label={d === -1 ? `Previous ${title}` : `Next ${title}`}
                className="grid h-8 w-8 place-items-center rounded-full border border-line/[0.12] text-sm text-fg transition hover:border-line/30 hover:bg-line/[0.05] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
              >
                {d === -1 ? "←" : "→"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">Nothing here yet.</div>
      ) : (
        <div ref={track} onScroll={measure} className="no-scrollbar -mx-1 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto scroll-smooth px-1 pb-2 pt-1">
          {items.map((child, i) => (
            <div key={i} className={`shrink-0 snap-start ${itemClassName}`}>
              {child}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
