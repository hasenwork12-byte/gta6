"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { PUBLIC_RPC_URL } from "@/config";

export default function WalletProviders({ children }: { children: React.ReactNode }) {
  // Phantom, Solflare, Backpack etc. register themselves via the Wallet
  // Standard, so no explicit adapters are needed.
  const wallets = useMemo(() => [], []);
  return (
    <ConnectionProvider endpoint={PUBLIC_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
