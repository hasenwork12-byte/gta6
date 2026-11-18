"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { points } from "@/config";
import { fmtNum } from "@/lib/format";
import PointsPanel from "./PointsPanel";
import { usePoints } from "./usePoints";

/** Solana addresses are 32–44 base58 characters (no 0, O, I or l). */
const ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Look up any wallet's XP by pasting its address. No wallet connection needed. */
export default function PointsChecker() {
  const [input, setInput] = useState("");
  const [formatError, setFormatError] = useState<string | null>(null);
  const { loading, error, info, load } = usePoints();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // People often paste with spaces or line breaks around the address.
    const address = input.replace(/\s+/g, "");
    setInput(address);
    if (!address) return;
    if (!ADDRESS.test(address)) {
      setFormatError("That doesn't look like a Solana wallet address. Copy it again from your wallet and paste it here.");
      return;
    }
    setFormatError(null);
    load(address);
  };

  const shownError = formatError ?? error;

  return (
    <div className="card p-5 sm:p-7">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="wallet" className="sr-only">
          Solana wallet address
        </label>
        <input
          id="wallet"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (formatError) setFormatError(null);
          }}
          placeholder="Paste a Solana wallet address"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          inputMode="text"
          className="h-[42px] min-w-0 shrink-0 rounded-full border border-line/15 bg-bg/60 px-5 font-mono text-sm sm:flex-1 sm:shrink outline-none placeholder:text-muted focus:border-accent/60"
        />
        <button type="submit" className="btn-primary sm:flex-none" disabled={loading || !input.trim()}>
          {loading ? "Checking…" : "Check XP"}
        </button>
      </form>

      <div className="mt-6 min-h-[120px]" aria-live="polite">
        {shownError && <p className="text-sm text-accent">{shownError}</p>}
        {!shownError && !info && !loading && (
          <p className="text-sm text-muted">
            Every ${fmtNum(points.usdPerPointDay)} held for a full day earns 1 XP. {fmtNum(points.redeemCost)} XP
            unlocks one copy of GTA 6.
          </p>
        )}
        {!shownError && info && (
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
