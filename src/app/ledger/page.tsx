import type { Metadata } from "next";
import { TREASURY_WALLET, site } from "@/config";
import { getLedger } from "@/lib/solana";
import { listRedemptions } from "@/lib/points";
import { fmtDateTime, fmtNum, shortAddr } from "@/lib/format";
import DemoBadge, { LiveBadge } from "@/components/DemoBadge";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = { title: `Receipts — ${site.name}` };
export const revalidate = 45;

export default async function LedgerPage() {
  const [ledger, redemptions] = await Promise.all([getLedger().catch(() => null), listRedemptions().catch(() => [])]);
  const delivered = redemptions.filter((r) => r.status === "fulfilled").length;

  const totalIn = ledger?.entries.filter((e) => e.direction === "in").reduce((a, e) => a + e.sol, 0) ?? 0;
  const totalOut = ledger?.entries.filter((e) => e.direction === "out").reduce((a, e) => a + e.sol, 0) ?? 0;

  return (
    <div className="section pt-14">
      <SectionHeading
        eyebrow="Receipts"
        title="Every SOL in and out of the pig"
        sub="Every SOL that enters or leaves the Pig Bank, each linked to its transaction on Solscan. Don't trust, verify."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {ledger?.demo ? <DemoBadge /> : ledger ? <LiveBadge /> : null}
        {TREASURY_WALLET && !ledger?.demo && (
          <a className="btn-ghost !py-1.5 font-mono text-xs" href={site.explorerAccount(TREASURY_WALLET)} target="_blank" rel="noreferrer">
            {shortAddr(TREASURY_WALLET, 6)} ↗
          </a>
        )}
        {ledger?.partial && (
          <span className="text-xs text-muted">Showing the most recent {ledger.entries.length} transactions.</span>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Summary label="Pig fed (fees)" value={`+${fmtNum(totalIn, 3)} SOL`} tone="text-good" />
        <Summary label="Spent on games" value={`−${fmtNum(totalOut, 3)} SOL`} tone="text-accent" />
        <Summary label="Games delivered" value={String(delivered)} />
      </div>

      {!ledger ? (
        <div className="card p-10 text-center text-sm text-muted">Couldn&apos;t reach the Solana RPC. Refresh in a moment.</div>
      ) : ledger.entries.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">No transactions yet.</div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-line/[0.07] text-left">
                {["Time", "Type", "Amount", "Counterparty", "Transaction"].map((h) => (
                  <th key={h} className="label px-5 py-3.5 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/[0.05]">
              {ledger.entries.map((e) => (
                <tr key={e.signature} className="hover:bg-line/[0.02]">
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted">{fmtDateTime(e.time)}</td>
                  <td className="px-5 py-3">{e.label}</td>
                  <td className={`whitespace-nowrap px-5 py-3 font-mono ${e.direction === "in" ? "text-good" : "text-accent"}`}>
                    {e.direction === "in" ? "+" : "−"}
                    {fmtNum(e.sol, 4)} SOL
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">{e.counterparty ? shortAddr(e.counterparty, 5) : "—"}</td>
                  <td className="px-5 py-3">
                    <TxLink sig={e.signature} demo={ledger.demo} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile list */}
          <ul className="divide-y divide-line/[0.05] md:hidden">
            {ledger.entries.map((e) => (
              <li key={e.signature} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm">{e.label}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted">{fmtDateTime(e.time)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm ${e.direction === "in" ? "text-good" : "text-accent"}`}>
                    {e.direction === "in" ? "+" : "−"}
                    {fmtNum(e.sol, 3)}
                  </p>
                  <TxLink sig={e.signature} demo={ledger.demo} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="label">{label}</p>
      <p className={`mt-3 font-display text-xl font-extrabold sm:text-3xl ${tone}`}>{value}</p>
    </div>
  );
}

function TxLink({ sig, demo }: { sig: string; demo: boolean }) {
  if (demo) return <span className="font-mono text-xs text-muted">demo · no tx</span>;
  return (
    <a className="link font-mono text-xs" href={site.explorerTx(sig)} target="_blank" rel="noreferrer">
      {shortAddr(sig, 5)} ↗
    </a>
  );
}
