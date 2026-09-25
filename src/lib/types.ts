export type LedgerEntry = {
  signature: string;
  time: number; // unix seconds
  direction: "in" | "out";
  sol: number;
  counterparty: string | null;
  label: string;
};

export type TreasurySnapshot = {
  demo: boolean;
  treasuryWallet: string;
  balanceSol: number;
  solUsd: number;
  totalFeesSol: number;
  /** true when fee total only covers the most recent N transactions */
  feesPartial: boolean;
  holders: number | null;
  gamesRedeemed: number;
  gamesDelivered: number;
  updatedAt: number;
};

export type Dashboard = { snapshot: TreasurySnapshot; recent: LedgerEntry[] };

/** unclaimed = a gift waiting for its recipient to pick platform/email. */
export type RedemptionStatus = "unclaimed" | "pending" | "fulfilled" | "rejected";

/** self = for the redeemer; gift = for another wallet; team = donated to the team for giveaways/videos. */
export type RedemptionKind = "self" | "gift" | "team";

/** Full record — contains private delivery details, admin-only. */
export type Redemption = {
  id: string;
  /** The wallet whose points were spent. */
  wallet: string;
  /** Missing on records created before gifting existed — treat as "self". */
  kind?: RedemptionKind;
  /** Gift recipient wallet. */
  recipient?: string | null;
  /** Empty until known (team donations; gifts before they're claimed). */
  platform: string;
  region: string;
  email: string;
  cost: number; // points
  createdAt: number; // ms
  claimedAt?: number | null;
  status: RedemptionStatus;
  tx: string | null; // purchase transaction, set on fulfilment
  note: string | null;
  demo?: boolean;
};

/** Safe to show publicly. */
export type PublicRedemption = Pick<Redemption, "id" | "wallet" | "platform" | "createdAt" | "status" | "tx"> & {
  kind: RedemptionKind;
  recipient: string | null;
  demo: boolean;
};

export type GiftToClaim = { id: string; from: string; createdAt: number };

export type PointsInfo = {
  demo: boolean;
  wallet: string;
  tokenBalance: number;
  usdValue: number;
  points: number;
  lastDay: number;
  perDay: number;
  cost: number;
  /** When this wallet can next redeem a copy for itself. */
  cooldownUntil: number | null;
  /** Gifts/team donations made in the current window, and the allowance. */
  donationsUsed: number;
  donationsMax: number;
  /** Copies other wallets gifted to this one, waiting to be claimed. */
  giftsToClaim: GiftToClaim[];
  lastSnapshotAt: number | null;
};
