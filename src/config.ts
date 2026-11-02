// ─────────────────────────────────────────────────────────────────────────────
// Project configuration. Addresses & RPC come from environment variables
// (see .env.example); everything else is edited right here.
// ─────────────────────────────────────────────────────────────────────────────

const env = (v: string | undefined) => (v ?? "").trim();

export const TOKEN_MINT = env(process.env.NEXT_PUBLIC_TOKEN_MINT);
export const TREASURY_WALLET = env(process.env.NEXT_PUBLIC_TREASURY_WALLET);
/** The coin's creator wallet (where pump.fun creator fees build up). Public address only. Defaults to the Pig Bank. */
export const CREATOR_WALLET = env(process.env.NEXT_PUBLIC_CREATOR_WALLET) || TREASURY_WALLET;
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
  tagline: "Hold $PIG, stack XP, claim GTA 6. Part of every trading fee goes into a public Pig Bank wallet.",
  /** Public URL, used for share images. Set NEXT_PUBLIC_SITE_URL once you have a custom domain. */
  url:
    env(process.env.NEXT_PUBLIC_SITE_URL) ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  /**
   * Socials. Leave empty and the link is hidden everywhere on the site.
   * xHandle: e.g. "@paidingames"   telegram: group/channel name, e.g. "paidingames"
   */
  xHandle: "",
  telegram: "",
  /** Where the "Buy" button sends people once TOKEN_MINT is set. */
  buyUrl: (mint: string) => `https://jup.ag/swap/SOL-${mint}`,
  explorerTx: (sig: string) => `https://solscan.io/tx/${sig}`,
  explorerAccount: (addr: string) => `https://solscan.io/account/${addr}`,
};

/** Only the socials that are set. Empty list = nothing shown. */
export const socials = [
  ...(site.xHandle ? [{ id: "x" as const, label: site.xHandle, url: `https://x.com/${site.xHandle.replace(/^@/, "")}` }] : []),
  ...(site.telegram
    ? [{ id: "telegram" as const, label: "Telegram", url: `https://t.me/${site.telegram.replace(/^@|^https?:\/\/t\.me\//g, "")}` }]
    : []),
];
export const xSocial = socials.find((s) => s.id === "x");

export const points = {
  /** USD value that must be held for one full day to earn 1 point. */
  usdPerPointDay: 20,
  /** Points needed to redeem one copy. */
  redeemCost: 100,
  /** USD price of one copy — used for the treasury progress bar. */
  gamePriceUsd: 70,
  /** A wallet can redeem a copy for itself at most once per this many days. */
  cooldownDays: 30,
  /** On top of that, gifts + team donations allowed per wallet in the same window. */
  maxDonationsPerWindow: 5,
  /** New redemptions pause while this many are still waiting to be fulfilled. */
  maxPendingRedemptions: 25,
  /** Keep in sync with the schedule in vercel.json. */
  snapshotTime: "00:00 UTC",
  /** `color` is the platform's brand-ish colour, used on the redeem cards. */
  platforms: [
    { id: "ps5", label: "PlayStation 5", color: "#0070D1" },
    { id: "xbox", label: "Xbox Series X|S", color: "#107C10" },
  ],
  regions: ["United States", "Canada", "United Kingdom", "European Union", "Australia / New Zealand", "Other"],
  /** Wallets that never earn points (treasury, LP pools, team, exchanges). */
  excluded: [] as string[],
};

/**
 * Demo mode only: a song that plays when a code appears.
 * youtubeId: the part after "v=" in the YouTube link. start: the second to start at.
 */
export const demoRevealSong = { youtubeId: "pCBWs6wzVgQ", start: 34 };

export type PlatformId = "ps5" | "xbox";
/** Codes are region-locked, so stock is kept per platform + region. */
export const stockKey = (platform: string, region: string) => `${platform}|${region}`;
export const platformLabel = (id: string) => points.platforms.find((p) => p.id === id)?.label ?? id;

/** GTA 6 launch, for the hero countdown. Rockstar's announced date: Nov 19 2026 (local midnight, shown as UTC). */
export const gta6Launch = { iso: "2026-11-19T00:00:00Z", label: "Nov 19, 2026" };

/**
 * Buyback: this share of every creator fee is set aside to buy $PIG back.
 * The site spots buybacks on-chain by itself: any Pig Bank transaction that spends SOL and receives $PIG.
 * burn: true = bought tokens get burned (the site also spots burns from the Pig Bank wallet).
 */
export const buyback = { share: 0.2, burn: true };
