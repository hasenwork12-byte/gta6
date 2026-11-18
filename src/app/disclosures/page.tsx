import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { site, TOKEN_LIVE, TREASURY_LIVE } from "@/config";

export const metadata: Metadata = { title: `Risk disclosures — ${site.name}` };

export default function Disclosures() {
  return (
    <LegalPage title="Risk disclosures" updated="September 25, 2026">
      <section>
        <h2>Memecoins are speculative</h2>
        <p>
          ${site.ticker} is a memecoin. It has no intrinsic value, no underlying business, and no expectation of profit
          from the efforts of others. Its price can go to zero. Liquidity can disappear. Only use money you can afford to
          lose entirely.
        </p>
      </section>
      <section>
        <h2>Not financial advice</h2>
        <p>
          Nothing on this website is financial, investment, legal, or tax advice. We make <strong>no promise of
          profits or returns</strong> of any kind. Do your own research and consult a qualified professional if in doubt.
        </p>
      </section>
      <section>
        <h2>Redemptions are not guaranteed</h2>
        <p>
          Game purchases depend entirely on the treasury balance, which depends on trading volume and the creator-fee
          mechanics of the trading platform. If fees fall, redemptions slow down or stop. Points have no cash value, and
          the earning rate, cost and rules may change; changes will be announced on our official channels. Holding
          ${site.ticker} or points does not entitle you to any game.
        </p>
      </section>
      <section>
        <h2>Eligibility depends on where you live</h2>
        <p>
          Loyalty rewards, promotions and crypto-assets are regulated differently around the world. Redemption may be
          restricted or void where prohibited by law. You are responsible for any taxes and must be of legal age in
          your jurisdiction, and the game must be available and age-appropriate in your region. We may be unable to
          deliver to certain countries.
        </p>
      </section>
      <section>
        <h2>{TOKEN_LIVE && TREASURY_LIVE ? "On-chain data" : "On-chain data and demo mode"}</h2>
        <p>
          Figures on this site are read from public Solana RPC endpoints and may be delayed or temporarily wrong.
          {/* Only shown before launch, while the site still runs on placeholder numbers. */}
          {!(TOKEN_LIVE && TREASURY_LIVE) && (
            <>
              {" "}Any section marked <strong>DEMO DATA</strong> shows placeholder numbers, not real activity.
            </>
          )}{" "}
          Always verify on a block explorer.
        </p>
      </section>
      <section>
        <h2>No affiliation</h2>
        <p>
          {site.name} is not affiliated with, endorsed by, or sponsored by Rockstar Games or Take-Two Interactive, or by
          Sony Interactive Entertainment or Microsoft. Game and console names are used only to describe the rewards,
          which are purchased at retail.
        </p>
      </section>
      <section>
        <h2>Security</h2>
        <p>
          We will never DM you first, ask for your seed phrase, or ask you to send tokens or approve a transaction to
          redeem. Redeeming only asks you to sign a plain-text message. The only
          official contract address is the one shown on this website.
        </p>
      </section>
    </LegalPage>
  );
}
