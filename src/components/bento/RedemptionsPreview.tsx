import type { CSSProperties } from "react";
import { shortAddr, timeAgo } from "@/lib/format";
import type { PublicRedemption } from "@/lib/types";
import BentoCard from "./BentoCard";

const shortPlatform = (p: string) => (p === "ps5" ? "PS5" : p === "xbox" ? "Xbox" : p);

/** Auto-scrolling list of recent redemptions (pauses on hover). */
export default function RedemptionsPreview({ rows, demo, now }: { rows: PublicRedemption[]; demo: boolean; now: number }) {
  const list = rows.slice(0, 12);
  const Row = ({ r }: { r: PublicRedemption }) => (
    <li className="flex items-center justify-between gap-3 border-b border-line/[0.06] py-2.5 font-mono text-xs">
      <span className="flex min-w-0 items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.status === "fulfilled" ? "bg-good" : "bg-amber-300"}`} />
        <span className="truncate">
          {r.kind === "team" ? (
            <>
              Donation <span className="text-muted">→</span> team
            </>
          ) : r.kind === "gift" ? (
            <>
              Gift <span className="text-muted">→</span> {r.recipient ? shortAddr(r.recipient) : "—"}
            </>
          ) : (
            <>
              {shortPlatform(r.platform)} copy <span className="text-muted">→</span> {shortAddr(r.wallet)}
            </>
          )}
        </span>
      </span>
      <span className="shrink-0 text-muted">{timeAgo(r.createdAt, now)}</span>
    </li>
  );

  return (
    <BentoCard label="Redemptions" href="/redemptions" demo={demo}>
      {list.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No redemptions yet.</p>
      ) : (
        <div className="group/list mask-fade-y relative h-56 overflow-hidden">
          <div
            className={list.length > 5 ? "animate-marqueeY group-hover/list:[animation-play-state:paused]" : ""}
            style={{ "--marquee-duration": `${list.length * 3}s` } as CSSProperties}
          >
            {(list.length > 5 ? [0, 1] : [0]).map((k) => (
              <ul key={k} aria-hidden={k === 1 || undefined}>
                {list.map((r) => (
                  <Row key={r.id} r={r} />
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}
    </BentoCard>
  );
}
