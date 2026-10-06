import Link from "next/link";
import { TOKEN_LIVE, TOKEN_MINT, points, site } from "@/config";
import { fmtNum } from "@/lib/format";
import CopyAddress from "./CopyAddress";
import HeroPig from "./HeroPig";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* faint sunset glow */}
      <div className="pointer-events-none absolute left-1/2 top-[-340px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-accent2/20 via-accent/10 to-transparent blur-3xl" />

      <div className="section relative grid items-center gap-6 pb-14 pt-12 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:pb-20 lg:pt-20">
        <HeroPig className="mx-auto w-[min(62vw,250px)] lg:order-2 lg:w-full lg:max-w-[420px]" />

        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-line/15 bg-line/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            <span className={`h-1.5 w-1.5 animate-pulseDot rounded-full ${TOKEN_LIVE ? "bg-good" : "bg-accent2"}`} />
            {TOKEN_LIVE ? "Live on Solana" : "Launching soon on Solana"}
          </span>

          <h1 className="mt-5 max-w-3xl text-balance font-display text-[2.7rem] font-extrabold leading-[0.98] tracking-tight sm:text-6xl xl:text-7xl">
            Hold ${site.ticker}. Earn points.
            <br />
            <span className="accent-text">Get paid in games.</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base text-muted sm:text-lg">
            Every trade feeds the piggy bank, a public treasury that buys GTA 6. Hold, stack points, and{" "}
            {fmtNum(points.redeemCost)} points gets you a copy for PS5 or Xbox. Oink.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link className="btn-primary !px-6" href="/redeem">
              Redeem GTA 6
            </Link>
            <Link className="btn-ghost !px-6" href="#calculator">
              How long until mine?
            </Link>
          </div>

          <div className="mt-7 flex w-full flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <CopyAddress address={TOKEN_LIVE ? TOKEN_MINT : ""} />
            {TOKEN_LIVE && (
              <a className="link text-sm" href={site.buyUrl(TOKEN_MINT)} target="_blank" rel="noreferrer">
                Buy ${site.ticker} ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
