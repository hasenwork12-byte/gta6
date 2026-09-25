"use client";

import { useCallback, useEffect, useState } from "react";

/** Public stock counts per `platform|region`. */
export function useStock() {
  const [stock, setStock] = useState<Record<string, number>>({});
  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/stock", { cache: "no-store" });
      const j = await r.json();
      setStock(j.stock ?? {});
    } catch {}
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { stock, refresh };
}
