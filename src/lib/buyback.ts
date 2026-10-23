import { buyback } from "@/config";
import type { BuybackSummary, LedgerEntry } from "./types";

/** Buyback totals from ledger rows. Pure, so demo and live data share it. */
export function summarizeBuybacks(entries: LedgerEntry[], feesSol: number, supply: number | null, partial: boolean): BuybackSummary {
  const buys = entries.filter((e) => e.kind === "buyback").sort((a, b) => a.time - b.time);
  const solSpent = buys.reduce((a, e) => a + e.sol, 0);
  return {
    share: buyback.share,
    burn: buyback.burn,
    solSpent,
    tokensBought: buys.reduce((a, e) => a + (e.tokens ?? 0), 0),
    tokensBurned: entries.filter((e) => e.kind === "burn").reduce((a, e) => a + (e.tokens ?? 0), 0),
    owedSol: Math.max(0, feesSol * buyback.share - solSpent),
    supply,
    history: buys.map((e) => ({ time: e.time, sol: e.sol, tokens: e.tokens ?? 0, signature: e.signature })),
    partial,
  };
}

/** SOL in the pig that's free for games: the balance minus what's owed to buybacks. */
export const gamesSol = (balanceSol: number, owedSol: number) => Math.max(0, balanceSol - owedSol);
