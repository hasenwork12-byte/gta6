import type { Metadata } from "next";
import Link from "next/link";
import BigStats from "@/components/BigStats";
import Carousel from "@/components/Carousel";
import { DashboardProvider } from "@/components/DashboardContext";
import SectionHeading from "@/components/SectionHeading";
import TreasuryPreview from "@/components/bento/TreasuryPreview";
import ActivityCard from "@/components/cards/ActivityCard";
import { TREASURY_LIVE, TREASURY_WALLET, site } from "@/config";
import { DEMO_SOL_USD } from "@/lib/demo";
import { shortAddr } from "@/lib/format";
import { getDashboard, getLedger } from "@/lib/solana";

export const metadata: Metadata = { title: `Treasury — ${site.name}` };
export const revalidate = 30;

export default async function TreasuryPage() {
  const [dashboard, ledger] = await Promise.all([getDashboard().catch(() => null), getLedger().catch(() => null)]);
  const entries = ledger?.entries ?? [];
  const demo = ledger?.demo ?? true;
  const refTime = dashboard?.snapshot.updatedAt ?? Math.floor(Date.now() / 1000);
  const fees = entries.filter((e) => e.direction === "in").map((e) => ({ time: e.time, sol: e.sol }));

  return (
    <DashboardProvider initial={dashboard}>
      <div className="section pt-14">
        <SectionHeading
          eyebrow="Treasury"
          title="Where the fees are right now"
          sub="Read directly from the treasury wallet on Solana. This is what pays for redeemed games."
        />
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {TREASURY_LIVE && (
            <a className="btn-ghost !py-1.5 font-mono text-xs" href={site.explorerAccount(TREASURY_WALLET)} target="_blank" rel="noreferrer">
              Wallet {shortAddr(TREASURY_WALLET, 6)} ↗
            </a>
          )}
          <Link href="/ledger" className="btn-ghost !py-1.5 text-xs">
            Full ledger →
          </Link>
        </div>

        <TreasuryPreview fees={fees} refTime={refTime} href="/ledger" />

        <div className="mt-16">
          <BigStats />
        </div>

        <div className="mt-16">
          <Carousel title="Treasury activity" href="/ledger" demo={demo}>
            {entries.slice(0, 15).map((e) => (
              <ActivityCard key={e.signature} e={e} demo={demo} solUsd={dashboard?.snapshot.solUsd ?? DEMO_SOL_USD} />
            ))}
          </Carousel>
        </div>
      </div>
    </DashboardProvider>
  );
}
