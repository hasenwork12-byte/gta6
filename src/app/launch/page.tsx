import type { Metadata } from "next";
import CopyAddress from "@/components/CopyAddress";
import { TOKEN_LIVE, TOKEN_MINT, site } from "@/config";

export const metadata: Metadata = { title: `Launch — ${site.name}` };

/** "Coming soon" until NEXT_PUBLIC_TOKEN_MINT is set; then the contract address and a buy button. */
export default function LaunchPage() {
  if (!TOKEN_LIVE) {
    return (
      <div className="section flex min-h-[60vh] items-center justify-center py-20 text-center">
        <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl">
          Coming <span className="accent-text">soon</span>
        </h1>
      </div>
    );
  }
  return (
    <div className="section flex min-h-[60vh] flex-col items-center justify-center gap-8 py-20 text-center">
      <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl">
        ${site.ticker} is <span className="accent-text">live</span>
      </h1>
      <CopyAddress address={TOKEN_MINT} />
      <a className="btn-primary !px-8 !py-3.5 text-base" href={site.buyUrl(TOKEN_MINT)} target="_blank" rel="noreferrer">
        Buy ${site.ticker}
      </a>
    </div>
  );
}
