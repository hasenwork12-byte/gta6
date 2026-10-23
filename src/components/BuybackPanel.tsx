"use client";

import { Flame, RefreshCw } from "lucide-react";
import { TREASURY_LIVE, site } from "@/config";
import { fmtCompact, fmtDateTime, fmtNum, fmtUsd } from "@/lib/format";
import BuybackChart from "./BuybackChart";
import { useDashboard } from "./DashboardContext";
import DemoBadge from "./DemoBadge";

/**
 * The buyback side of the Pig Bank: how fees are split, what's been bought
 * back (and burned), what's owed to the next buyback, and a running-total chart.
 * `full` adds the list of individual buybacks (Pig Bank page).
 */
export default function BuybackPanel({ full = false }: { full?: boolean }) {
  const { data } = useDashboard();
  const s = data?.snapshot;
  if (!s) return null;
  const b = s.buyback;
  const gamesPct = Math.round((1 - b.share) * 100);
  const buyPct = 100 - gamesPct;
  const verb = b.burn ? "buyback & burn" : "buyback";
  const pctOfSupply = b.supply ? ((b.burn ? b.tokensBurned : b.tokensBought) / b.supply) * 100 : null;

  const tiles = [
    { label: "SOL spent", value: `${fmtNum(b.solSpent, 3)}`, unit: "SOL", sub: `≈ ${fmtUsd(b.solSpent * s.solUsd)}` },
    { label: `$${site.ticker} bought back`, value: fmtCompact(b.tokensBought), unit: "", sub: `${fmtNum(b.history.length)} buybacks` },
    b.burn
      ? { label: "Burned forever", value: fmtCompact(b.tokensBurned), unit: "", sub: pctOfSupply !== null ? `${fmtNum(pctOfSupply, pctOfSupply < 1 ? 3 : 2)}% of supply` : "sent to the void" }
      : { label: "Held by the pig", value: fmtCompact(b.tokensBought), unit: "", sub: pctOfSupply !== null ? `${fmtNum(pctOfSupply, pctOfSupply < 1 ? 3 : 2)}% of supply` : "never sold" },
    { label: "Next buyback", value: fmtNum(b.owedSol, 3), unit: "SOL", sub: "set aside, not for games" },
  ];

  const recent = [...b.history].reverse().slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Fee split */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="label">Where every fee goes</p>
          {s.demo && <DemoBadge className="!py-0.5" />}
        </div>
        <div className="mt-3 flex h-11 gap-[2px] overflow-hidden rounded-xl sm:h-12">
          <div className="flex items-center rounded-l-xl bg-gradient-to-r from-accent to-accent2 px-3 text-[#1d0612]" style={{ width: `${gamesPct}%` }}>
            <span className="truncate font-display text-sm font-extrabold sm:text-base">{gamesPct}% · GTA 6 for holders</span>
          </div>
          <div className="flex items-center justify-center rounded-r-xl bg-gold px-2 text-[#2a1800]" style={{ width: `${buyPct}%` }}>
            <span className="truncate font-display text-sm font-extrabold sm:text-base">{buyPct}%</span>
          </div>
        </div>
        <p className="mt-2 text-right font-mono text-[11px] text-gold">
          {buyPct}% → {verb} ${site.ticker}
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-4 sm:p-5">
            <p className="label">{t.label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t.value}
              {t.unit && <span className="ml-1 font-mono text-xs font-semibold text-muted">{t.unit}</span>}
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted">{t.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-4 sm:p-6">
        {b.history.length === 0 ? (
          <div className="grid place-items-center gap-2 py-10 text-center">
            <RefreshCw className="h-7 w-7 text-gold" aria-hidden />
            <p className="font-display text-lg font-extrabold">First buyback loading</p>
            <p className="max-w-sm text-sm text-muted">
              {fmtNum(b.owedSol, 3)} SOL is already set aside. Every buyback shows up here on its own, straight from the chain.
            </p>
          </div>
        ) : (
          <BuybackChart history={b.history} burn={b.burn} />
        )}
        {b.partial && <p className="mt-3 text-xs text-muted">Based on the Pig Bank&apos;s most recent transactions.</p>}
      </div>

      {/* Individual buybacks */}
      {full && recent.length > 0 && (
        <div className="card overflow-hidden">
          <p className="label border-b-2 border-line/[0.06] px-5 py-3.5">Every buyback, newest first</p>
          <ul className="divide-y-2 divide-line/[0.05]">
            {recent.map((h) => (
              <li key={h.signature} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-gold/25 bg-gold/10 text-gold">
                  {b.burn ? <Flame className="h-5 w-5" aria-hidden /> : <RefreshCw className="h-5 w-5" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {fmtCompact(h.tokens)} ${site.ticker} {b.burn ? "bought & burned" : "bought back"}
                  </p>
                  <p className="font-mono text-[11px] text-muted">{fmtDateTime(h.time)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{fmtNum(h.sol, 3)} SOL</p>
                  {s.demo || !TREASURY_LIVE ? (
                    <span className="font-mono text-[11px] text-muted">demo</span>
                  ) : (
                    <a className="link font-mono text-[11px]" href={site.explorerTx(h.signature)} target="_blank" rel="noreferrer">
                      Solscan ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
