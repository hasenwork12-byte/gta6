"use client";

import { useState } from "react";
import { shortAddr } from "@/lib/format";

export default function CopyAddress({ address, label = "CA" }: { address: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  if (!address) {
    return (
      <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-dashed border-accent2/30 bg-accent2/[0.04] px-4 py-2 font-mono text-xs text-muted">
        <span className="text-fg/60">{label}</span>
        <span className="truncate">Oink soon. The contract address drops here at launch.</span>
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <button
      onClick={copy}
      className="group inline-flex max-w-full items-center gap-3 rounded-full border border-line/15 bg-line/[0.03] py-2 pl-4 pr-2 font-mono text-xs transition hover:border-line/30"
      aria-label={`Copy contract address ${address}`}
    >
      <span className="text-muted">{label}</span>
      <span className="truncate sm:hidden">{shortAddr(address, 6)}</span>
      <span className="hidden truncate sm:inline">{address}</span>
      <span
        className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider transition ${
          copied ? "bg-good/20 text-good" : "bg-line/[0.08] text-fg group-hover:bg-line/[0.14]"
        }`}
      >
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
