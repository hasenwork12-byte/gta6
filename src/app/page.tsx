import Hero from "@/components/Hero";
import ActivityTicker from "@/components/ActivityTicker";
import BigStats from "@/components/BigStats";
import Carousel from "@/components/Carousel";
import { DashboardProvider } from "@/components/DashboardContext";
import EarnCalculator from "@/components/EarnCalculator";
import HonestLimits from "@/components/HonestLimits";
import LedgerPreview from "@/components/bento/LedgerPreview";
import PointsPreview from "@/components/bento/PointsPreview";
import RedemptionsPreview from "@/components/bento/RedemptionsPreview";
import RulesPreview from "@/components/bento/RulesPreview";
import TreasuryPreview from "@/components/bento/TreasuryPreview";
import ActivityCard from "@/components/cards/ActivityCard";
import HolderCard from "@/components/cards/HolderCard";
import RedemptionCard from "@/components/cards/RedemptionCard";
import { getDashboard, getLedger } from "@/lib/solana";
import { getTopHolders, listPublicRedemptions } from "@/lib/points";
import { DEMO_SOL_USD } from "@/lib/demo";

export const revalidate = 30;

export default async function Home() {
  // If the RPC is down at render time, sections fall back to empty states.
  const [dashboard, ledger, redemptions, holders] = await Promise.all([
    getDashboard().catch(() => null),
    getLedger().catch(() => null),
    listPublicRedemptions().catch(() => ({ rows: [], demo: true })),
    getTopHolders(15).catch(() => ({ rows: [], demo: true })),
  ]);
  const now = Date.now();
  const entries = ledger?.entries ?? [];
  const ledgerDemo = ledger?.demo ?? true;
  const refTime = dashboard?.snapshot.updatedAt ?? Math.floor(now / 1000);
  const fees = entries.filter((e) => e.direction === "in").map((e) => ({ time: e.time, sol: e.sol }));
  const solBySig = new Map(entries.map((e) => [e.signature, e.sol]));
  const solUsd = dashboard?.snapshot.solUsd ?? DEMO_SOL_USD;

  return (
    <DashboardProvider initial={dashboard}>
      <Hero />
      <ActivityTicker />

      <div className="section mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TreasuryPreview fees={fees} refTime={refTime} className="sm:col-span-2" />
        <RedemptionsPreview rows={redemptions.rows} demo={redemptions.demo} now={now} />
        <PointsPreview demo={holders.demo} />
        <LedgerPreview entries={entries} demo={ledgerDemo} now={now} />
        <RulesPreview />
      </div>

      <div id="calculator" className="section mt-24 scroll-mt-8">
        <EarnCalculator />
      </div>

      <div className="section mt-24">
        <BigStats />
      </div>

      <div className="section mt-24 space-y-20">
        <Carousel title="Recent redemptions" href="/redemptions" demo={redemptions.demo}>
          {redemptions.rows.slice(0, 15).map((r) => (
            <RedemptionCard key={r.id} r={r} now={now} paidSol={r.tx ? solBySig.get(r.tx) : undefined} />
          ))}
        </Carousel>

        <Carousel title="Top holders by points" href="/points" demo={holders.demo} itemClassName="w-[70%] sm:w-[calc(33.333%-11px)] lg:w-[calc(20%-13px)]">
          {holders.rows.map((h, i) => (
            <HolderCard key={h.wallet} rank={i + 1} wallet={h.wallet} pts={h.points} demo={holders.demo} />
          ))}
        </Carousel>

        <Carousel title="Treasury activity" href="/ledger" demo={ledgerDemo}>
          {entries.slice(0, 15).map((e) => (
            <ActivityCard key={e.signature} e={e} demo={ledgerDemo} solUsd={solUsd} />
          ))}
        </Carousel>
      </div>

      <div className="section mt-24">
        <HonestLimits />
      </div>
    </DashboardProvider>
  );
}
