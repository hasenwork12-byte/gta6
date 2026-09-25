// Shared by the browser (to sign) and the server (to verify). The server
// rebuilds this exact text from the submitted fields, so nothing can be
// swapped after signing.
import { points, site } from "@/config";

export function buildRedeemMessage(f: { wallet: string; platform: string; region: string; issuedAt: string }) {
  return [
    `${site.name}: redeem ${points.redeemCost} points for one copy of GTA 6.`,
    "",
    `Wallet: ${f.wallet}`,
    `Platform: ${f.platform}`,
    `Region: ${f.region}`,
    `Issued: ${f.issuedAt}`,
    "",
    "Signing is free and does not send a transaction.",
  ].join("\n");
}
