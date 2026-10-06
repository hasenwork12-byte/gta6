import { site } from "@/config";

const LIMITS: [string, string][] = [
  [
    "Points aren't money",
    "They have no cash value and can't be sold or sent to another wallet. They only turn into game copies here.",
  ],
  [
    "No trading, no games",
    "The piggy bank only grows from trading fees. If volume dries up, new copies slow down or stop.",
  ],
  [
    `$${site.ticker} can go down`,
    "Holding to earn points is still holding a memecoin. The price can fall by more than a game is worth.",
  ],
  [
    "Run by people, not a contract",
    "Points are tracked by our server, and the team buys codes by hand. Every purchase is on-chain, but the rules can be changed.",
  ],
];

/** Plain-spoken risks, shown before people buy. Credibility beats hype. */
export default function HonestLimits() {
  return (
    <div>
      <p className="label">Before you ape in</p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">The honest limits</h2>
      <div className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-line/[0.08] bg-line/[0.08] sm:grid-cols-2">
        {LIMITS.map(([title, body]) => (
          <div key={title} className="bg-bg p-5 sm:p-6">
            <p className="font-medium">{title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
