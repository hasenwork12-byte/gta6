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

export type RedemptionStatus = "pending" | "fulfilled" | "rejected";

/** Full record — contains private delivery details, admin-only. */
export type Redemption = {
  id: string;
  wallet: string;
  platform: string;
  region: string;
  email: string;
  cost: number; // points
  createdAt: number; // ms
  status: RedemptionStatus;
  tx: string | null; // purchase transaction, set on fulfilment
  note: string | null;
  demo?: boolean;
};

/** Safe to show publicly. */
export type PublicRedemption = Pick<Redemption, "id" | "wallet" | "platform" | "createdAt" | "status" | "tx"> & {
  demo: boolean;
};

export type PointsInfo = {
  demo: boolean;
  wallet: string;
  tokenBalance: number;
  usdValue: number;
  points: number;
  lastDay: number;
  perDay: number;
  cost: number;
  cooldownUntil: number | null;
  lastSnapshotAt: number | null;
};
