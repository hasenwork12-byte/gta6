import { points } from "@/config";
import { fmtNum, fmtUsd } from "@/lib/format";
import BentoCard from "./BentoCard";

const rules: [string, string][] = [
  ["snapshot", `daily · ${points.snapshotTime}`],
  ["rate", `1 pt = ${fmtUsd(points.usdPerPointDay, 0)} × 1 day`],
  ["balance", "min(prev, now)"],
  ["price", "min(prev, now)"],
  ["redeem", `${fmtNum(points.redeemCost)} pts → 1 copy`],
  ["platforms", "PS5 · Xbox Series X|S"],
  ["for self", `1 per ${points.cooldownDays} days`],
  ["gift/donate", `${points.maxDonationsPerWindow} per ${points.cooldownDays} days`],
  ["queue cap", `${points.maxPendingRedemptions} pending`],
];

/** Compact, technical summary of the rules. */
export default function RulesPreview() {
  return (
    <BentoCard label="How it works" href="/how-it-works">
      <table className="w-full font-mono text-xs">
        <caption className="sr-only">Points and redemption rules</caption>
        <tbody>
          {rules.map(([k, v]) => (
            <tr key={k} className="border-b border-line/[0.06] last:border-0">
              <th scope="row" className="py-2 pr-3 text-left font-normal text-muted">
                {k}
              </th>
              <td className="py-2 text-right">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </BentoCard>
  );
}
