import Link from "next/link";
import Hero from "@/components/Hero";
import BigStats from "@/components/BigStats";
import { DashboardProvider } from "@/components/DashboardContext";
import EarnCalculator from "@/components/EarnCalculator";
import FinalCta from "@/components/FinalCta";
import HonestLimits from "@/components/HonestLimits";
import HowItWorks from "@/components/HowItWorks";
import Leaderboard from "@/components/Leaderboard";
import LootFeed from "@/components/LootFeed";
import SectionHeading from "@/components/SectionHeading";
import { getDashboard } from "@/lib/solana";
import { getTopHolders, listPublicRedemptions } from "@/lib/points";

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

      <div className="section mt-20">
        <SectionHeading eyebrow="How to play" title="Four quests. One GTA 6." />
        <HowItWorks />
      </div>

      <div id="calculator" className="section mt-20 scroll-mt-24">
        <EarnCalculator />
      </div>

      <div className="section mt-20 grid items-start gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <div className="flex items-end justify-between gap-3">
            <SectionHeading eyebrow="Leaderboard" title="Top oinkers" />
            <Link href="/points" className="mb-7 text-xs font-semibold text-muted transition hover:text-fg">
              Full board →
            </Link>
          </div>
          <Leaderboard rows={holders.rows} demo={holders.demo} variant="compact" />
        </div>
        <div>
          <SectionHeading eyebrow="Fresh loot" title="Who just got paid" />
          <LootFeed rows={redemptions.rows.slice(0, 7)} demo={redemptions.demo} now={now} />
        </div>
      </div>

      <div className="section mt-20">
        <BigStats />
      </div>

      <div className="section mt-20">
        <HonestLimits />
      </div>

      <div className="section mt-20">
        <FinalCta />
      </div>
    </DashboardProvider>
  );
}
