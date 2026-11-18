import Link from "next/link";
import { buyback, points, site } from "@/config";
import { fmtNum, fmtUsd } from "@/lib/format";

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: `What is $${site.ticker}?`,
    a: `A community memecoin on Solana. Its creator fees feed the Pig Bank, a public wallet that buys copies of GTA 6, which holders claim with XP. It's a meme and a rewards experiment — not an investment product.`,
  },
  {
    q: "How does XP work?",
    a: `Every ${fmtUsd(points.usdPerPointDay, 0)} worth of $${site.ticker} you hold for a full day earns 1 XP. Hold $1,000 and you earn ${fmtNum(1000 / points.usdPerPointDay)} XP a day, so ${fmtNum(points.redeemCost)} XP takes about ${fmtNum(points.redeemCost / (1000 / points.usdPerPointDay))} days. XP is added once a day at ${points.snapshotTime}.`,
  },
  {
    q: "What is the buyback?",
    a: `${Math.round(buyback.share * 100)}% of every creator fee is set aside to buy $${site.ticker} on the open market${buyback.burn ? ", and everything bought back is burned, so the supply only goes down" : ""}. The other ${Math.round((1 - buyback.share) * 100)}% buys games. Buybacks are made from the Pig Bank wallet, so each one is on-chain and listed on the Pig Bank page.`,
  },
  {
    q: "Why do I have to hold for the whole day?",
    a: "You earn on the lower of your balances at two consecutive daily snapshots, so buying right before a snapshot and selling right after earns nothing. The price used is also the lower of the two, so short price spikes don't inflate XP.",
  },
  {
    q: "How do I claim my copy?",
    a: (
      <>
        Go to the <Link href="/redeem" className="link">claim page</Link>, connect your wallet, choose PlayStation 5 or
        Xbox Series X|S and your store region, and sign a free message. If a code is in stock it&apos;s delivered
        instantly — press <em>Reveal code</em> and sign again to see it. If not, you join the queue and get a code
        automatically as soon as the Pig Bank has the money. The purchase shows up on the Claims page.
      </>
    ),
  },
  {
    q: "I have more XP than I need. Can I give copies away?",
    a: (
      <>
        Yes. On the <Link href="/redeem" className="link">claim page</Link>, choose <em>Gift a wallet</em> to send a copy to
        someone else&apos;s wallet — they connect that wallet on the same page, pick PS5 or Xbox and claim it. Gifts are
        listed in the public feed. You can gift one copy every {points.cooldownLabel}, on top of
        one copy for yourself.
      </>
    ),
  },
  {
    q: "Is a game guaranteed?",
    a: `No. Claims are filled in order while the Pig Bank can pay for them. If trading volume drops, fees drop and claims slow down. If we can't fill a request, your XP is returned. Each wallet can claim one copy for itself every ${points.cooldownLabel}.`,
  },
  {
    q: "Can I sell or transfer XP?",
    a: "No. XP isn't a token, has no cash value, and is tied to the wallet that earned it. It can only be spent on games.",
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
