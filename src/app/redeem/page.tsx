import type { Metadata } from "next";
import Link from "next/link";
import RedeemFlow from "@/components/RedeemFlow";
import SectionHeading from "@/components/SectionHeading";
import { points, site } from "@/config";
import { fmtNum, fmtUsd } from "@/lib/format";

export const metadata: Metadata = { title: `Redeem GTA 6 — ${site.name}` };

const examples = [100, 250, 500, 1000, 2500];

export default function RedeemPage() {
  const perPoint = points.usdPerPointDay;
  return (
    <div className="section pt-14">
      <SectionHeading
        eyebrow="Redeem"
        title="Trade your points for GTA 6"
        sub={`${fmtNum(points.redeemCost)} points = one copy of GTA 6 for PlayStation 5 or Xbox Series X|S, bought by the treasury and delivered as a digital code.`}
      />

      <RedeemFlow />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-5 sm:p-7">
          <p className="label">How points are earned</p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <li>
              <span className="text-fg">{fmtUsd(perPoint, 0)} held for a full day = 1 point.</span> Points are added
              once a day at the {points.snapshotTime} snapshot.
            </li>
            <li>
              You earn on the <span className="text-fg">lower</span> of your balance at this snapshot and the previous
              one, valued at the lower of the two prices — so you need to hold through the whole day.
            </li>
            <li>Points aren&apos;t retroactive: earning starts at the first snapshot after you buy.</li>
            <li>
              Points have no cash value, can&apos;t be transferred or sold, and exist only to redeem games.
            </li>
          </ul>
        </div>

        <div className="card p-5 sm:p-7">
          <p className="label">Time to {fmtNum(points.redeemCost)} points</p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="pb-2 font-normal">Held (USD value)</th>
                <th className="pb-2 text-right font-normal">Points / day</th>
                <th className="pb-2 text-right font-normal">Days</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {examples.map((usd) => {
                const perDay = usd / perPoint;
                return (
                  <tr key={usd} className="border-t border-line/[0.06]">
                    <td className="py-2.5">{fmtUsd(usd, 0)}</td>
                    <td className="py-2.5 text-right text-muted">{fmtNum(perDay, perDay < 10 ? 1 : 0)}</td>
                    <td className="py-2.5 text-right">{fmtNum(Math.ceil(points.redeemCost / perDay))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">Assumes the token price stays the same, which it won&apos;t.</p>
        </div>
      </div>

      <div className="card mt-4 p-5 text-sm leading-relaxed text-muted sm:p-7">
        <p className="label mb-3">Fair-use limits</p>
        One redemption per wallet every {points.cooldownDays} days. Requests are filled in order as the treasury can
        afford them; new requests pause while {points.maxPendingRedemptions} are waiting. If a request can&apos;t be
        filled, the points are returned. Redemptions are not guaranteed — see the{" "}
        <Link href="/terms" className="link">terms</Link> and <Link href="/disclosures" className="link">disclosures</Link>.
      </div>
    </div>
  );
}
