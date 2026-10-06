import type { Metadata } from "next";
import EarnCalculator from "@/components/EarnCalculator";
import FAQ from "@/components/FAQ";
import HonestLimits from "@/components/HonestLimits";
import HowItWorks from "@/components/HowItWorks";
import SectionHeading from "@/components/SectionHeading";
import { site } from "@/config";

export const metadata: Metadata = { title: `How to play — ${site.name}` };

export default function HowItWorksPage() {
  return (
    <div className="section pt-14">
      <SectionHeading eyebrow="How to play" title="Four quests. One GTA 6." />
      <HowItWorks />
      <div className="mt-16">
        <EarnCalculator />
      </div>
      <div className="mt-20">
        <HonestLimits />
      </div>
      <div id="faq" className="mt-20 scroll-mt-20">
        <SectionHeading eyebrow="FAQ" title="Questions, anon?" />
        <FAQ />
      </div>
    </div>
  );
}
