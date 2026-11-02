import Link from "next/link";
import Hero from "@/components/Hero";
import BigStats from "@/components/BigStats";
import BuybackPanel from "@/components/BuybackPanel";
import { DashboardProvider } from "@/components/DashboardContext";
import EarnCalculator from "@/components/EarnCalculator";
import FinalCta from "@/components/FinalCta";
import HonestLimits from "@/components/HonestLimits";
import HowItWorks from "@/components/HowItWorks";
import LootFeed from "@/components/LootFeed";
import SectionHeading from "@/components/SectionHeading";
import Film from "@/components/Film";
import SloganTape from "@/components/scene/SloganTape";
import { getDashboard } from "@/lib/solana";
import { listPublicRedemptions } from "@/lib/points";
import { buyback, site } from "@/config";

export const revalidate = 30;

export default async function Home() {
  // If the RPC is down at render time, sections fall back to empty states.
  const [dashboard, redemptions] = await Promise.all([
    getDashboard().catch(() => null),
    listPublicRedemptions().catch(() => ({ rows: [], demo: true })),
  ]);
  const now = Date.now();
  // Fake claims on the front page would read as proof, so the list only shows once real claims exist.
  const showClaims = !redemptions.demo && redemptions.rows.length > 0;

  return (
    <DashboardProvider initial={dashboard}>
      <Hero />
      <SloganTape />
      <Film />

      <div className="section mt-4 sm:mt-8">
        <SectionHeading index={1} eyebrow="How to play" title="Four quests. One GTA 6." />
        <HowItWorks />
      </div>

      <div id="calculator" className="section gap-section scroll-mt-24">
        <EarnCalculator />
      </div>

      {showClaims && (
        <div className="section gap-section">
          <SectionHeading index={3} eyebrow="Latest claims" title="Who just got paid" />
          <LootFeed rows={redemptions.rows.slice(0, 7)} demo={false} now={now} />
        </div>
      )}

      <div className="section gap-section">
        <BigStats />
      </div>

      <div id="buybacks" className="section gap-section scroll-mt-24">
        <div className="flex items-end justify-between gap-3">
          <SectionHeading
            index={showClaims ? 4 : 3}
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
        <HonestLimits index={showClaims ? 5 : 4} />
      </div>

      <div className="section gap-section">
        <FinalCta />
      </div>
    </DashboardProvider>
  );
}
