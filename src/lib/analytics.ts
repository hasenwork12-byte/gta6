import type { BotDay } from "./botlog";
import type { BuybackPoint, DailyPoint, LedgerEntry } from "./types";

export const ANALYTICS_DAYS = 14;
const DAY = 86400;

/** Unix seconds at 00:00 UTC for each of the last `days` days, oldest first. */
export function dayStarts(now: number, days = ANALYTICS_DAYS) {
  const today = Math.floor(now / DAY) * DAY;
  return Array.from({ length: days }, (_, i) => today - (days - 1 - i) * DAY);
}

/**
 * Last 14 UTC days of fees claimed, $PIG burned and GTA 6 copies delivered. Pure.
 *  - With the fee bot, fees and its burns come from its per-day sums (kept for
 *    good, unlike the trimmed run list). Without it, from the Pig Bank ledger.
 *  - Burns done by hand from the Pig Bank are added from the ledger either way.
 *  - Games come from delivery times of fulfilled claims.
 */
export function dailySeries(
  starts: number[],
  entries: LedgerEntry[],
  history: BuybackPoint[],
  burn: boolean,
  deliveredAt: number[],
  botDays?: BotDay[] | null,
): DailyPoint[] {
  const out: DailyPoint[] = starts.map((day, i) => ({
    day,
    feesSol: botDays?.[i].claimedSol ?? 0,
    burnSol: botDays?.[i].burnSol ?? 0,
    burnTokens: botDays?.[i].burnTokens ?? 0,
    games: 0,
  }));
  const at = (t: number) => {
    const i = Math.floor((t - starts[0]) / DAY);
    return i >= 0 && i < out.length ? out[i] : null;
  };

  if (!botDays) for (const e of entries) if (e.kind === "fee") { const d = at(e.time); if (d) d.feesSol += e.sol; }

  for (const h of history) {
    if (h.bot && botDays) continue;
    if (burn && !h.burnTx) continue;
    const d = at(h.time);
    if (d) { d.burnSol += h.sol; d.burnTokens += h.tokens; }
  }

  for (const t of deliveredAt) { const d = at(t); if (d) d.games += 1; }
  return out;
}
