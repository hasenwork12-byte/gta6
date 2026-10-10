"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { platformLabel } from "@/config";
import { fmtDate } from "@/lib/format";
import { buildRevealMessage } from "@/lib/redeem-message";
import type { MyCode } from "@/lib/types";
import RevealedCode from "./RevealedCode";
import { signAndPost } from "./signAndPost";

/** The connected wallet's copies: queued, or ready to reveal (wallet signature required). */
export default function MyCodes({ codes }: { codes: MyCode[] }) {
  if (codes.length === 0) return null;
  return (
    <div>
      <p className="label mb-3">Your codes</p>
      <ul className="space-y-3">
        {codes.map((c) => (
          <CodeRow key={c.id} c={c} />
        ))}
      </ul>
    </div>
  );
}

function CodeRow({ c }: { c: MyCode }) {
  const { publicKey, signMessage } = useWallet();
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reveal = async () => {
    const wallet = publicKey?.toBase58();
    if (!wallet) return;
    setBusy(true);
    setError(null);
    try {
      const issuedAt = new Date().toISOString();
      const res = (await signAndPost(signMessage, "/api/reveal", buildRevealMessage({ id: c.id, wallet, issuedAt }), {
        id: c.id,
        wallet,
        issuedAt,
      })) as unknown as { code: string };
      setCode(res.code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reveal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-xl border border-line/[0.08] bg-bg/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">
            GTA 6 · {platformLabel(c.platform)} {c.kind === "gift" && <span className="text-muted">(gift)</span>}
          </p>
          <p className="font-mono text-xs text-muted">
            {c.region} · {fmtDate(c.createdAt / 1000)}
          </p>
        </div>
        {c.status === "pending" ? (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-amber-300">
            In queue · waiting for stock
          </span>
        ) : c.hasCode ? (
          !code && (
            <button onClick={reveal} disabled={busy} className="btn-primary !py-1.5 text-xs">
              {busy ? "Sign in wallet…" : c.revealed ? "Show code again" : "Reveal code"}
            </button>
          )
        ) : (
          <span className="text-xs text-muted">Delivered by the team</span>
        )}
      </div>
      {code && <RevealedCode code={code} />}
      {code && (
        <p className="mt-2 text-[11px] text-muted">
          Redeem it in the {c.platform === "ps5" ? "PlayStation Store" : "Microsoft Store"} for your region. Keep it private.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-accent">{error}</p>}
    </li>
  );
}
