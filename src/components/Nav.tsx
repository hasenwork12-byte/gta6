"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Gift, House, PiggyBank, ScrollText, Trophy, type LucideIcon } from "lucide-react";
import { site, xSocial } from "@/config";
import { XIcon } from "./Icons";
import { LogoMark } from "./Logo";

type Item = { href: string; label: string; short: string; icon: LucideIcon };

const NAV: Item[] = [
  { href: "/", label: "Home", short: "Home", icon: House },
  { href: "/treasury", label: "Pig Bank", short: "Pig Bank", icon: PiggyBank },
  { href: "/points", label: "Leaderboard", short: "Ranks", icon: Trophy },
  { href: "/redemptions", label: "Loot drops", short: "Loot", icon: Gift },
  { href: "/ledger", label: "Receipts", short: "Receipts", icon: ScrollText },
  { href: "/how-it-works", label: "How to play", short: "Play", icon: CircleHelp },
];

// Phones get the five most useful; Receipts stays reachable from the Pig Bank page and the footer.
const TABS = NAV.filter((n) => n.href !== "/ledger");

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

/** Sticky top bar on every screen size, plus an app-style bottom tab bar on phones. */
export default function Nav() {
  const pathname = usePathname() ?? "/";

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-line/[0.07] bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label={`${site.name} home`} className="flex shrink-0 items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="font-display text-lg font-extrabold tracking-tight">{site.name}</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 rounded-2xl border-2 border-line/[0.08] bg-surface/70 p-1 lg:flex">
            {NAV.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                    active ? "bg-line/[0.1] text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {xSocial && (
              <a
                href={xSocial.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`${xSocial.label} on X`}
                className="hidden rounded-xl border-2 border-line/10 p-2 text-muted transition hover:text-fg sm:block"
              >
                <XIcon className="h-4 w-4" />
              </a>
            )}
            <Link href="/redeem" className="btn-primary !px-4 !py-2">
              Claim GTA 6
            </Link>
          </div>
        </div>
      </header>

      {/* Phone tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line/[0.08] bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map(({ href, short, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                    active ? "text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  <span className={`grid h-8 w-12 place-items-center rounded-xl transition ${active ? "bg-accent/20 text-accent" : ""}`}>
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.9} aria-hidden />
                  </span>
                  {short}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
