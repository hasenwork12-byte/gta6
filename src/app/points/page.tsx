import type { Metadata } from "next";
import Link from "next/link";
import EarnCalculator from "@/components/EarnCalculator";
import Leaderboard from "@/components/Leaderboard";
import PointsChecker from "@/components/PointsChecker";
import SectionHeading from "@/components/SectionHeading";
import { points, site } from "@/config";
import { fmtNum } from "@/lib/format";
import { getTopHolders } from "@/lib/points";

export const metadata: Metadata = { title: `Leaderboard — ${site.name}` };
export const revalidate = 60;

export default async function PointsPage() {
  const holders = await getTopHolders(50).catch(() => ({ rows: [], demo: true }));
  return (
    <div className="section pt-12">
      <SectionHeading eyebrow="Leaderboard" title="Top oinkers" sub="The biggest stackers. Diamond hands only." />
      <Leaderboard rows={holders.rows} demo={holders.demo} />
      <p className="mt-4 text-xs text-muted">
        XP has no cash value. See <Link href="/how-it-works" className="link">how XP is earned</Link>.
      </p>

      <div className="mt-16">
        <SectionHeading
          eyebrow="XP check"
          title="How much XP you got?"
          sub={`Paste any wallet or connect yours. ${fmtNum(points.redeemCost)} XP unlocks one copy of GTA 6.`}
        />
        <PointsChecker />
      </div>

      <EarnCalculator className="mt-16" />
    </div>
  );
}
