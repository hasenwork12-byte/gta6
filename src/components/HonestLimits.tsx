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
    "Holding to stack XP is still holding a memecoin. The price can fall by more than a game is worth.",
  ],
  [
    "Run by people, not a contract",
    "XP is tracked by our server, and the team buys codes and makes buybacks by hand. Every purchase is on-chain, but the rules can be changed.",
  ],
];

/** Plain-spoken risks, shown before people buy. Credibility beats hype. */
export default function HonestLimits() {
  return (
    <div>
      <SectionHeading index={6} eyebrow="Before you ape in" title="The honest limits. No cap." />
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
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
