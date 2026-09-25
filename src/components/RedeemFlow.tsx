"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { points, platformLabel } from "@/config";
import { fmtNum } from "@/lib/format";
import { buildRedeemMessage } from "@/lib/redeem-message";
import PointsPanel from "./PointsPanel";
import { usePoints } from "./usePoints";
import WalletButton from "./WalletButton";

function toBase64(bytes: Uint8Array) {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

export default function RedeemFlow() {
  const { publicKey, signMessage } = useWallet();
  const { info, error: loadError, loading, load } = usePoints();
  const [platform, setPlatform] = useState<string>("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const wallet = publicKey?.toBase58() ?? null;
  useEffect(() => {
    setDoneId(null);
    setError(null);
    if (wallet) load(wallet);
  }, [wallet, load]);

  const canRedeem = !!info && info.points >= info.cost && !info.cooldownUntil;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!wallet || !signMessage) {
      setError("Your wallet doesn't support message signing. Try Phantom, Solflare or Backpack.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const issuedAt = new Date().toISOString();
      const message = buildRedeemMessage({ wallet, platform, region, issuedAt });
      const sig = await signMessage(new TextEncoder().encode(message));
      const r = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, platform, region, email, issuedAt, signature: toBase64(sig) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Redemption failed");
      setDoneId(j.id);
      load(wallet);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Redemption failed";
      setError(/reject|denied|cancel/i.test(msg) ? "Signature cancelled — nothing was spent." : msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      {/* Left: wallet + points */}
      <div className="card p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label">Your points</p>
          <WalletButton />
        </div>
        <div className="mt-6" aria-live="polite">
          {!wallet && (
            <p className="text-sm leading-relaxed text-muted">
              Connect the wallet that holds your tokens. You&apos;ll sign a free message to prove it&apos;s yours — no
              transaction, no fee, and we never ask for your seed phrase.
            </p>
          )}
          {wallet && loading && !info && <p className="text-sm text-muted">Loading points…</p>}
          {loadError && <p className="text-sm text-accent">{loadError}</p>}
          {info && <PointsPanel info={info} />}
        </div>
      </div>

      {/* Right: redeem form */}
      <div className="card p-5 sm:p-7">
        <p className="label">Redeem · {fmtNum(points.redeemCost)} points</p>

        {doneId ? (
          <div className="mt-6 space-y-4">
            <p className="text-2xl font-medium text-good">Request received ✓</p>
            <p className="text-sm leading-relaxed text-muted">
              Reference <span className="font-mono text-fg">{doneId}</span>. {fmtNum(points.redeemCost)} points were
              reserved. Your {platformLabel(platform)} code will be emailed to <span className="text-fg">{email}</span> once
              the treasury buys it. Requests are filled in order, and the purchase receipt will appear in the public
              feed. If we can&apos;t fill it, your points are returned.
            </p>
            <Link href="/redemptions" className="btn-ghost">
              View the redemption feed
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <fieldset disabled={!canRedeem || busy} className="space-y-5 disabled:opacity-60">
              <div>
                <p className="mb-2 text-sm font-medium">Platform</p>
                <div className="grid grid-cols-2 gap-3">
                  {points.platforms.map((p) => (
                    <label
                      key={p.id}
                      className={`cursor-pointer rounded-xl border px-4 py-4 text-center text-sm transition ${
                        platform === p.id ? "border-accent bg-accent/10 text-fg" : "border-line/15 text-muted hover:border-line/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="platform"
                        value={p.id}
                        className="sr-only"
                        checked={platform === p.id}
                        onChange={() => setPlatform(p.id)}
                        required
                      />
                      <span className="block font-medium text-fg">GTA 6</span>
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="region" className="mb-2 block text-sm font-medium">
                  Store region
                </label>
                <select
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  required
                  className="h-[42px] w-full rounded-full border border-line/15 bg-bg/60 px-4 text-sm outline-none focus:border-accent/60"
                >
                  <option value="">Select…</option>
                  {points.regions.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  Email for code delivery
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="h-[42px] w-full rounded-full border border-line/15 bg-bg/60 px-5 text-sm outline-none placeholder:text-muted focus:border-accent/60"
                />
                <p className="mt-1.5 text-xs text-muted">Kept private. Used only to send your code.</p>
              </div>

              <label className="flex items-start gap-3 text-xs leading-relaxed text-muted">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required className="mt-0.5 accent-[rgb(var(--accent-1))]" />
                <span>
                  I&apos;ve read the <Link href="/terms" className="link">redemption terms</Link> and{" "}
                  <Link href="/disclosures" className="link">disclosures</Link>, and redeeming a game is allowed where I
                  live. I understand fulfilment depends on the treasury balance.
                </span>
              </label>

              <button className="btn-primary w-full" disabled={!platform || !region || !email || !agree}>
                {busy ? "Waiting for signature…" : "Sign & redeem"}
              </button>
            </fieldset>

            {!canRedeem && (
              <p className="text-xs text-muted">
                {!wallet
                  ? "Connect your wallet to redeem."
                  : info?.cooldownUntil
                    ? `This wallet can redeem again after its ${points.cooldownDays}-day cooldown.`
                    : `You need ${fmtNum(points.redeemCost)} points to redeem.`}
              </p>
            )}
            {error && <p className="text-sm text-accent">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
