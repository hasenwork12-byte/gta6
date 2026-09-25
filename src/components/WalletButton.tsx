"use client";

import dynamic from "next/dynamic";

// Wallet button reads browser-only state; skip SSR to avoid hydration mismatch.
const WalletButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false, loading: () => <span className="btn-ghost">Connect wallet</span> },
);

export default WalletButton;
