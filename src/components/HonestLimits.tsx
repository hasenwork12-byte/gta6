import { TriangleAlert } from "lucide-react";
import { site } from "@/config";
import SectionHeading from "./SectionHeading";

const LIMITS: [string, string][] = [
  [
    "XP isn't money",
    "It has no cash value and can't be sold or sent to another wallet. It only turns into game copies here.",
  ],
  [
    "No trading, no games",
    "The Pig Bank only grows from trading fees. If volume dries up, new copies slow down or stop.",
  ],
  [
    `$${site.ticker} can go down`,
    "Holding to earn XP is still holding a memecoin. The price can fall by more than a game is worth.",
  ],
  [
    "Automatic, but not a contract",
    "Buybacks and burns are done automatically by our bot. XP is tracked by our server, and the team buys the GTA 6 codes. Every purchase is on-chain, but the rules can be changed.",
  ],
];

/** Plain-spoken risks, shown before people buy. Credibility beats hype. */
export default function HonestLimits({ index = 6 }: { index?: number }) {
  return (
    <div>
      <SectionHeading index={index} eyebrow="Before you buy" title="The honest limits." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {LIMITS.map(([title, body]) => (
          <div key={title} className="card p-4 sm:p-6">
            <p className="flex items-center gap-2 font-display text-lg font-extrabold">
              <TriangleAlert className="h-5 w-5 shrink-0 text-gold" aria-hidden />
              {title}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
