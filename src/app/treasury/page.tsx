import type { Metadata } from "next";
import Link from "next/link";
import BigStats from "@/components/BigStats";
import { DashboardProvider } from "@/components/DashboardContext";
import PigBank from "@/components/PigBank";
import SectionHeading from "@/components/SectionHeading";
import { TREASURY_LIVE, TREASURY_WALLET, points, site } from "@/config";
import { fmtDateTime, fmtNum, fmtUsd, shortAddr } from "@/lib/format";
import { getDashboard, getLedger } from "@/lib/solana";

export const metadata: Metadata = { title: `Pig Bank — ${site.name}` };
export const revalidate = 30;

export default async function TreasuryPage() {
  const [dashboard, ledger] = await Promise.all([getDashboard().catch(() => null), getLedger().catch(() => null)]);
  const entries = (ledger?.entries ?? []).slice(0, 8);
  const demo = ledger?.demo ?? true;

  return (
    <DashboardProvider initial={dashboard}>
      <div className="section pt-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="The Pig Bank"
              title="Every trade feeds the pig"
              sub={`Creator fees from every $${site.ticker} trade land in one public wallet. When the pig holds ${fmtUsd(points.gamePriceUsd, 0)}, that's another GTA 6 for a holder. Read straight from Solana, no trust me bro.`}
            />
            <div className="flex flex-wrap items-center gap-3">
              {TREASURY_LIVE && (
                <a className="btn-ghost font-mono text-xs" href={site.explorerAccount(TREASURY_WALLET)} target="_blank" rel="noreferrer">
                  Wallet {shortAddr(TREASURY_WALLET, 6)} ↗
                </a>
              )}
              <Link href="/ledger" className="btn-ghost text-xs">
                All receipts →
              </Link>
            </div>
          </div>
          <PigBank className="mx-auto w-full max-w-[520px]" />
        </div>

        <div className="mt-16">
          <BigStats />
        </div>

        <div className="mt-16">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Latest feedings</h2>
            <Link href="/ledger" className="text-xs font-semibold text-muted transition hover:text-fg">
              Full receipts →
            </Link>
          </div>
          {entries.length === 0 ? (
            <div className="card p-10 text-center text-sm text-muted">The pig is hungry. No transactions yet.</div>
          ) : (
            <ul className="card divide-y-2 divide-line/[0.05] overflow-hidden">
              {entries.map((e) => {
                const fed = e.direction === "in";
                return (
                  <li key={e.signature} className="flex items-center gap-3 px-5 py-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-line/10 bg-bg text-lg" aria-hidden>
                      {fed ? "🪙" : "🎮"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{fed ? "Pig fed" : "GTA 6 copy bought"}</p>
                      <p className="font-mono text-[11px] text-muted">{fmtDateTime(e.time)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-sm font-semibold ${fed ? "text-good" : "text-accent"}`}>
                        {fed ? "+" : "−"}
                        {fmtNum(e.sol, 3)} SOL
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
              })}
            </ul>
          )}
        </div>
      </div>
    </DashboardProvider>
  );
}
