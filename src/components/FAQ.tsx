import Link from "next/link";
import { points, site } from "@/config";
import { fmtNum, fmtUsd } from "@/lib/format";

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: `What is $${site.ticker}?`,
    a: `A community memecoin on Solana. Its creator fees go to a public treasury that buys copies of GTA 6, which holders can redeem with points. It is a meme and a rewards experiment — not an investment product.`,
  },
  {
    q: "How do points work?",
    a: `Every ${fmtUsd(points.usdPerPointDay, 0)} worth of $${site.ticker} you hold for a full day earns 1 point. For example, holding $100 earns 10 points a day, so ${fmtNum(points.redeemCost)} points takes about 100 days; holding $1,000 takes about 10. Points are added once a day at ${points.snapshotTime}.`,
  },
  {
    q: "Why do I have to hold for the whole day?",
    a: "You earn on the lower of your balances at two consecutive daily snapshots, so buying right before a snapshot and selling right after earns nothing. The price used is also the lower of the two, so short price spikes don't inflate points.",
  },
  {
    q: "How do I redeem?",
    a: (
      <>
        Go to the <Link href="/redeem" className="link">redeem page</Link>, connect your wallet, choose PlayStation 5 or
        Xbox Series X|S and your store region, and sign a free message. The treasury buys the code and it&apos;s emailed
        to you. The purchase transaction is published in the redemption feed.
      </>
    ),
  },
  {
    q: "Is a game guaranteed?",
    a: `No. Redemptions are filled in order while the treasury can pay for them. If trading volume drops, fees drop and redemptions slow down. If we can't fill a request, your points are returned. Each wallet can redeem once every ${points.cooldownDays} days.`,
  },
  {
    q: "Can I sell or transfer points?",
    a: "No. Points aren't tokens, have no cash value, and are tied to the wallet that earned them. They can only be redeemed for games.",
  },
  {
    q: "Is this affiliated with Rockstar Games, Sony or Microsoft?",
    a: "No. We are not affiliated with, endorsed by, or sponsored by Rockstar Games or Take-Two Interactive, or by Sony or Microsoft. We buy retail copies of the game.",
  },
  {
    q: "Will holding make me money?",
    a: (
      <>
        Nobody can promise that, and we don&apos;t. Memecoins are extremely volatile and you can lose everything you put in.
        Read the <Link href="/disclosures" className="link">risk disclosures</Link>.
      </>
    ),
  },
];

export default function FAQ() {
  return (
    <div className="card divide-y divide-line/[0.07]">
      {faqs.map((f) => (
        <details key={f.q} className="group px-5 py-4 sm:px-7">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="font-mono text-muted transition group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
