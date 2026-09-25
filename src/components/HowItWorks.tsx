import Link from "next/link";
import { points, site } from "@/config";
import { fmtNum, fmtUsd } from "@/lib/format";

const steps = [
  {
    n: "01",
    title: "Trade",
    body: `Every buy or sell of $${site.ticker} generates a small creator fee, paid by the trading platform.`,
  },
  {
    n: "02",
    title: "Fees fill the treasury",
    body: "Creator fees go to one public treasury wallet. Anyone can audit it on-chain, any time.",
  },
  {
    n: "03",
    title: "Hold & earn points",
    body: `Every ${fmtUsd(points.usdPerPointDay, 0)} of $${site.ticker} you hold for a full day earns 1 point, added at a daily snapshot.`,
  },
  {
    n: "04",
    title: "Redeem GTA 6",
    body: `${fmtNum(points.redeemCost)} points = one copy for PlayStation 5 or Xbox Series X|S, bought by the treasury.`,
  },
];

export default function HowItWorks() {
  return (
    <div className="space-y-6">
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.n} className="card relative p-5">
            <span className="accent-text font-mono text-sm font-semibold">{s.n}</span>
            <h3 className="mt-3 text-lg font-medium">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            {i < steps.length - 1 && (
              <span className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-muted lg:block">→</span>
            )}
          </li>
        ))}
      </ol>

      <div className="card p-5 sm:p-7">
        <p className="label">The rules</p>
        <dl className="mt-5 grid gap-6 text-sm md:grid-cols-3">
          <div>
            <dt className="font-medium">Earning</dt>
            <dd className="mt-1.5 leading-relaxed text-muted">
              {fmtUsd(points.usdPerPointDay, 0)} held for a full day = 1 point. A snapshot runs daily at{" "}
              {points.snapshotTime}; you earn on the lower of your balance at two consecutive snapshots, valued at the
              lower of the two prices. Treasury, liquidity-pool, team and exchange wallets don&apos;t earn.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Redeeming</dt>
            <dd className="mt-1.5 leading-relaxed text-muted">
              Spend {fmtNum(points.redeemCost)} points on the <Link href="/redeem" className="link">redeem page</Link>.
              Pick PlayStation 5 or Xbox Series X|S, sign a free message with your wallet, and your code is delivered
              right there — instantly if in stock, or automatically when the treasury restocks. Got more points than you need? Gift a copy to another wallet, or donate
              it to the team for community giveaways and videos.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Limits</dt>
            <dd className="mt-1.5 leading-relaxed text-muted">
              One copy for yourself every {points.cooldownDays} days, plus up to {points.maxDonationsPerWindow} gifts or
              team donations in the same window. Requests are filled in order as the treasury can afford them; if one
              can&apos;t be filled, the points are returned. Points have no cash value.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
