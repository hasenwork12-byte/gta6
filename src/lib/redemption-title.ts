import type { PublicRedemption } from "./types";

// Shared by server and client components, so it can't live in a "use client" file.
const shortPlatform = (p: string) => (p === "ps5" ? "PS5" : p === "xbox" ? "Xbox" : "");

export function redemptionTitle(r: PublicRedemption) {
  if (r.kind === "team") return "Team donation";
  if (r.kind === "gift") return `Gift · ${shortPlatform(r.platform) || "awaiting claim"}`;
  return `GTA 6 · ${shortPlatform(r.platform)}`;
}
