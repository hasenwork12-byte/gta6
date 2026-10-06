import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { points, site } from "@/config";
import { fmtNum, fmtUsd } from "@/lib/format";

export const metadata: Metadata = { title: `Points & redemption terms — ${site.name}` };

// Template terms — have these reviewed for the jurisdictions you operate in.
export default function Terms() {
  return (
    <LegalPage title="Points & redemption terms" updated="September 25, 2026">
      <section>
        <h2>Earning points</h2>
        <p>
          Wallets holding ${site.ticker} earn 1 point per {fmtUsd(points.usdPerPointDay, 0)} of value held for a full
          day. Points are calculated at a daily snapshot ({points.snapshotTime}) using the lower of the wallet&apos;s
          balance at that snapshot and the previous one, valued at the lower of the two token prices. Points are not
          retroactive. Treasury, liquidity-pool, team and exchange wallets do not earn. We may exclude wallets that
          attempt to manipulate snapshots or prices.
        </p>
      </section>
      <section>
        <h2>What points are</h2>
        <p>
          Points (shown on this site as &ldquo;XP&rdquo;) are an off-chain loyalty record. They are not tokens or securities, have <strong>no cash value</strong>,
          cannot be sold, transferred or exchanged for money, and exist only to redeem games offered on this site.
        </p>
      </section>
      <section>
        <h2>Redeeming</h2>
        <p>
          {fmtNum(points.redeemCost)} points can be redeemed for one digital copy of GTA 6 for PlayStation 5 or Xbox
          Series X|S. You must prove wallet ownership by signing a message. Each wallet may redeem one copy for itself
          every {points.cooldownDays} days. Points are reserved when you submit a request.
        </p>
      </section>
      <section>
        <h2>Gifts and team donations</h2>
        <p>
          Instead of redeeming for yourself, you can spend {fmtNum(points.redeemCost)} points to gift a copy to another
          wallet, or donate it to the {site.name} team. Each wallet may make up to {points.maxDonationsPerWindow} gifts or
          donations every {points.cooldownDays} days. A gift can only be claimed by the recipient wallet, which chooses
          the platform and region; unclaimed gifts may be cancelled after 30 days and the points returned to the
          sender. Team donations are used only for community giveaways and content, are never resold, and appear in the
          public feed. Gifts and donations are voluntary and give the sender nothing in return. Points themselves still
          cannot be transferred.
        </p>
      </section>
      <section>
        <h2>Fulfilment is not guaranteed</h2>
        <p>
          Requests are filled in the order received, only while the treasury can pay for them. New requests pause while{" "}
          {points.maxPendingRedemptions} are waiting. If a request cannot be filled — for example because the treasury
          is short, the game isn&apos;t available in your region, or redemption isn&apos;t permitted where you live — it
          is rejected and the points are returned. Codes are delivered on this website to the wallet that owns them (revealed by signing a message),
          are non-refundable once revealed, and have
          no cash alternative.
        </p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>
          We may change the earning rate, redemption cost, limits or rewards, or end the programme, with notice on our
          official channels. Points already reserved for a pending request will be honoured or returned. See also the{" "}
          <Link href="/disclosures" className="link">risk disclosures</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
