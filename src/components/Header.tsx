"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";

const nav = [
  { href: "/#treasury", label: "Treasury" },
  { href: "/#points", label: "Points" },
  { href: "/redeem", label: "Redeem" },
  { href: "/#how", label: "How it works" },
  { href: "/treasury", label: "Ledger" },
  { href: "/#faq", label: "FAQ" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line/[0.06] bg-bg/80 backdrop-blur-md">
      <div className="section flex h-16 items-center justify-between">
        <Link href="/" aria-label="Home" onClick={() => setOpen(false)}>
          <Logo showTicker={false} />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="transition hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <button
          className="rounded-lg p-2 text-muted hover:text-fg md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav className="section flex flex-col gap-1 pb-4 md:hidden">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2.5 text-muted hover:bg-line/[0.04] hover:text-fg"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
