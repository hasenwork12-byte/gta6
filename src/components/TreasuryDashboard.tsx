"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { points, site } from "@/config";
import { fmtDateTime, fmtNum, fmtUsd, shortAddr } from "@/lib/format";
import type { Dashboard, LedgerEntry } from "@/lib/types";
import DemoBadge, { LiveBadge } from "./DemoBadge";
import RollingNumber from "./RollingNumber";
import Ticker from "./Ticker";

const POLL_MS = 30_000;
const DEMO_TICK_MS = 4_500;

function useDashboard(initial: Dashboard | null) {
  const [data, setData] = useState<Dashboard | null>(initial);
  const [error, setError] = useState(false);
  const demo = data?.snapshot.demo ?? false;

  // Live: poll the API route.
  useEffect(() => {
    if (demo) return;
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/treasury", { cache: "no-store" });
        if (!r.ok) throw new Error();
        const j = (await r.json()) as Dashboard;
        if (alive) {
          setData(j);
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      }
    };
    if (!initial) load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [demo, initial]);

  // Demo: simulate small incoming fees so the rolling numbers can be seen.
  useEffect(() => {
    if (!demo) return;
    const id = setInterval(() => {
      setData((d) => {
        if (!d) return d;
        const fee = +(0.0005 + Math.random() * 0.004).toFixed(4);
        const entry: LedgerEntry = {
          signature: "DEMO" + Math.random().toString(36).slice(2),
          time: Math.floor(Date.now() / 1000),
          direction: "in",
          sol: fee,
          counterparty: null,
          label: "Creator fee",
        };
        return {
          snapshot: {
            ...d.snapshot,
            balanceSol: d.snapshot.balanceSol + fee,
            totalFeesSol: d.snapshot.totalFeesSol + fee,
          },
          recent: [entry, ...d.recent].slice(0, 20),
        };
      });
    }, DEMO_TICK_MS);
    return () => clearInterval(id);
  }, [demo]);

  return { data, error };
}

export default function TreasuryDashboard({ initial }: { initial: Dashboard | null }) {
  const { data, error } = useDashboard(initial);

  if (!data) {
    return (
      <div className="card flex h-64 items-center justify-center text-sm text-muted">
        {error ? "Couldn't reach the Solana RPC — retrying…" : "Loading treasury…"}
      </div>
    );
  }

  const s = data.snapshot;
  const usd = s.balanceSol * s.solUsd;
  const price = points.gamePriceUsd;
  const funded = Math.floor(usd / price);
  const remainder = usd - funded * price;
  const pct = Math.min(100, (remainder / price) * 100);

  return (
    <div className="space-y-4">
      <ActivityTicker entries={data.recent} demo={s.demo} />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Treasury card */}
        <div className="card relative overflow-hidden p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="label">Treasury balance</p>
            {s.demo ? <DemoBadge /> : <LiveBadge />}
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-1">
            <RollingNumber
              value={s.balanceSol}
              format={(n) => fmtNum(n, 3)}
              className="text-5xl font-medium leading-none tracking-tight sm:text-6xl"
            />
            <span className="pb-1 font-mono text-lg text-muted">SOL</span>
          </div>
          <div className="mt-3 font-mono text-muted">
            ≈ <RollingNumber value={usd} format={(n) => fmtUsd(n)} className="text-fg" /> USD
            {s.solUsd > 0 && <span className="ml-2 text-xs">@ {fmtUsd(s.solUsd)}/SOL</span>}
          </div>

          <div className="mt-8">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-muted">
                {funded > 0 ? (
                  <>
                    <span className="text-fg">{funded}</span> {funded === 1 ? "copy" : "copies"} funded · next:
                  </>
                ) : (
                  "Next copy"
                )}
              </span>
              <span className="font-mono">
                <span className="accent-text font-semibold">{fmtUsd(remainder, 0)}</span>
                <span className="text-muted"> / {fmtUsd(price, 0)}</span>
              </span>
            </div>
            <div
              className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-line/[0.07]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={price}
              aria-valuenow={Math.round(remainder)}
              aria-label="Progress to next game purchase"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 shadow-[0_0_20px_rgb(var(--accent-1)/0.6)] transition-[width] duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line/[0.07] pt-5 text-sm">
            <div>
              <p className="label">Total fees collected{s.feesPartial && " (recent txs)"}</p>
              <RollingNumber value={s.totalFeesSol} format={(n) => fmtNum(n, 3) + " SOL"} className="mt-1 text-lg" />
            </div>
            <div className="flex flex-wrap gap-2">
              {!s.demo && (
                <a className="btn-ghost !py-2 text-xs" href={site.explorerAccount(s.treasuryWallet)} target="_blank" rel="noreferrer">
                  Wallet {shortAddr(s.treasuryWallet)} ↗
                </a>
              )}
              <Link href="/treasury" className="btn-ghost !py-2 text-xs">
                Full ledger →
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Games redeemed" value={s.gamesRedeemed} />
          <Stat label="Games delivered" value={s.gamesDelivered} />
          <Stat label="Holders" value={s.holders} />
          <Stat label="Total fees" value={s.totalFeesSol} digits={2} suffix=" SOL" />
          {error && <p className="col-span-2 text-xs text-amber-300">RPC hiccup — showing last known values.</p>}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, digits = 0, suffix = "" }: { label: string; value: number | null; digits?: number; suffix?: string }) {
  return (
    <div className="card flex flex-col justify-between p-4 sm:p-5">
      <p className="label">{label}</p>
      <div className="mt-4 text-2xl sm:text-3xl">
        {value === null ? (
          <span className="font-mono text-muted" title="Needs an RPC that supports getProgramAccounts (e.g. Helius)">—</span>
        ) : (
          <RollingNumber value={value} format={(n) => fmtNum(n, digits) + suffix} />
        )}
      </div>
    </div>
  );
}

function ActivityTicker({ entries, demo }: { entries: LedgerEntry[]; demo: boolean }) {
  if (entries.length === 0) return null;
  return (
    <div className="card flex items-center gap-3 overflow-hidden py-2.5 pl-4">
      <span className="label shrink-0">{demo ? "Demo feed" : "Activity"}</span>
      <Ticker duration={Math.max(30, entries.length * 4)}>
        {entries.map((e) => (
          <span key={e.signature} className="flex items-center gap-2 whitespace-nowrap px-4 font-mono text-xs">
            <span className={e.direction === "in" ? "text-good" : "text-accent"}>
              {e.direction === "in" ? "+" : "−"}
              {fmtNum(e.sol, 3)} SOL
            </span>
            <span className="text-fg/80">{e.label}</span>
            <span className="text-muted">{fmtDateTime(e.time)}</span>
            <span className="text-line/20">•</span>
          </span>
        ))}
      </Ticker>
    </div>
  );
}
