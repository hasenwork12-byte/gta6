import { ArrowLeftRight, ArrowRight, ChevronDown, Coins, Flame, Gamepad2 } from "lucide-react";
import { TOKEN_MINT, site } from "@/config";
import { fmtCompact, fmtDateTime, fmtNum, fmtUsd } from "@/lib/format";
import type { LedgerEntry } from "@/lib/types";
import { LogoMark } from "./Logo";

/** A burn this soon after a buyback is that buyback's burn (same rule as lib/buyback). */
const PAIR_SEC = 3 * 3600;

type Row = { type: "tx"; e: LedgerEntry } | { type: "burn"; buy: LedgerEntry; burn: LedgerEntry | null };

/** Buybacks and their burns become one row; everything else stays one row per transaction. Newest first. */
function group(entries: LedgerEntry[]): Row[] {
  const sorted = [...entries].sort((a, b) => a.time - b.time);
  const used = new Set<string>();
  const rows: Row[] = [];
  sorted.forEach((e, i) => {
    if (used.has(e.signature)) return;
    if (e.kind === "buyback") {
      const nextBuy = sorted.slice(i + 1).find((x) => x.kind === "buyback");
      const burn = sorted.find(
        (b) => b.kind === "burn" && !used.has(b.signature) && b.time >= e.time && b.time - e.time <= PAIR_SEC && (!nextBuy || b.time < nextBuy.time),
      );
      if (burn) used.add(burn.signature);
      rows.push({ type: "burn", buy: e, burn: burn ?? null });
      return;
    }
    rows.push({ type: "tx", e });
  });
  return rows.reverse();
}

const ago = (unix: number) => {
  const s = Math.max(0, Math.floor(Date.now() / 1000) - unix);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right font-mono text-fg">{children}</dd>
    </div>
  );
}

function TxLink({ sig, demo }: { sig: string; demo: boolean }) {
  if (demo) return <span className="text-muted">demo</span>;
  return (
    <a className="link" href={site.explorerTx(sig)} target="_blank" rel="noreferrer" title={sig}>
      {sig}
    </a>
  );
}

function BurnRow({ buy, burn, solUsd, demo }: { buy: LedgerEntry; burn: LedgerEntry | null; solUsd: number; demo: boolean }) {
  const bought = buy.tokens ?? 0;
  const burned = burn?.tokens ?? 0;
  return (
    <li>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">{fmtNum(buy.sol, 4)} SOL</p>
            <p className="text-sm text-muted">
              {burn ? "bought and burned" : "bought back"}{" "}
              <span className="font-semibold text-fg">
                {fmtCompact(burn ? burned : bought)} ${site.ticker}
              </span>
            </p>
          </div>
          {/* SOL -> $PIG -> burn */}
          <div className="hidden items-center gap-2 sm:flex" aria-hidden>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-line/10 bg-bg/60 font-mono text-[10px] font-bold">SOL</span>
            <ArrowLeftRight className="h-4 w-4 text-muted" />
            <LogoMark className="h-9 w-9" />
            {burn && (
              <>
                <ArrowRight className="h-4 w-4 text-muted" />
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent2 text-[#1d0612]">
                  <Flame className="h-5 w-5" />
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 pl-2">
            <span className="chip text-muted">{burn ? "Burned" : "Bought"}</span>
            <span className="font-mono text-[11px] text-muted">{ago((burn ?? buy).time)}</span>
            <ChevronDown className="h-4 w-4 text-muted transition group-open:rotate-180" aria-hidden />
          </div>
        </summary>
        <div className="border-t-2 border-line/[0.05] px-5 pb-5">
          <dl className="divide-y divide-line/[0.06] text-sm">
            <Detail label="SOL spent">{fmtNum(buy.sol, 4)} SOL</Detail>
            {solUsd > 0 && <Detail label="Value">{fmtUsd(buy.sol * solUsd)}</Detail>}
            <Detail label={`$${site.ticker} bought`}>{fmtCompact(bought)}</Detail>
            {burn && <Detail label={`$${site.ticker} burned`}>{fmtCompact(burned)}</Detail>}
            {TOKEN_MINT && <Detail label="Token">{TOKEN_MINT}</Detail>}
            <Detail label="Swap">
              <TxLink sig={buy.signature} demo={demo} />
            </Detail>
            {burn && (
              <Detail label="Burn">
                <TxLink sig={burn.signature} demo={demo} />
              </Detail>
            )}
            <Detail label="Bought">{fmtDateTime(buy.time)}</Detail>
            {burn && <Detail label="Burned">{fmtDateTime(burn.time)}</Detail>}
          </dl>
          {burn && !demo && (
            <a className="btn-ghost mt-4 w-full justify-center" href={site.explorerTx(burn.signature)} target="_blank" rel="noreferrer">
              View burn on Solscan ↗
            </a>
          )}
        </div>
      </details>
    </li>
  );
}

function PlainRow({ e, demo }: { e: LedgerEntry; demo: boolean }) {
  const fed = e.direction === "in";
  const kind = e.kind ?? (fed ? "fee" : "transfer");
  const isBurn = kind === "burn";
  const Icon = fed ? Coins : isBurn ? Flame : Gamepad2;
  const title = kind === "fee" ? "Fee received" : kind === "game" ? "GTA 6 copy bought" : isBurn ? `Burned $${site.ticker}` : e.label;
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 ${fed || isBurn ? "border-gold/25 bg-gold/10 text-gold" : "border-accent/25 bg-accent/10 text-accent"}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="font-mono text-[11px] text-muted">{fmtDateTime(e.time)}</p>
      </div>
      <div className="text-right">
        <p className={`font-mono text-sm font-semibold ${fed ? "text-good" : isBurn ? "text-gold" : "text-accent"}`}>
          {isBurn ? `${fmtCompact(e.tokens ?? 0)} $${site.ticker}` : `${fed ? "+" : "−"}${fmtNum(e.sol, 3)} SOL`}
        </p>
        {demo ? (
          <span className="font-mono text-[11px] text-muted">demo</span>
        ) : (
          <a className="link font-mono text-[11px]" href={site.explorerTx(e.signature)} target="_blank" rel="noreferrer">
            Solscan ↗
          </a>
        )}
      </div>
    </li>
  );
}

/** Latest Pig Bank transactions; each buyback and its burn show as one expandable card. */
export default function TxList({
  entries,
  solUsd,
  demo,
  limit = 8,
  burnsOnly = false,
}: {
  entries: LedgerEntry[];
  solUsd: number;
  demo: boolean;
  limit?: number;
  /** Only buyback-and-burn cards (no fees, transfers or game purchases). */
  burnsOnly?: boolean;
}) {
  const rows = group(entries)
    .filter((r) => !burnsOnly || r.type === "burn")
    .slice(0, limit);
  if (rows.length === 0)
    return <div className="card p-10 text-center text-sm text-muted">{burnsOnly ? `No burns yet.` : "No transactions yet."}</div>;
  return (
    <ul className="card divide-y-2 divide-line/[0.05] overflow-hidden">
      {rows.map((r) =>
        r.type === "burn" ? (
          <BurnRow key={r.buy.signature} buy={r.buy} burn={r.burn} solUsd={solUsd} demo={demo} />
        ) : (
          <PlainRow key={r.e.signature} e={r.e} demo={demo} />
        ),
      )}
    </ul>
  );
}
