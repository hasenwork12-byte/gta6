"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Dashboard, LedgerEntry } from "@/lib/types";

const POLL_MS = 30_000;
const DEMO_TICK_MS = 4_500;

type Value = { data: Dashboard | null; error: boolean };
const Ctx = createContext<Value>({ data: null, error: false });

/** Live treasury numbers shared by the counters, bento card and ticker. */
export function DashboardProvider({ initial, children }: { initial: Dashboard | null; children: React.ReactNode }) {
  const [data, setData] = useState<Dashboard | null>(initial);
  const [error, setError] = useState(false);
  const demo = data?.snapshot.demo ?? false;

  // Live: poll the API route.
  useEffect(() => {
    if (demo) return;
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/treasury", { cache: "no-store" });
        if (!r.ok) throw new Error();
        const j = (await r.json()) as Dashboard;
        if (alive) {
          setData(j);
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      }
    };
    if (!initial) load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [demo, initial]);

  // Demo: simulate small incoming fees so the rolling numbers can be seen.
  useEffect(() => {
    if (!demo) return;
    const id = setInterval(() => {
      setData((d) => {
        if (!d) return d;
        const fee = +(0.0005 + Math.random() * 0.004).toFixed(4);
        const entry: LedgerEntry = {
          signature: "DEMO" + Math.random().toString(36).slice(2),
          time: Math.floor(Date.now() / 1000),
          direction: "in",
          sol: fee,
          counterparty: null,
          label: "Creator fee",
          kind: "fee",
        };
        return {
          snapshot: {
            ...d.snapshot,
            balanceSol: d.snapshot.balanceSol + fee,
            totalFeesSol: d.snapshot.totalFeesSol + fee,
            buyback: { ...d.snapshot.buyback, owedSol: d.snapshot.buyback.owedSol + fee * d.snapshot.buyback.share },
          },
          recent: [entry, ...d.recent].slice(0, 20),
        };
      });
    }, DEMO_TICK_MS);
    return () => clearInterval(id);
  }, [demo]);

  return <Ctx.Provider value={{ data, error }}>{children}</Ctx.Provider>;
}

export const useDashboard = () => useContext(Ctx);
