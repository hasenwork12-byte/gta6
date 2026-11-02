import type { Metadata } from "next";
import Link from "next/link";
import EarnCalculator from "@/components/EarnCalculator";
import PointsChecker from "@/components/PointsChecker";
import SectionHeading from "@/components/SectionHeading";
import { points, site } from "@/config";
import { fmtNum } from "@/lib/format";

export const metadata: Metadata = { title: `Check your XP — ${site.name}` };

export default function PointsPage() {
  return (
    <div className="section pt-12">
      <SectionHeading
        eyebrow="Your XP"
        title="How much XP do you have?"
        sub={`Paste any wallet or connect yours. ${fmtNum(points.redeemCost)} XP gets you one copy of GTA 6.`}
      />
      <PointsChecker />
      <p className="mt-4 text-xs text-muted">
        XP has no cash value. See <Link href="/how-it-works" className="link">how XP is earned</Link>.
      </p>

      <EarnCalculator className="mt-16" />
    </div>
  );
}
