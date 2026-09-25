import Hero from "@/components/Hero";
import TreasuryDashboard from "@/components/TreasuryDashboard";
import RedemptionFeed from "@/components/RedemptionFeed";
import PointsChecker from "@/components/PointsChecker";
import HowItWorks from "@/components/HowItWorks";
import FAQ from "@/components/FAQ";
import SectionHeading from "@/components/SectionHeading";
import { getDashboard } from "@/lib/solana";
import { listPublicRedemptions } from "@/lib/points";

export const revalidate = 30;

export default async function Home() {
  // If the RPC is down at render time, the client fetches instead.
  const [dashboard, redemptions] = await Promise.all([
    getDashboard().catch(() => null),
    listPublicRedemptions().catch(() => ({ rows: [], demo: true })),
  ]);

  return (
    <>
      <Hero />

      <section id="treasury" className="section scroll-mt-20 pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Live treasury"
          title="Where the fees are right now"
          sub="Balance and fee totals are read directly from the treasury wallet on Solana. This is what pays for redeemed games."
        />
        <TreasuryDashboard initial={dashboard} />
      </section>

      <section id="points" className="section scroll-mt-20 pt-20">
        <SectionHeading
          eyebrow="Points"
          title="Check your points"
          sub="Paste any address or connect your wallet to see its points, daily earning rate and progress to a free copy."
        />
        <PointsChecker />
      </section>

      <section id="redemptions" className="section scroll-mt-20 pt-20">
        <SectionHeading
          eyebrow="Redemptions"
          title="Games redeemed"
          sub="Every delivered copy links to the on-chain payment from the treasury, so anyone can verify it."
        />
        <RedemptionFeed rows={redemptions.rows} demo={redemptions.demo} />
      </section>

      <section id="how" className="section scroll-mt-20 pt-20">
        <SectionHeading eyebrow="How it works" title="Hold, earn, redeem" />
        <HowItWorks />
      </section>

      <section id="faq" className="section scroll-mt-20 pt-20">
        <SectionHeading eyebrow="FAQ" title="Questions" />
        <FAQ />
      </section>
    </>
  );
}
