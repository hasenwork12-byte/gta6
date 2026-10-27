import Link from "next/link";
import { TOKEN_LIVE, TOKEN_MINT, points, site } from "@/config";
import { fmtNum, fmtUsd } from "@/lib/format";
import CopyAddress from "./CopyAddress";
import Gta6Countdown from "./Gta6Countdown";
import PigBank from "./PigBank";
import SunsetScene, { PigSun } from "./scene/SunsetScene";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <SunsetScene />

      <div className="section relative grid grid-cols-1 items-center gap-8 pb-6 pt-8 sm:gap-10 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pb-14 lg:pt-16">
        <div className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
          <span className="chip bg-bg/80 uppercase tracking-[0.14em] text-muted backdrop-blur">
            <span className={`h-1.5 w-1.5 animate-pulseDot rounded-full ${TOKEN_LIVE ? "bg-good" : "bg-accent2"}`} />
            {TOKEN_LIVE ? "Live on Solana · gm" : "Launching soon on Solana"}
          </span>

          <h1 className="mt-5 max-w-3xl text-balance font-display text-[3.1rem] font-extrabold leading-[0.92] tracking-tight drop-shadow-[0_4px_0_rgb(0_0_0/0.35)] sm:text-7xl xl:text-[5.4rem]">
            Hold ${site.ticker}.
            <br />
            Stack XP.
            <br />
            <span className="relative inline-block">
              <span className="accent-text">Claim GTA&nbsp;6.</span>
              {/* marker swoosh under the payoff line */}
              <svg viewBox="0 0 300 18" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full sm:-bottom-3 sm:h-4" aria-hidden>
                <path d="M4 12C70 4 160 2 296 9" fill="none" stroke="rgb(var(--gold))" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-pretty text-base text-muted sm:text-lg">
            Every trade feeds the pig. The pig buys GTA 6. Hold, don&apos;t jeet, hit{" "}
            <span className="font-semibold text-fg">{fmtNum(points.redeemCost)} XP</span> and your copy is on us. Simple as oink.
          </p>

          <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {TOKEN_LIVE ? (
              <a className="btn-primary !px-6 !py-3.5 text-base" href={site.buyUrl(TOKEN_MINT)} target="_blank" rel="noreferrer">
                Ape into ${site.ticker}
              </a>
            ) : (
              <Link className="btn-primary !px-6 !py-3.5 text-base" href="/how-it-works">
                How to play
              </Link>
            )}
            <Link className="btn-ghost !px-6 !py-3.5 text-base" href="#calculator">
              When do I eat?
            </Link>
          </div>

          <div className="mt-5 flex w-full justify-center lg:justify-start">
            <CopyAddress address={TOKEN_LIVE ? TOKEN_MINT : ""} />
          </div>

          <Gta6Countdown className="mt-7 w-full max-w-md text-left" />

          <p className="mt-3 font-mono text-[11px] text-muted">
            1 XP = {fmtUsd(points.usdPerPointDay, 0)} held for a day · {fmtNum(points.redeemCost)} XP = 1 copy · XP drops{" "}
            {points.snapshotTime}
          </p>
        </div>

        <div className="min-w-0 pt-2 lg:pt-4">
          <div className="mb-3 flex justify-center">
            <span className="tag">The Pig Bank · live treasury</span>
          </div>
          <div className="relative mx-auto w-full max-w-[400px] sm:max-w-[460px]">
            <PigSun />
            <PigBank className="relative w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
