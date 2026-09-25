"use client";

import { useCallback, useState } from "react";
import type { PointsInfo } from "@/lib/types";

export function usePoints() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<PointsInfo | null>(null);

  const load = useCallback(async (wallet: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/points?wallet=${encodeURIComponent(wallet)}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Something went wrong");
      setInfo(j);
    } catch (e) {
      setInfo(null);
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, info, load, reset: () => setInfo(null) };
}
