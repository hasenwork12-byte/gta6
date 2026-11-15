import type { BotRun } from "./botlog";
import type { BuybackPoint, DailyPoint, LedgerEntry } from "./types";

export const ANALYTICS_DAYS = 14;
const DAY = 86400;

/**
 * Last `days` UTC days of fees claimed, $PIG burned and SOL spent on games.
 * Fees come from the bot's claim log when the bot runs (it sees every claim),
 * otherwise from fees arriving in the Pig Bank. Burns come from the merged
 * buyback history (a buyback counts once its burn tx exists). Pure.
 */
export function dailySeries(
  entries: LedgerEntry[],
  history: BuybackPoint[],
  burn: boolean,
  now: number,
  botRuns?: BotRun[] | null,
  days = ANALYTICS_DAYS,
): DailyPoint[] {
  const today = Math.floor(now / DAY) * DAY;
  const start = today - (days - 1) * DAY;
  const out: DailyPoint[] = Array.from({ length: days }, (_, i) => ({ day: start + i * DAY, feesSol: 0, burnSol: 0, burnTokens: 0, gamesSol: 0 }));
  const at = (t: number) => {
    const i = Math.floor((t - start) / DAY);
    return i >= 0 && i < days ? out[i] : null;
  };

  const claims = botRuns?.filter((r) => r.claimedSol) ?? [];
  if (claims.length) for (const r of claims) { const d = at(r.at); if (d) d.feesSol += r.claimedSol!; }
  else for (const e of entries) if (e.kind === "fee") { const d = at(e.time); if (d) d.feesSol += e.sol; }

  for (const e of entries) if (e.kind === "game") { const d = at(e.time); if (d) d.gamesSol += e.sol; }

  for (const h of history) {
    if (burn && !h.burnTx) continue;
    const d = at(h.time);
    if (d) { d.burnSol += h.sol; d.burnTokens += h.tokens; }
  }
  return out;
}

/** SOL spent on buybacks that have been burned (all of them when burning is off). */
export const burnedSol = (history: BuybackPoint[], burn: boolean) => history.filter((h) => !burn || h.burnTx).reduce((a, h) => a + h.sol, 0);

export const gamesSpentSol = (entries: LedgerEntry[]) => entries.filter((e) => e.kind === "game").reduce((a, e) => a + e.sol, 0);
