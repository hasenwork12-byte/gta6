"use client";

import { useCallback, useRef, useState } from "react";
import type { PointsInfo } from "@/lib/types";

export function usePoints() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<PointsInfo | null>(null);
  // Only the latest lookup may update the screen, so a slow earlier answer never
  // replaces the wallet that was checked after it.
  const latest = useRef(0);

  const load = useCallback(async (wallet: string) => {
    const id = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/points?wallet=${encodeURIComponent(wallet)}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Couldn't load XP right now. Try again in a moment.");
      if (id === latest.current) setInfo(j);
    } catch (e) {
      if (id !== latest.current) return;
      setInfo(null);
      setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Couldn't reach the site. Check your connection and try again.");
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, []);

  return { loading, error, info, load, reset: () => setInfo(null) };
}
