import Link from "next/link";
import Hero from "@/components/Hero";
import BigStats from "@/components/BigStats";
import BuybackPanel from "@/components/BuybackPanel";
import { DashboardProvider } from "@/components/DashboardContext";
import EarnCalculator from "@/components/EarnCalculator";
import FinalCta from "@/components/FinalCta";
import HonestLimits from "@/components/HonestLimits";
import HowItWorks from "@/components/HowItWorks";
import Leaderboard from "@/components/Leaderboard";
import LootFeed from "@/components/LootFeed";
import SectionHeading from "@/components/SectionHeading";
import SloganTape from "@/components/scene/SloganTape";
import { getDashboard } from "@/lib/solana";
import { getTopHolders, listPublicRedemptions } from "@/lib/points";
import { buyback, site } from "@/config";

export const revalidate = 30;

export default async function Home() {
  // If the RPC is down at render time, sections fall back to empty states.
  const [dashboard, redemptions, holders] = await Promise.all([
    getDashboard().catch(() => null),
    listPublicRedemptions().catch(() => ({ rows: [], demo: true })),
    getTopHolders(8).catch(() => ({ rows: [], demo: true })),
  ]);
  const now = Date.now();

  return (
    <DashboardProvider initial={dashboard}>
      <Hero />
      <SloganTape />

      <div className="section mt-4 sm:mt-8">
        <SectionHeading index={1} eyebrow="How to play" title="Four quests. One GTA 6." />
        <HowItWorks />
      </div>

      <div id="calculator" className="section gap-section scroll-mt-24">
        <EarnCalculator />
      </div>

      <div className="section gap-section grid items-start gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <div className="flex items-end justify-between gap-3">
            <SectionHeading index={3} eyebrow="Leaderboard" title="Top oinkers" />
            <Link href="/points" className="mb-7 text-xs font-semibold text-muted transition hover:text-fg">
              Full board →
            </Link>
          </div>
          <Leaderboard rows={holders.rows} demo={holders.demo} variant="compact" />
        </div>
        <div>
          <SectionHeading index={4} eyebrow="Fresh loot" title="Who just got paid" />
          <LootFeed rows={redemptions.rows.slice(0, 7)} demo={redemptions.demo} now={now} />
        </div>
      </div>

      <div className="section gap-section">
        <BigStats />
      </div>

      <div id="buybacks" className="section gap-section scroll-mt-24">
        <div className="flex items-end justify-between gap-3">
          <SectionHeading
            index={5}
            eyebrow={buyback.burn ? "The money machine · buyback & burn" : "The money machine · buyback"}
            title={`Fees in. Games out. ${Math.round(buyback.share * 100)}% buys $${site.ticker} back.`}
          />
          <Link href="/treasury#buybacks" className="mb-7 shrink-0 text-xs font-semibold text-muted transition hover:text-fg">
            Every buyback →
          </Link>
        </div>
        <BuybackPanel />
      </div>

      <div className="section gap-section">
        <HonestLimits />
      </div>

      <div className="section gap-section">
        <FinalCta />
      </div>
    </DashboardProvider>
  );
}
