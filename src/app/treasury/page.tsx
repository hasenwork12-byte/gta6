import type { Metadata } from "next";
import Link from "next/link";
import BigStats from "@/components/BigStats";
import BuybackPanel from "@/components/BuybackPanel";
import ProtocolAnalytics from "@/components/ProtocolAnalytics";
import { DashboardProvider } from "@/components/DashboardContext";
import PigBank from "@/components/PigBank";
import SectionHeading from "@/components/SectionHeading";
import TxList from "@/components/TxList";
import { TREASURY_LIVE, TREASURY_WALLET, buyback, points, site } from "@/config";
import { fmtUsd, shortAddr } from "@/lib/format";
import { getDashboard, getLedger } from "@/lib/solana";

export const metadata: Metadata = { title: `Pig Bank — ${site.name}` };
export const revalidate = 30;

export default async function TreasuryPage() {
  const [dashboard, ledger] = await Promise.all([getDashboard().catch(() => null), getLedger().catch(() => null)]);
  const demo = ledger?.demo ?? true;

  return (
    <DashboardProvider initial={dashboard}>
      <div className="section pt-12">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="The Pig Bank"
              title="Every trade adds to the Pig Bank"
              sub={`Creator fees from every $${site.ticker} trade land in one public wallet. ${Math.round(buyback.share * 100)}% is set aside to buy $${site.ticker} back${buyback.burn ? " and burn it" : ""}. When the rest holds ${fmtUsd(points.gamePriceUsd, 0)}, that's another GTA 6 for a holder. Read straight from Solana, so you don't have to take our word for it.`}
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

        <div id="buybacks" className="mt-16 scroll-mt-24">
          <SectionHeading
            eyebrow={buyback.burn ? "Buyback & burn" : "Buyback"}
            title={`${Math.round(buyback.share * 100)}% of every fee buys $${site.ticker} back`}
            sub={`The Pig Bank sets aside ${Math.round(buyback.share * 100)}% of every creator fee and uses it to buy $${site.ticker} on the open market${buyback.burn ? ", then burns it so supply only goes down" : ""}. The other ${Math.round((1 - buyback.share) * 100)}% buys games. Each buyback is read from the chain, so you can check every one.`}
          />
          <div className="mb-4">
            <ProtocolAnalytics />
          </div>
          <BuybackPanel full />
        </div>

        <div className="mt-16">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Latest transactions</h2>
            <Link href="/ledger" className="text-xs font-semibold text-muted transition hover:text-fg">
              Full receipts →
            </Link>
          </div>
          <TxList entries={ledger?.entries ?? []} solUsd={dashboard?.snapshot.solUsd ?? 0} demo={demo} />
        </div>
      </div>
    </DashboardProvider>
  );
}
