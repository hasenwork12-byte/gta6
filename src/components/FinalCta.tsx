import Link from "next/link";
import { TOKEN_LIVE, TOKEN_MINT, site } from "@/config";
import HeroPig from "./HeroPig";

/** Closing band: one last nudge, with the mascot. */
export default function FinalCta() {
  return (
    <div className="card relative overflow-hidden border-accent/30 bg-gradient-to-br from-accent/20 via-surface to-accent2/10 p-5 sm:p-10">
      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto]">
        <div className="text-center md:text-left">
          <p className="label text-gold">100 XP · one copy of GTA 6</p>
          <h2 className="mt-2 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">
            Stop scrolling.
            <br />
            <span className="accent-text">Start stacking.</span>
          </h2>
          <p className="mt-4 max-w-md text-muted md:max-w-lg">
            Every day you hold earns XP. Every trade adds money to the Pig Bank. The games go to the holders. That&apos;s how it works.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
            {TOKEN_LIVE ? (
              <a className="btn-primary !px-6 !py-3 text-base" href={site.buyUrl(TOKEN_MINT)} target="_blank" rel="noreferrer">
                Buy ${site.ticker}
              </a>
            ) : (
              <Link className="btn-primary !px-6 !py-3 text-base" href="/how-it-works">
                How it works
              </Link>
            )}
            <Link className="btn-ghost !px-6 !py-3 text-base" href="/points">
              Check my XP
            </Link>
          </div>
        </div>
        <HeroPig className="mx-auto w-40 sm:w-52" />
      </div>
    </div>
  );
}
