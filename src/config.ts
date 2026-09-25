// ─────────────────────────────────────────────────────────────────────────────
// Project configuration. Addresses & RPC come from environment variables
// (see .env.example); everything else is edited right here.
// ─────────────────────────────────────────────────────────────────────────────

const env = (v: string | undefined) => (v ?? "").trim();

export const TOKEN_MINT = env(process.env.NEXT_PUBLIC_TOKEN_MINT);
export const TREASURY_WALLET = env(process.env.NEXT_PUBLIC_TREASURY_WALLET);
const FORCE_DEMO = env(process.env.NEXT_PUBLIC_FORCE_DEMO) === "true";

/** Treasury data (balance, fees, ledger) is read from chain when this is true. */
export const TREASURY_LIVE = !FORCE_DEMO && TREASURY_WALLET.length > 0;
/** Token data (holders, eligibility) is read from chain when this is true. */
export const TOKEN_LIVE = !FORCE_DEMO && TOKEN_MINT.length > 0;

export const PUBLIC_RPC_URL =
  env(process.env.NEXT_PUBLIC_SOLANA_RPC_URL) || "https://api.mainnet-beta.solana.com";

export const site = {
  name: "Paid In Games",
  ticker: "PIG",
  tagline: "Hold $PIG, earn points, redeem GTA 6. Funded by a public, on-chain treasury.",
  /** Public URL, used for share images. Set NEXT_PUBLIC_SITE_URL once you have a custom domain. */
  url:
    env(process.env.NEXT_PUBLIC_SITE_URL) ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  /** Shown in the top bar, e.g. "@paidingames". Leave empty until the account exists. */
  xHandle: "",
  links: {
    x: "https://x.com/",
    telegram: "https://t.me/",
  },
  /** Where the "Buy" button sends people once TOKEN_MINT is set. */
  buyUrl: (mint: string) => `https://jup.ag/swap/SOL-${mint}`,
  explorerTx: (sig: string) => `https://solscan.io/tx/${sig}`,
  explorerAccount: (addr: string) => `https://solscan.io/account/${addr}`,
};

export const points = {
  /** USD value that must be held for one full day to earn 1 point. */
  usdPerPointDay: 10,
  /** Points needed to redeem one copy. */
  redeemCost: 1000,
  /** USD price of one copy — used for the treasury progress bar. */
  gamePriceUsd: 70,
  /** A wallet can redeem at most once per this many days. */
  cooldownDays: 30,
  /** New redemptions pause while this many are still waiting to be fulfilled. */
  maxPendingRedemptions: 25,
  /** Keep in sync with the schedule in vercel.json. */
  snapshotTime: "00:00 UTC",
  platforms: [
    { id: "ps5", label: "PlayStation 5" },
    { id: "xbox", label: "Xbox Series X|S" },
  ],
  regions: ["United States", "Canada", "United Kingdom", "European Union", "Australia / New Zealand", "Other"],
  /** Wallets that never earn points (treasury, LP pools, team, exchanges). */
  excluded: [] as string[],
};

export type PlatformId = "ps5" | "xbox";
export const platformLabel = (id: string) => points.platforms.find((p) => p.id === id)?.label ?? id;
