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
          When you redeem, we store your wallet address, chosen platform and store region. We don&apos;t ask for your
          email. Game codes are stored
          encrypted and are only revealed to the wallet that owns them. The public feed shows a shortened wallet
          address, the platform, the date and the on-chain purchase receipt. For gifts, the recipient&apos;s wallet
          address is also shown (shortened).
        </p>
      </section>
      <section>
        <h2>Third parties</h2>
        <p>
          Blockchain data is fetched from Solana RPC providers, prices from Jupiter, CoinGecko, Coinbase, Binance and DexScreener. Data is stored
          with Upstash (Redis) and the site is hosted by Vercel, which may keep standard server logs.
        </p>
      </section>
    </LegalPage>
  );
}
