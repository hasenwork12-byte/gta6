"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Dashboard, LedgerEntry } from "@/lib/types";

const POLL_MS = 30_000;
const DEMO_TICK_MS = 4_500;
/** SOL/USD is rechecked this often, in demo and live mode. */
const SOL_POLL_MS = 5 * 60_000;

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

  // Live SOL price, on its own timer so demo mode gets it too. Also rechecks when the tab comes back.
  useEffect(() => {
    let alive = true;
    let last = Date.now();
    const load = async () => {
      last = Date.now();
      try {
        const r = await fetch("/api/sol-price", { cache: "no-store" });
        if (!r.ok) return;
        const { usd } = (await r.json()) as { usd: number };
        if (alive && usd > 0) setData((d) => (d && d.snapshot.solUsd !== usd ? { ...d, snapshot: { ...d.snapshot, solUsd: usd } } : d));
      } catch {}
    };
    const id = setInterval(load, SOL_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - last >= SOL_POLL_MS) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Demo: simulate small incoming fees so the rolling numbers can be seen.
  useEffect(() => {
    if (!demo || process.env.NEXT_PUBLIC_DEMO_DATA !== "true") return;
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
            buyback: {
              ...d.snapshot.buyback,
              owedSol: d.snapshot.buyback.owedSol + fee * d.snapshot.buyback.share,
              reservedSol: d.snapshot.buyback.reservedSol + fee * d.snapshot.buyback.share,
            },
            // Demo: a fresh fee lands in the creator vault, waiting for the next auto-claim.
            fees: { ...d.snapshot.fees, earnedSol: d.snapshot.fees.earnedSol + fee, unclaimedSol: d.snapshot.fees.unclaimedSol + fee },
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
