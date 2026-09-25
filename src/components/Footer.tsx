import Link from "next/link";
import { site } from "@/config";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line/[0.06]">
      <div className="section grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            A community memecoin whose creator fees fund a public, on-chain treasury that pays for games holders
            redeem with points. Memecoins are highly speculative. Nothing here is financial advice.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="label">Community</p>
          <a className="block text-muted hover:text-fg" href={site.links.x} target="_blank" rel="noreferrer">
            X / Twitter
          </a>
          <a className="block text-muted hover:text-fg" href={site.links.telegram} target="_blank" rel="noreferrer">
            Telegram
          </a>
          <Link className="block text-muted hover:text-fg" href="/treasury">
            Public ledger
          </Link>
          <Link className="block text-muted hover:text-fg" href="/redeem">
            Redeem
          </Link>
        </div>
        <div className="space-y-3 text-sm">
          <p className="label">Legal</p>
          <Link className="block text-muted hover:text-fg" href="/disclosures">
            Risk disclosures
          </Link>
          <Link className="block text-muted hover:text-fg" href="/terms">
            Points &amp; redemption terms
          </Link>
          <Link className="block text-muted hover:text-fg" href="/privacy">
            Privacy
          </Link>
        </div>
      </div>
      <div className="border-t border-line/[0.06]">
        <div className="section flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Not affiliated with, endorsed by, or sponsored by Rockstar Games or Take-Two Interactive.</p>
          <p className="font-mono">© {new Date().getFullYear()} {site.name}</p>
        </div>
      </div>
    </footer>
  );
}
