import Link from "next/link";
import { TOKEN_LIVE, TOKEN_MINT, TREASURY_LIVE, TREASURY_WALLET, site, socials } from "@/config";
import { TelegramIcon, XIcon } from "./Icons";
import Logo from "./Logo";

type Item = { label: string; href: string; external?: boolean };

const columns: { title: string; items: Item[] }[] = [
  {
    title: "Product",
    items: [
      { label: "Redeem", href: "/redeem" },
      { label: "Points", href: "/points" },
      { label: "Redemptions", href: "/redemptions" },
      { label: "How it works", href: "/how-it-works" },
    ],
  },
  {
    title: "Treasury",
    items: [
      { label: "Overview", href: "/treasury" },
      { label: "Public ledger", href: "/ledger" },
      ...(TREASURY_LIVE ? [{ label: "Wallet on Solscan", href: site.explorerAccount(TREASURY_WALLET), external: true }] : []),
      ...(TOKEN_LIVE ? [{ label: `Buy $${site.ticker}`, href: site.buyUrl(TOKEN_MINT), external: true }] : []),
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Disclosures", href: "/disclosures" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-28 border-t border-line/[0.07]">
      <div className="section grid gap-12 py-14 md:grid-cols-[1.3fr_2fr]">
        <div className="space-y-5">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Creator fees fund a public, on-chain treasury that pays for games holders redeem with points. Memecoins are
            highly speculative. Nothing here is financial advice.
          </p>
          {socials.length > 0 && (
            <div className="flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.id === "x" ? `${s.label} on X` : "Telegram"}
                  className="rounded-full border border-line/10 p-2.5 text-muted transition hover:border-line/25 hover:text-fg"
                >
                  {s.id === "x" ? <XIcon /> : <TelegramIcon />}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((c) => (
            <div key={c.title} className="space-y-3 text-sm">
              <p className="label">{c.title}</p>
              {c.items.map((i) =>
                i.external ? (
                  <a key={i.label} href={i.href} target="_blank" rel="noreferrer" className="block text-muted transition hover:text-fg">
                    {i.label} ↗
                  </a>
                ) : (
                  <Link key={i.label} href={i.href} className="block text-muted transition hover:text-fg">
                    {i.label}
                  </Link>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line/[0.07]">
        <div className="section flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Not affiliated with, endorsed by, or sponsored by Rockstar Games or Take-Two Interactive.</p>
          <p className="font-mono">
            © {new Date().getFullYear()} {site.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
