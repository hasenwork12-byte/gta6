import { buyback } from "@/config";
import type { BotRun, BotTotals } from "./botlog";
import type { BuybackPoint, BuybackSummary, LedgerEntry } from "./types";

/** A burn within this long after a buyback is treated as that buyback's burn. */
const BURN_PAIR_SEC = 3 * 3600;

type BotData = { runs: BotRun[]; totals: BotTotals; sameWallet: boolean };

/**
 * Buyback totals. Two sources, merged and de-duplicated by swap tx:
 *  - the Pig Bank ledger (buybacks done by hand from the Pig Bank wallet),
 *  - the fee bot's log (automatic buybacks, with their burn tx ids).
 * Pure, so demo and live data share it.
 */
export function summarizeBuybacks(
  entries: LedgerEntry[],
  feesSol: number,
  supply: number | null,
  partial: boolean,
  bot?: BotData,
): BuybackSummary {
  const ledgerBurns = entries.filter((e) => e.kind === "burn").sort((a, b) => a.time - b.time);
  const fromLedger: BuybackPoint[] = entries
    .filter((e) => e.kind === "buyback")
    .map((e) => ({
      time: e.time,
      sol: e.sol,
      tokens: e.tokens ?? 0,
      signature: e.signature,
      burnTx: ledgerBurns.find((b) => b.time >= e.time && b.time - e.time <= BURN_PAIR_SEC)?.signature,
    }));

  const fromBot: BuybackPoint[] = (bot?.runs ?? [])
    .filter((r) => r.swapTx)
    .map((r) => ({ time: r.at, sol: r.buybackSol ?? 0, tokens: r.tokensBought ?? 0, signature: r.swapTx!, burnTx: r.burnTx, bot: true }));
  const botSigs = new Set(fromBot.map((p) => p.signature));
  const history = [...fromBot, ...fromLedger.filter((p) => !botSigs.has(p.signature))].sort((a, b) => a.time - b.time);

  const botBurnSigs = new Set((bot?.runs ?? []).map((r) => r.burnTx).filter(Boolean));
  const tokensBurned =
    (bot?.totals.tokensBurned ?? 0) + ledgerBurns.filter((b) => !botBurnSigs.has(b.signature)).reduce((a, e) => a + (e.tokens ?? 0), 0);

  const solSpent = history.reduce((a, p) => a + p.sol, 0);
  // Bot burns: lifetime tokens burned at their average buy cost (its run list is trimmed, the totals aren't).
  const t = bot?.totals;
  const botBurnedSol = t && t.tokensBought > 0 ? (t.tokensBurned * t.buybackSol) / t.tokensBought : 0;
  const ledgerBurnedSol = history.filter((p) => !p.bot && (!buyback.burn || p.burnTx)).reduce((a, p) => a + p.sol, 0);
  // With the bot, it tracks what's owed itself; otherwise owed = share of fees seen minus what's been spent.
  const owedSol = bot ? bot.totals.owedSol : Math.max(0, feesSol * buyback.share - solSpent);
  return {
    share: buyback.share,
    burn: buyback.burn,
    solSpent,
    tokensBought: history.reduce((a, p) => a + p.tokens, 0),
    tokensBurned,
    burnedSol: buyback.burn ? botBurnedSol + ledgerBurnedSol : solSpent,
    owedSol,
    reservedSol: bot && !bot.sameWallet ? 0 : owedSol,
    supply,
    history,
    partial: partial && !bot,
  };
}

/** SOL in the pig that's free for games: the balance minus what's held back for buybacks. */
export const gamesSol = (balanceSol: number, reservedSol: number) => Math.max(0, balanceSol - reservedSol);
