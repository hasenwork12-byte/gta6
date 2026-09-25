import { site } from "@/config";
import { fmtDateTime, fmtNum, fmtUsd, shortAddr } from "@/lib/format";
import type { LedgerEntry } from "@/lib/types";
import StatusPill from "./StatusPill";

/** Detailed treasury transaction card. */
export default function ActivityCard({ e, demo, solUsd }: { e: LedgerEntry; demo: boolean; solUsd: number }) {
  const incoming = e.direction === "in";
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`font-mono text-2xl ${incoming ? "text-good" : "text-accent"}`}>
            {incoming ? "+" : "−"}
            {fmtNum(e.sol, 4)}
            <span className="ml-1 text-sm text-muted">SOL</span>
          </p>
          {solUsd > 0 && <p className="mt-0.5 font-mono text-xs text-muted">≈ {fmtUsd(e.sol * solUsd)}</p>}
        </div>
        <StatusPill tone="good">Confirmed</StatusPill>
      </div>
      <dl className="mt-5 space-y-2 font-mono text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Type</dt>
          <dd>{e.label}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{incoming ? "From" : "To"}</dt>
          <dd>{e.counterparty ? shortAddr(e.counterparty, 5) : "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Time</dt>
          <dd>{fmtDateTime(e.time)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Tx</dt>
          <dd>{demo ? "demo" : shortAddr(e.signature, 6)}</dd>
        </div>
      </dl>
      <div className="mt-4 border-t border-line/[0.07] pt-3 text-xs">
        {demo ? (
          <span className="text-muted">Demo · no on-chain transaction</span>
        ) : (
          <a className="link" href={site.explorerTx(e.signature)} target="_blank" rel="noreferrer">
            View on Solscan ↗
          </a>
        )}
      </div>
    </div>
  );
}
