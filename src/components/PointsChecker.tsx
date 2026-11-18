"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { points } from "@/config";
import { fmtNum } from "@/lib/format";
import PointsPanel from "./PointsPanel";
import { usePoints } from "./usePoints";
import WalletButton from "./WalletButton";

export default function PointsChecker() {
  const { publicKey } = useWallet();
  const [input, setInput] = useState("");
  const { loading, error, info, load } = usePoints();

  useEffect(() => {
    if (publicKey) {
      const a = publicKey.toBase58();
      setInput(a);
      load(a);
    }
  }, [publicKey, load]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) load(input.trim());
  };

  return (
    <div className="card p-5 sm:p-7">
      {/* The wallet button sits outside the form: inside it, it doubled as the form's submit
          button and the connect failed (Phantom "Unexpected error"); outside, like on /redeem, it works. */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={onSubmit} className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
          <label htmlFor="wallet" className="sr-only">
            Solana wallet address
          </label>
          <input
            id="wallet"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a Solana wallet address"
            spellCheck={false}
            autoComplete="off"
            className="h-[42px] min-w-0 flex-1 rounded-full border border-line/15 bg-bg/60 px-5 font-mono text-sm outline-none placeholder:text-muted focus:border-accent/60"
          />
          <button className="btn-primary sm:flex-none" disabled={loading || !input.trim()}>
            {loading ? "Checking…" : "Check XP"}
          </button>
        </form>
        <WalletButton />
      </div>

      <div className="mt-6 min-h-[120px]" aria-live="polite">
        {error && <p className="text-sm text-accent">{error}</p>}
        {!error && !info && !loading && (
          <p className="text-sm text-muted">
            Every ${fmtNum(points.usdPerPointDay)} held for a full day earns 1 XP. {fmtNum(points.redeemCost)} XP
            unlocks one copy of GTA 6.
          </p>
        )}
        {info && (
          <div className="space-y-6">
            <PointsPanel info={info} />
            <Link href="/redeem" className={info.points >= info.cost ? "btn-primary" : "btn-ghost"}>
              {info.points >= info.cost ? "Claim GTA 6 →" : "See how claiming works →"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
