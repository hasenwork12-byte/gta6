import { platformLabel, site } from "@/config";
import { fmtDate, shortAddr } from "@/lib/format";
import type { PublicRedemption } from "@/lib/types";
import DemoBadge from "./DemoBadge";
import Ticker from "./Ticker";

const statusStyle = {
  pending: "border-amber-400/30 text-amber-300",
  fulfilled: "border-good/30 text-good",
  rejected: "border-line/20 text-muted",
} as const;

export default function RedemptionFeed({ rows, demo }: { rows: PublicRedemption[]; demo: boolean }) {
  const shown = rows.slice(0, 12);
  return (
    <div className="space-y-4">
      {shown.length > 0 && (
        <div className="card py-3">
          <Ticker duration={Math.max(25, shown.length * 5)}>
            {shown.map((r) => (
              <span key={r.id} className="flex items-center gap-2 whitespace-nowrap px-5 font-mono text-xs">
                <span className="text-lg leading-none">🌴</span>
                <span className="text-fg">{shortAddr(r.wallet)}</span>
                <span className="text-muted">redeemed GTA 6 · {platformLabel(r.platform)}</span>
                <span className="text-line/20">•</span>
              </span>
            ))}
          </Ticker>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line/[0.07] px-5 py-4">
          <p className="label">Recent redemptions</p>
          {demo && <DemoBadge />}
        </div>
        {shown.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No redemptions yet.</p>
        ) : (
          <ul className="divide-y divide-line/[0.06]">
            {shown.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
                <div className="flex min-w-0 items-center gap-3 sm:gap-6">
                  <span className="truncate font-mono">{shortAddr(r.wallet, 5)}</span>
                  <span className="hidden text-muted sm:inline">{platformLabel(r.platform)}</span>
                  <span className="hidden text-muted md:inline">{fmtDate(r.createdAt / 1000)}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${statusStyle[r.status]}`}>
                    {r.status === "fulfilled" ? "delivered" : r.status}
                  </span>
                  {r.tx ? (
                    <a className="link text-xs" href={site.explorerTx(r.tx)} target="_blank" rel="noreferrer">
                      View receipt ↗
                    </a>
                  ) : (
                    <span className="hidden text-xs text-muted sm:inline" title={r.demo ? "Demo rows have no on-chain transaction" : "Receipt added when fulfilled"}>
                      {r.demo ? "Receipt · demo" : "Receipt soon"}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
