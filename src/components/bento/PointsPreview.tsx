"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { points } from "@/config";
import { fmtNum, fmtUsd } from "@/lib/format";
import { usePoints } from "../usePoints";
import BentoCard from "./BentoCard";

/** The wallet checker in miniature. */
export default function PointsPreview({ demo }: { demo: boolean }) {
  const [input, setInput] = useState("");
  const { loading, error, info, load } = usePoints();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) load(input.trim());
  };
  const pct = info ? Math.min(100, (info.points / info.cost) * 100) : 0;

  return (
    <BentoCard label="Points" href="/points" demo={demo}>
      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor="mini-wallet" className="sr-only">
          Wallet address
        </label>
        <input
          id="mini-wallet"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Wallet address"
          spellCheck={false}
          autoComplete="off"
          className="h-9 min-w-0 flex-1 rounded-full border border-line/15 bg-bg/60 px-4 font-mono text-xs outline-none placeholder:text-muted focus:border-accent/60"
        />
        <button className="btn-ghost !h-9 !px-4 !py-0 text-xs" disabled={loading || !input.trim()}>
          {loading ? "…" : "Check"}
        </button>
      </form>

      <div className="mt-5 flex-1" aria-live="polite">
        {error && <p className="text-xs text-accent">{error}</p>}
        {!info && !error && (
          <dl className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between">
              <dt className="text-muted">Earn</dt>
              <dd>1 pt / {fmtUsd(points.usdPerPointDay, 0)} / day</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Redeem</dt>
              <dd>{fmtNum(points.redeemCost)} pts</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">$100 held</dt>
              <dd>≈ {fmtNum(points.redeemCost / (100 / points.usdPerPointDay))} days</dd>
            </div>
          </dl>
        )}
        {info && (
          <div>
            <div className="flex items-end justify-between gap-2">
              <span className="font-mono text-3xl">{fmtNum(info.points, 1)}</span>
              <span className="pb-1 font-mono text-xs text-muted">/ {fmtNum(info.cost)} pts</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line/[0.07]">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ${pct >= 100 ? "bg-good" : "bg-gradient-to-r from-accent to-accent2"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-3 font-mono text-xs text-muted">
              {fmtUsd(info.usdValue)} held · +{fmtNum(info.perDay, 2)} pts/day
            </p>
            {pct >= 100 && (
              <Link href="/redeem" className="link mt-2 inline-block text-xs">
                Ready to redeem →
              </Link>
            )}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
