"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Gamepad2,
  Gift,
  House,
  Landmark,
  Menu,
  ScrollText,
  Sparkles,
  X as CloseIcon,
  type LucideIcon,
} from "lucide-react";
import { site, xSocial } from "@/config";
import { XIcon } from "./Icons";
import Logo, { LogoMark } from "./Logo";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/treasury", label: "Treasury", icon: Landmark },
  { href: "/points", label: "Points", icon: Sparkles },
  { href: "/redemptions", label: "Redemptions", icon: Gift },
  { href: "/ledger", label: "Ledger", icon: ScrollText },
  { href: "/how-it-works", label: "How it works", icon: CircleHelp },
  { href: "/redeem", label: "Redeem", icon: Gamepad2 },
];

const STORAGE_KEY = "pig-sidebar-collapsed";

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export default function Sidebar() {
  const pathname = usePathname() ?? "/";
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false); // no width animation on first paint
  const [open, setOpen] = useState(false); // mobile drawer

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {}
    setReady(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  // Close the drawer on navigation; Escape closes it; lock page scroll while open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-line/[0.07] bg-bg md:block ${
          collapsed ? "w-[72px]" : "w-60"
        } ${ready ? "transition-[width] duration-200 ease-out" : ""}`}
      >
        <SidebarBody pathname={pathname} collapsed={collapsed} onToggle={toggle} />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line/[0.07] bg-bg/85 px-4 backdrop-blur-md md:hidden">
        <Link href="/" aria-label={`${site.name} home`}>
          <Logo showTicker={false} />
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-drawer"
          className="rounded-lg p-2 text-muted transition hover:bg-line/[0.06] hover:text-fg"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          inert={!open}
          className={`absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-line/[0.07] bg-bg shadow-2xl transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarBody pathname={pathname} collapsed={false} onClose={() => setOpen(false)} />
        </aside>
      </div>
    </>
  );
}

function SidebarBody({
  pathname,
  collapsed,
  onToggle,
  onClose,
}: {
  pathname: string;
  collapsed: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}) {
  const iconBtn = "rounded-lg p-1.5 text-muted transition hover:bg-line/[0.06] hover:text-fg";
  return (
    <div className="flex h-full flex-col">
      <div className={`flex gap-2 px-4 pb-6 pt-5 ${collapsed ? "flex-col items-center" : "items-center justify-between"}`}>
        <Link href="/" aria-label={`${site.name} home`} className="flex min-w-0 items-center gap-2.5">
          <LogoMark className="h-9 w-9 shrink-0" />
          {!collapsed && <span className="truncate text-[15px] font-semibold tracking-tight">{site.name}</span>}
        </Link>
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
            className={iconBtn}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        )}
        {onClose && (
          <button onClick={onClose} aria-label="Close menu" className={iconBtn}>
            <CloseIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${collapsed ? "justify-center" : ""} ${
                active ? "bg-line/[0.06] font-semibold text-fg" : "text-muted hover:bg-line/[0.04] hover:text-fg"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.75} aria-hidden />
              {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <div
          className={`flex items-center gap-3 rounded-xl border border-line/[0.07] bg-surface/60 ${
            collapsed ? "justify-center p-2" : "p-3"
          }`}
        >
          <LogoMark className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{site.name}</p>
              {xSocial && (
                <a
                  href={xSocial.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 flex items-center gap-1.5 text-xs text-muted transition hover:text-fg"
                >
                  <XIcon className="h-3 w-3" />
                  <span className="truncate">{xSocial.label}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
