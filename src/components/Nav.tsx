"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Gauge, Gift, House, PiggyBank, Rocket, ScrollText, type LucideIcon } from "lucide-react";
import { site, xSocial } from "@/config";
import { XIcon } from "./Icons";
import { LogoMark } from "./Logo";

type Item = { href: string; label: string; short: string; icon: LucideIcon };

const NAV: Item[] = [
  { href: "/", label: "Home", short: "Home", icon: House },
  { href: "/launch", label: "Launch", short: "Launch", icon: Rocket },
  { href: "/treasury", label: "Pig Bank", short: "Pig Bank", icon: PiggyBank },
  { href: "/points", label: "My XP", short: "My XP", icon: Gauge },
  { href: "/redemptions", label: "Claims", short: "Claims", icon: Gift },
  { href: "/ledger", label: "Receipts", short: "Receipts", icon: ScrollText },
  { href: "/how-it-works", label: "How it works", short: "How", icon: CircleHelp },
];

// Phones get five tabs; Receipts and How it works stay reachable from the footer.
const TABS = NAV.filter((n) => n.href !== "/ledger" && n.href !== "/how-it-works");

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

/** Sticky top bar on every screen size, plus an app-style bottom tab bar on phones. */
export default function Nav() {
  const pathname = usePathname() ?? "/";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/10 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label={`${site.name} home`} className="flex shrink-0 items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="font-display text-lg font-extrabold tracking-tight">{site.name}</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 rounded-full border border-line/10 bg-white/[0.03] p-1 lg:flex">
            {NAV.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
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
                className="hidden rounded-full border border-line/10 p-2 text-muted transition hover:text-fg sm:block"
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line/10 bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
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
