"use client";

import { FormEvent, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { platformLabel } from "@/config";
import { fmtDate, shortAddr } from "@/lib/format";
import { buildClaimMessage } from "@/lib/redeem-message";
import type { GiftToClaim } from "@/lib/types";
import DeliveryFields from "./DeliveryFields";
import { signAndPost } from "./signAndPost";

/** Shown when another wallet has gifted a copy to the connected wallet. */
export default function ClaimGift({ gift, onClaimed }: { gift: GiftToClaim; onClaimed: () => void }) {
  const { publicKey, signMessage } = useWallet();
  const [platform, setPlatform] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const wallet = publicKey?.toBase58();
    if (!wallet) return;
    setBusy(true);
    setError(null);
    try {
      const issuedAt = new Date().toISOString();
      const message = buildClaimMessage({ id: gift.id, wallet, platform, region, issuedAt });
      await signAndPost(signMessage, "/api/claim", message, { id: gift.id, wallet, platform, region, email, issuedAt });
      setDone(true);
      onClaimed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-good/30 bg-good/[0.06] p-5">
      <p className="text-lg font-medium">🎁 You&apos;ve been gifted a copy of GTA 6</p>
      <p className="mt-1 font-mono text-xs text-muted">
        From {shortAddr(gift.from, 5)} · {fmtDate(gift.createdAt / 1000)}
      </p>
      {done ? (
        <p className="mt-4 text-sm text-good">
          Claimed ✓ Your {platformLabel(platform)} code will be emailed to {email} once the treasury buys it.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-5">
          <DeliveryFields
            idPrefix={`claim-${gift.id}`}
            platform={platform}
            setPlatform={setPlatform}
            region={region}
            setRegion={setRegion}
            email={email}
            setEmail={setEmail}
          />
          <button className="btn-primary w-full" disabled={busy || !platform || !region || !email}>
            {busy ? "Waiting for signature…" : "Sign & claim gift"}
          </button>
          {error && <p className="text-sm text-accent">{error}</p>}
        </form>
      )}
    </div>
  );
}
