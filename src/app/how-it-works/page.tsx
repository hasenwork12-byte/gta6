import type { Metadata } from "next";
import FAQ from "@/components/FAQ";
import HowItWorks from "@/components/HowItWorks";
import SectionHeading from "@/components/SectionHeading";
import { site } from "@/config";

export const metadata: Metadata = { title: `How it works — ${site.name}` };

export default function HowItWorksPage() {
  return (
    <div className="section pt-14">
      <SectionHeading eyebrow="How it works" title="Hold, earn, redeem" />
      <HowItWorks />
      <div id="faq" className="mt-20 scroll-mt-20">
        <SectionHeading eyebrow="FAQ" title="Questions" />
        <FAQ />
      </div>
    </div>
  );
}
