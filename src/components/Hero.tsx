import Link from "next/link";
import { TOKEN_LIVE, TOKEN_MINT, points, site } from "@/config";
import { fmtNum, fmtUsd } from "@/lib/format";
import CopyAddress from "./CopyAddress";
import PigBank from "./PigBank";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-[-340px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-accent2/20 via-accent/10 to-transparent blur-3xl" />

      <div className="section relative grid items-center gap-10 pb-12 pt-10 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pb-16 lg:pt-16">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <span className="chip uppercase tracking-[0.14em] text-muted">
            <span className={`h-1.5 w-1.5 animate-pulseDot rounded-full ${TOKEN_LIVE ? "bg-good" : "bg-accent2"}`} />
            {TOKEN_LIVE ? "Live on Solana · gm" : "Launching soon on Solana"}
          </span>

          <h1 className="mt-5 max-w-3xl text-balance font-display text-[2.8rem] font-extrabold leading-[0.95] tracking-tight sm:text-6xl xl:text-7xl">
            Hold ${site.ticker}.
            <br />
            Stack XP.
            <br />
            <span className="accent-text">Claim GTA&nbsp;6.</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base text-muted sm:text-lg">
            Every trade feeds the pig. The pig buys GTA 6. Hold, don&apos;t jeet, hit{" "}
            <span className="font-semibold text-fg">{fmtNum(points.redeemCost)} XP</span> and your copy is on us. Simple as oink.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {TOKEN_LIVE ? (
              <a className="btn-primary !px-6 !py-3 text-base" href={site.buyUrl(TOKEN_MINT)} target="_blank" rel="noreferrer">
                Ape into ${site.ticker}
              </a>
            ) : (
              <Link className="btn-primary !px-6 !py-3 text-base" href="/how-it-works">
                How to play
              </Link>
            )}
            <Link className="btn-ghost !px-6 !py-3 text-base" href="#calculator">
              When do I eat?
            </Link>
          </div>

          <div className="mt-6 flex w-full justify-center lg:justify-start">
            <CopyAddress address={TOKEN_LIVE ? TOKEN_MINT : ""} />
          </div>

          <dl className="mt-8 grid w-full max-w-md grid-cols-3 gap-2 text-center lg:text-left">
            {[
              ["1 XP", `${fmtUsd(points.usdPerPointDay, 0)} held · 1 day`],
              [`${fmtNum(points.redeemCost)} XP`, "= GTA 6"],
              [points.snapshotTime.replace(" UTC", ""), "daily XP drop (UTC)"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border-2 border-line/[0.08] bg-surface/60 px-3 py-2.5">
                <dt className="font-display text-lg font-extrabold">{k}</dt>
                <dd className="text-[11px] leading-tight text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <p className="label mb-1 text-center">The Pig Bank · live treasury</p>
          <PigBank className="mx-auto w-full max-w-[460px]" />
        </div>
      </div>
    </section>
  );
}
