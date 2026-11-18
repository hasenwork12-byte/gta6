"use client";

import { Gift } from "lucide-react";
import { FormEvent, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { fmtDate, shortAddr } from "@/lib/format";
import { buildClaimMessage } from "@/lib/redeem-message";
import type { GiftToClaim } from "@/lib/types";
import DeliveryFields from "./DeliveryFields";
import { signAndPost } from "./signAndPost";

/** Shown when another wallet has gifted a copy to the connected wallet. */
export default function ClaimGift({
  gift,
  stock,
  onClaimed,
}: {
  gift: GiftToClaim;
  stock: Record<string, number>;
  onClaimed: () => void;
}) {
  const { publicKey, signMessage } = useWallet();
  const [platform, setPlatform] = useState("");
  const [region, setRegion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const wallet = publicKey?.toBase58();
    if (!wallet) return;
    setBusy(true);
    setError(null);
    try {
      const issuedAt = new Date().toISOString();
      const message = buildClaimMessage({ id: gift.id, wallet, platform, region, issuedAt });
      await signAndPost(signMessage, "/api/claim", message, { id: gift.id, wallet, platform, region, issuedAt });
      onClaimed(); // the gift moves to "Your codes" (ready to reveal, or queued)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-good/30 bg-good/[0.06] p-5">
      <p className="flex items-center gap-2 text-lg font-medium">
        <Gift className="h-5 w-5 shrink-0 text-accent" aria-hidden />
        You&apos;ve been gifted a copy of GTA 6
      </p>
      <p className="mt-1 font-mono text-xs text-muted">
        From {shortAddr(gift.from, 5)} · {fmtDate(gift.createdAt / 1000)}
      </p>
      <form onSubmit={submit} className="mt-5 space-y-5">
        <DeliveryFields
          idPrefix={`claim-${gift.id}`}
          stock={stock}
          platform={platform}
          setPlatform={setPlatform}
          region={region}
          setRegion={setRegion}
        />
        <button className="btn-primary w-full" disabled={busy || !platform || !region}>
          {busy ? "Waiting for signature…" : "Sign & claim gift"}
        </button>
        {error && <p className="text-sm text-accent">{error}</p>}
      </form>
    </div>
  );
}
