import Link from "next/link";
import { shortAddr, timeAgo } from "@/lib/format";
import { redemptionTitle } from "@/lib/redemption-title";
import type { PublicRedemption } from "@/lib/types";
import DemoBadge from "./DemoBadge";
import StatusPill from "./cards/StatusPill";

const ICON: Record<PublicRedemption["kind"], string> = { self: "🎮", gift: "🎁", team: "🤝" };

/** Compact, game-style feed of the latest claims. */
export default function LootFeed({ rows, demo, now }: { rows: PublicRedemption[]; demo: boolean; now: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b-2 border-line/[0.06] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulseDot rounded-full bg-good" />
          <p className="label">Loot drops</p>
          {demo && <DemoBadge className="!px-2 !py-0.5" />}
        </div>
        <Link href="/redemptions" className="text-xs font-semibold text-muted transition hover:text-fg">
          See all →
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted">No loot dropped yet. Be the first. 👀</p>
      ) : (
        <ul className="divide-y-2 divide-line/[0.05]">
          {rows.map((r) => {
            const done = r.status === "fulfilled";
            return (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-line/10 bg-bg text-lg" aria-hidden>
                  {ICON[r.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{redemptionTitle(r)}</p>
                  <p className="truncate font-mono text-[11px] text-muted">
                    {r.kind === "gift" && r.recipient
                      ? `${shortAddr(r.wallet, 4)} → ${shortAddr(r.recipient, 4)}`
                      : shortAddr(r.wallet, 5)}{" "}
                    · {timeAgo(r.createdAt, now)}
                  </p>
                </div>
                <StatusPill tone={done ? "good" : r.status === "rejected" ? "muted" : "warn"}>
                  {done ? "Looted" : r.status === "unclaimed" ? "Unclaimed" : "In queue"}
                </StatusPill>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
