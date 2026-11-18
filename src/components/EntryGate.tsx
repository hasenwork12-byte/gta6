"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { site } from "@/config";
import HeroPig from "./HeroPig";

const KEY = "pig-entered";

/**
 * "Tap to enter" screen on the home page, once per browser session.
 * Browsers only allow sound after the visitor interacts, so this tap is what lets the
 * theme song start the moment they're in (ThemeMusic listens for the first tap anywhere).
 * An inline script in the layout marks <html data-entered> before paint, so visitors
 * who already entered this session never see it flash.
 */
export default function EntryGate() {
  const path = usePathname();
  const [state, setState] = useState<"open" | "leaving" | "gone">("open");

  useEffect(() => {
    if (document.documentElement.hasAttribute("data-entered")) setState("gone");
  }, []);

  useEffect(() => {
    if (state !== "open" || path !== "/") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [state, path]);

  if (path !== "/" || state === "gone") return null;

  const enter = () => {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    document.documentElement.setAttribute("data-entered", "");
    setState("leaving");
    window.setTimeout(() => setState("gone"), 450);
  };

  return (
    <div
      className={`entry-gate fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#0e0814] px-6 text-center transition-opacity duration-500 ${
        state === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      onClick={enter}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 45%, rgb(var(--accent-1) / 0.28), transparent 70%), radial-gradient(40% 30% at 50% 100%, rgb(255 170 60 / 0.18), transparent 70%)",
        }}
      />
      <HeroPig className="relative w-[min(62vw,320px)]" />
      <h1 className="relative mt-4 font-display text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
        {site.name.toUpperCase()}
      </h1>
      <p className="relative mt-3 text-sm text-white/70 sm:text-base">
        Hold ${site.ticker}. Stack XP. Claim GTA 6.
      </p>
      <button
        type="button"
        autoFocus
        onClick={(e) => {
          e.stopPropagation();
          enter();
        }}
        className="entry-pulse relative mt-9 rounded-full border-2 border-accent bg-accent/15 px-9 py-4 font-display text-lg font-extrabold uppercase tracking-[0.2em] text-white shadow-[0_0_40px_rgb(var(--accent-1)/0.55)] outline-none transition hover:bg-accent/30 focus-visible:ring-4 focus-visible:ring-accent/50"
      >
        Tap to enter
      </button>
      <p className="relative mt-4 font-mono text-[11px] uppercase tracking-widest text-white/40">Sound on</p>
    </div>
  );
}
