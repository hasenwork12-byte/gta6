import Link from "next/link";
import { Coins, Gamepad2, Gem, Wallet } from "lucide-react";
import { points, site } from "@/config";
import { fmtNum, fmtUsd } from "@/lib/format";

const quests = [
  {
    icon: Wallet,
    title: `Grab $${site.ticker}`,
    body: "Buy on Solana. That's your ticket into the game.",
    reward: "Ticket in",
  },
  {
    icon: Gem,
    title: "Hold. Don't jeet.",
    body: `Every ${fmtUsd(points.usdPerPointDay, 0)} you hold for a full day earns 1 XP. Paper hands earn nothing.`,
    reward: `+1 XP / ${fmtUsd(points.usdPerPointDay, 0)} / day`,
  },
  {
    icon: Coins,
    title: "Feed the pig",
    body: "Every trade drops creator fees into the Pig Bank, a public wallet anyone can check.",
    reward: "Pig gets fat",
  },
  {
    icon: Gamepad2,
    title: "Claim GTA 6",
    body: `Hit ${fmtNum(points.redeemCost)} XP, pick PS5 or Xbox, sign once. Code drops instantly if it's in stock.`,
    reward: `${fmtNum(points.redeemCost)} XP → 1 copy`,
  },
];

/** The four "quests", then the fine print in plain words. */
export default function HowItWorks() {
  return (
    <div className="space-y-6">
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quests.map((q, i) => (
          <li key={q.title} className="card card-hover relative flex flex-col p-5">
            <div className="flex items-center justify-between">
              <span className="label">Quest {String(i + 1).padStart(2, "0")}</span>
              <span className="grid h-10 w-10 place-items-center rounded-xl border-2 border-accent/25 bg-accent/10 text-accent">
                <q.icon className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
            </div>
            <h3 className="mt-4 font-display text-xl font-extrabold tracking-tight">{q.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{q.body}</p>
            <span className="chip mt-4 w-fit text-gold">{q.reward}</span>
          </li>
        ))}
      </ol>

      <div className="card p-5 sm:p-7">
        <p className="label">The rules · no cap</p>
        <dl className="mt-5 grid gap-6 text-sm md:grid-cols-3">
          <div>
            <dt className="font-semibold">Earning XP</dt>
            <dd className="mt-1.5 leading-relaxed text-muted">
              {fmtUsd(points.usdPerPointDay, 0)} held for a full day = 1 XP, dropped daily at {points.snapshotTime}. You
              earn on the lower of your balance at two snapshots in a row, at the lower of the two prices, so buying
              right before the drop doesn&apos;t pay. Treasury, pool, team and exchange wallets don&apos;t earn.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Claiming</dt>
            <dd className="mt-1.5 leading-relaxed text-muted">
              Spend {fmtNum(points.redeemCost)} XP on the <Link href="/redeem" className="link">claim page</Link>. Pick
              PlayStation 5 or Xbox Series X|S and sign a free message. Your code drops right there, instantly if
              it&apos;s in stock, or automatically when the pig restocks. Got extra XP? Gift a copy to a fren or donate
              one to the team.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Limits</dt>
            <dd className="mt-1.5 leading-relaxed text-muted">
              One copy for yourself every {points.cooldownDays} days, plus up to {points.maxDonationsPerWindow} gifts or
              donations in the same window. Claims are filled in order while the pig can pay. If one can&apos;t be
              filled, you get your XP back. XP has no cash value.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
