import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { site } from "@/config";

export const metadata: Metadata = { title: `Privacy — ${site.name}` };

export default function Privacy() {
  return (
    <LegalPage title="Privacy" updated="September 25, 2026">
      <section>
        <h2>What we collect</h2>
        <p>
          This site has no accounts and sets no tracking cookies. Wallet addresses you check are used only to look up
          public on-chain balances and points. We keep a points balance per wallet address, calculated from public
          blockchain data.
        </p>
      </section>
      <section>
        <h2>Redemptions</h2>
        <p>
          When you redeem, we store your wallet address, chosen platform, store region and email address. The email is
          used only to deliver your game code and is never shown publicly. The public feed shows a shortened wallet
          address, the platform, the date and the on-chain purchase receipt. For gifts, the recipient&apos;s wallet
          address is also shown (shortened); the recipient&apos;s email is collected only when they claim. You can ask us to delete your email after
          delivery.
        </p>
      </section>
      <section>
        <h2>Third parties</h2>
        <p>
          Blockchain data is fetched from Solana RPC providers, prices from CoinGecko and DexScreener. Data is stored
          with Upstash (Redis) and the site is hosted by Vercel, which may keep standard server logs.
        </p>
      </section>
    </LegalPage>
  );
}
