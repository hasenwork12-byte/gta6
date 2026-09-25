import Link from "next/link";
import { site } from "@/config";
import { XIcon } from "./Icons";
import Logo from "./Logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/[0.07] bg-bg/80 backdrop-blur-md">
      <div className="section flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={`${site.name} home`}>
          <Logo showTicker={false} />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={site.links.x}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm text-muted transition hover:bg-line/[0.05] hover:text-fg"
            aria-label={site.xHandle ? `${site.xHandle} on X` : `${site.name} on X`}
          >
            <XIcon />
            <span className="hidden sm:inline">{site.xHandle || "Follow"}</span>
          </a>
          <Link href="/redeem" className="btn-primary !px-4 !py-2">
            Redeem
          </Link>
        </div>
      </div>
    </header>
  );
}
