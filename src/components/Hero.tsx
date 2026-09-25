import Link from "next/link";
import { TOKEN_LIVE, TOKEN_MINT, points, site } from "@/config";
import { fmtNum } from "@/lib/format";
import CopyAddress from "./CopyAddress";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* faint sunset glow */}
      <div className="pointer-events-none absolute left-1/2 top-[-340px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-accent2/20 via-accent/10 to-transparent blur-3xl" />

      <div className="section relative flex flex-col items-center pb-16 pt-20 text-center sm:pb-20 sm:pt-28">
        <h1 className="max-w-4xl text-balance text-[2.6rem] font-semibold leading-[1.04] tracking-tight sm:text-6xl md:text-7xl">
          Hold ${site.ticker}. Earn points.
          <br />
          <span className="accent-text">Redeem GTA&nbsp;6.</span>
        </h1>
        <p className="mt-6 max-w-xl text-pretty text-base text-muted sm:text-lg">
          Trading fees fill a public treasury, and {fmtNum(points.redeemCost)} points redeems a copy for PS5 or Xbox.
        </p>

        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link className="btn-primary !px-6" href="/redeem">
            Redeem GTA 6
          </Link>
          <Link className="btn-ghost !px-6" href="/how-it-works">
            How it works
          </Link>
        </div>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <CopyAddress address={TOKEN_LIVE ? TOKEN_MINT : ""} />
          {TOKEN_LIVE && (
            <a className="link text-sm" href={site.buyUrl(TOKEN_MINT)} target="_blank" rel="noreferrer">
              Buy ${site.ticker} ↗
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
