import Link from "next/link";
import { Coins, Gamepad2, Gem, Wallet } from "lucide-react";
import { buyback, points, site } from "@/config";
import { fmtNum, fmtUsd } from "@/lib/format";

const quests = [
  {
    icon: Wallet,
    title: `Buy $${site.ticker}`,
    body: "Buy it on Solana. Holding it is how you take part.",
    reward: "You're in",
  },
  {
    icon: Gem,
    title: "Hold $PIG",
    body: `Every ${fmtUsd(points.usdPerPointDay, 0)} you hold for a full day earns 1 XP. If you sell, you stop earning.`,
    reward: `+1 XP / ${fmtUsd(points.usdPerPointDay, 0)} / day`,
  },
  {
    icon: Coins,
    title: "Trading fees fill the Pig Bank",
    body: `Every trade sends creator fees to the Pig Bank, a public wallet anyone can check. ${Math.round((1 - buyback.share) * 100)}% buys games, ${Math.round(buyback.share * 100)}% buys $${site.ticker} back${buyback.burn ? " and burns it" : ""}.`,
    reward: buyback.burn ? "Pig Bank grows · supply shrinks" : "Pig Bank grows",
  },
  {
    icon: Gamepad2,
    title: "Claim GTA 6",
    body: `Reach ${fmtNum(points.redeemCost)} XP, pick PS5 or Xbox, sign once. You get the code right away if it's in stock.`,
    reward: `${fmtNum(points.redeemCost)} XP → 1 copy`,
  },
];

/** The four "quests", then the fine print in plain words. */
export default function HowItWorks() {
  return (
    <div className="space-y-6">
      {/* Phones: swipeable row of cards. sm+: grid. */}
      <ol className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 pt-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {quests.map((q, i) => (
          <li key={q.title} className="card card-hover relative flex w-[78%] shrink-0 snap-center flex-col p-5 sm:w-auto">
            <div className="flex items-center justify-between">
              <span className="font-display text-4xl font-extrabold leading-none text-line/[0.12]">{String(i + 1).padStart(2, "0")}</span>
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

      <p className="-mt-2 text-center font-mono text-[11px] text-muted sm:hidden">Swipe to see all four steps</p>

      <div className="card p-5 sm:p-7">
        <p className="label">The rules</p>
        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:mt-5 sm:gap-6 md:grid-cols-3">
          <div>
            <dt className="font-semibold">Earning XP</dt>
            <dd className="mt-1.5 leading-relaxed text-muted">
              {fmtUsd(points.usdPerPointDay, 0)} held for a full day = 1 XP, added daily at {points.snapshotTime}. You
              earn on the lower of your balance at two snapshots in a row, at the lower of the two prices, so buying
              right before the daily snapshot doesn&apos;t pay. Treasury, pool, team and exchange wallets don&apos;t earn.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Claiming</dt>
            <dd className="mt-1.5 leading-relaxed text-muted">
              Spend {fmtNum(points.redeemCost)} XP on the <Link href="/redeem" className="link">claim page</Link>. Pick
              PlayStation 5 or Xbox Series X|S and sign a free message. Your code shows up right there, instantly if
              it&apos;s in stock, or automatically when the Pig Bank has money again. Got extra XP? Gift a copy to a friend.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Limits</dt>
            <dd className="mt-1.5 leading-relaxed text-muted">
              One copy for yourself every {points.cooldownLabel}, plus one gift in the
              same window. Claims are filled in order while the Pig Bank can pay. If one can&apos;t be
              filled, you get your XP back. XP has no cash value.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
