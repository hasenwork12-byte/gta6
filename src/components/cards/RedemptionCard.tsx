"use client";

import { useState } from "react";
import { platformLabel, points, site } from "@/config";
import { fmtDateTime, fmtNum, shortAddr, timeAgo } from "@/lib/format";
import type { PublicRedemption } from "@/lib/types";
import StatusPill from "./StatusPill";

/** Redemption card that expands into a receipt. */
export default function RedemptionCard({ r, now, paidSol }: { r: PublicRedemption; now: number; paidSol?: number }) {
  const [open, setOpen] = useState(false);
  const status = r.status === "fulfilled" ? "Delivered" : r.status === "pending" ? "Pending" : "Rejected";

  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-medium">GTA 6 · {r.platform === "ps5" ? "PS5" : "Xbox"}</p>
          <p className="mt-1 truncate font-mono text-xs text-muted">
            → {shortAddr(r.wallet, 5)} · {timeAgo(r.createdAt, now)}
          </p>
        </div>
        <StatusPill tone={r.status === "fulfilled" ? "good" : r.status === "pending" ? "warn" : "muted"}>{status}</StatusPill>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-line/[0.07] px-3 py-2 text-xs text-muted transition hover:border-line/20 hover:text-fg"
      >
        Receipt
        <span className={`transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <dl className="mt-3 space-y-2 font-mono text-xs">
          <Row k="Points spent" v={fmtNum(points.redeemCost)} />
          <Row k="Paid by treasury" v={paidSol ? `${fmtNum(paidSol, 4)} SOL` : "—"} />
          <Row k="Platform" v={platformLabel(r.platform)} />
          <Row k="Requested" v={fmtDateTime(r.createdAt / 1000)} />
          <Row k="Status" v={status} />
          <div className="pt-1">
            {r.tx ? (
              <a className="link" href={site.explorerTx(r.tx)} target="_blank" rel="noreferrer">
                View on Solscan ↗
              </a>
            ) : (
              <span className="text-muted">{r.demo ? "Demo · no on-chain receipt" : "Receipt added when delivered"}</span>
            )}
          </div>
        </dl>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
