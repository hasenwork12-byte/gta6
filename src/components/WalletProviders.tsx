"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import type { WalletError } from "@solana/wallet-adapter-base";
import "@solana/wallet-adapter-react-ui/styles.css";
import { PUBLIC_RPC_URL } from "@/config";

/** Plain-words version of a wallet error, shown to the visitor. */
function describe(error: WalletError) {
  const detail = (error.message || (error.error as Error | undefined)?.message || "").trim();
  switch (error.name) {
    case "WalletNotReadyError":
      return "No Solana wallet found in this browser. Install Phantom (phantom.com), then reload this page.";
    case "WalletConnectionError":
    case "WalletWindowClosedError":
    case "WalletWindowBlockedError":
      return /reject|denied|cancel|closed/i.test(detail)
        ? "The connection was cancelled in your wallet. Press Select Wallet and approve it in the wallet popup."
        : `Your wallet couldn't connect${detail ? `: ${detail}` : ""}. Unlock your wallet and try again.`;
    default:
      return `Wallet error${detail ? `: ${detail}` : ` (${error.name})`}. Unlock your wallet and try again.`;
  }
}

export default function WalletProviders({ children }: { children: React.ReactNode }) {
  // Phantom, Solflare, Backpack etc. register themselves via the Wallet
  // Standard, so no explicit adapters are needed.
  const wallets = useMemo(() => [], []);
  const [message, setMessage] = useState<string | null>(null);

  // Without this the adapter silently drops back to "Select Wallet" when a connect fails.
  const onError = useCallback((error: WalletError) => {
    console.error("wallet", error.name, error.message, error.error);
    setMessage(describe(error));
  }, []);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), 9000);
    return () => window.clearTimeout(id);
  }, [message]);

  return (
    <ConnectionProvider endpoint={PUBLIC_RPC_URL}>
      {/* autoConnect: picking a wallet in the modal connects straight away (no extra "Connect" click),
          and a wallet that already approved this site reconnects on the next visit. */}
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
      {message && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-24 z-[1100] mx-auto max-w-md rounded-2xl border border-accent/40 bg-[#1a0f22]/95 p-4 text-sm leading-relaxed text-white shadow-[0_10px_40px_rgb(0_0_0/0.5)] backdrop-blur lg:bottom-6"
        >
          <div className="flex items-start gap-3">
            <p className="flex-1">{message}</p>
            <button onClick={() => setMessage(null)} className="text-white/60 hover:text-white" aria-label="Dismiss">
              ✕
            </button>
          </div>
        </div>
      )}
    </ConnectionProvider>
  );
}
