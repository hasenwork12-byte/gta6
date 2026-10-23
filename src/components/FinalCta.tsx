import Link from "next/link";
import { TOKEN_LIVE, TOKEN_MINT, site } from "@/config";
import HeroPig from "./HeroPig";

/** Closing band: one last nudge, with the mascot. */
export default function FinalCta() {
  return (
    <div className="card relative overflow-hidden border-accent/30 bg-gradient-to-br from-accent/20 via-surface to-accent2/10 p-5 sm:p-10">
      <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
        <div className="text-center md:text-left">
          {/* end-of-mission stamp, the payoff every holder is playing for */}
          <div className="mb-4 inline-flex -rotate-3 flex-col items-center rounded-xl border-2 border-gold/70 px-4 py-1.5 text-gold">
            <span className="font-display text-xl font-extrabold uppercase italic tracking-wide sm:text-2xl">Mission passed</span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">Respect + · GTA 6 unlocked</span>
          </div>
          <p className="label">Your move</p>
          <h2 className="mt-2 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">
            Stop scrolling.
            <br />
            <span className="accent-text">Start stacking.</span>
          </h2>
          <p className="mt-4 max-w-md text-muted md:max-w-lg">
            Every day you hold is XP in the bank. Every trade fattens the pig. The games go to the holders. That&apos;s the whole game.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
            {TOKEN_LIVE ? (
              <a className="btn-primary !px-6 !py-3 text-base" href={site.buyUrl(TOKEN_MINT)} target="_blank" rel="noreferrer">
                Ape into ${site.ticker}
              </a>
            ) : (
              <Link className="btn-primary !px-6 !py-3 text-base" href="/how-it-works">
                Learn the game
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
