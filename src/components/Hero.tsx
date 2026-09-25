import Link from "next/link";
import { TOKEN_LIVE, TOKEN_MINT, points, site } from "@/config";
import { fmtNum, fmtUsd } from "@/lib/format";
import CopyAddress from "./CopyAddress";
import SunsetArt from "./SunsetArt";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line/[0.06]">
      <SunsetArt className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-[62%] w-full max-w-5xl opacity-70 sm:h-[70%]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg via-bg/70 to-transparent" />

      <div className="section relative flex min-h-[640px] flex-col items-center pb-56 pt-16 text-center sm:min-h-[720px] sm:pt-24">
        <span className="rounded-full border border-line/10 bg-line/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          Solana · Public treasury · ${site.ticker}
        </span>
        <h1 className="mt-6 max-w-4xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Hold. Earn points.
          <br className="hidden sm:block" /> Redeem <span className="accent-text">GTA&nbsp;6</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
          Every ${site.ticker} trade sends a creator fee to a public, on-chain treasury. Every {fmtUsd(points.usdPerPointDay, 0)}{" "}
          you hold for a day earns 1 point, and {fmtNum(points.redeemCost)} points redeems a copy for PlayStation 5 or
          Xbox Series X|S, paid for by the treasury.
        </p>

        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {TOKEN_LIVE ? (
            <a className="btn-primary" href={site.buyUrl(TOKEN_MINT)} target="_blank" rel="noreferrer">
              Buy ${site.ticker}
            </a>
          ) : (
            <button className="btn-primary" disabled title="Available once the token launches">
              Buy ${site.ticker} · soon
            </button>
          )}
          <Link className="btn-ghost" href="/redeem">
            Redeem
          </Link>
          <Link className="btn-ghost" href="#treasury">
            View treasury
          </Link>
          <Link className="btn-ghost" href="#how">
            Read how it works
          </Link>
        </div>

        <div className="mt-7 flex w-full justify-center">
          <CopyAddress address={TOKEN_LIVE ? TOKEN_MINT : ""} />
        </div>
      </div>
    </section>
  );
}
