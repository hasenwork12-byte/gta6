// Shared by the browser (to sign) and the server (to verify). The server
// rebuilds this exact text from the submitted fields, so nothing can be
// swapped after signing.
import { points, site } from "@/config";
import type { RedemptionKind } from "./types";

const FOOTER = "Signing is free and does not send a transaction.";

export function buildRedeemMessage(f: {
  wallet: string;
  kind: RedemptionKind;
  recipient?: string;
  platform?: string;
  region?: string;
  issuedAt: string;
}) {
  const lines = [`${site.name}: redeem ${points.redeemCost} points for one copy of GTA 6.`, "", `Wallet: ${f.wallet}`];
  if (f.kind === "self") lines.push("For: myself", `Platform: ${f.platform}`, `Region: ${f.region}`);
  if (f.kind === "gift") lines.push(`For: gift to ${f.recipient}`);
  if (f.kind === "team") lines.push(`For: donation to the ${site.name} team (community giveaways and videos)`);
  lines.push(`Issued: ${f.issuedAt}`, "", FOOTER);
  return lines.join("\n");
}

export function buildClaimMessage(f: { id: string; wallet: string; platform: string; region: string; issuedAt: string }) {
  return [
    `${site.name}: claim gifted copy of GTA 6.`,
    "",
    `Gift: ${f.id}`,
    `Wallet: ${f.wallet}`,
    `Platform: ${f.platform}`,
    `Region: ${f.region}`,
    `Issued: ${f.issuedAt}`,
    "",
    FOOTER,
  ].join("\n");
}
