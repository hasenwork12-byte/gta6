"use client";

import { useState } from "react";
import { platformLabel, points, site } from "@/config";
import { fmtDateTime, fmtNum, shortAddr, timeAgo } from "@/lib/format";
import { redemptionTitle } from "@/lib/redemption-title";
import type { PublicRedemption } from "@/lib/types";
import StatusPill from "./StatusPill";


const statusInfo = (s: PublicRedemption["status"]) =>
  s === "fulfilled"
    ? { label: "Delivered", tone: "good" as const }
    : s === "pending"
      ? { label: "Pending", tone: "warn" as const }
      : s === "unclaimed"
        ? { label: "Unclaimed", tone: "warn" as const }
        : { label: "Rejected", tone: "muted" as const };

/** Redemption card that expands into a receipt. */
export default function RedemptionCard({ r, now, paidSol }: { r: PublicRedemption; now: number; paidSol?: number }) {
  const [open, setOpen] = useState(false);
  const status = statusInfo(r.status);

  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-medium">{redemptionTitle(r)}</p>
          <p className="mt-1 truncate font-mono text-xs text-muted">
            {r.kind === "self" && <>→ {shortAddr(r.wallet, 5)}</>}
            {r.kind === "gift" && (
              <>
                {shortAddr(r.wallet, 4)} → {r.recipient ? shortAddr(r.recipient, 4) : "—"}
              </>
            )}
            {r.kind === "team" && <>from {shortAddr(r.wallet, 5)}</>} · {timeAgo(r.createdAt, now)}
          </p>
        </div>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
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
          <Row k="Type" v={r.kind === "self" ? "For themselves" : r.kind === "gift" ? "Gift to a wallet" : "Donated to the team"} />
          <Row k="XP spent" v={`${fmtNum(points.redeemCost)} by ${shortAddr(r.wallet, 4)}`} />
          {r.kind === "gift" && <Row k="Recipient" v={r.recipient ? shortAddr(r.recipient, 5) : "—"} />}
          <Row k="Paid by the Pig Bank" v={paidSol ? `${fmtNum(paidSol, 4)} SOL` : "—"} />
          <Row k="Platform" v={r.platform ? platformLabel(r.platform) : r.kind === "team" ? "Chosen by team" : "Chosen when claimed"} />
          <Row k="Requested" v={fmtDateTime(r.createdAt / 1000)} />
          <Row k="Status" v={status.label} />
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
