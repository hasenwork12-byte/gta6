import { fmtNum, shortAddr, timeAgo } from "@/lib/format";
import type { LedgerEntry } from "@/lib/types";
import BentoCard from "./BentoCard";

export default function LedgerPreview({ entries, demo, now }: { entries: LedgerEntry[]; demo: boolean; now: number }) {
  const rows = entries.slice(0, 6);
  return (
    <BentoCard label="Ledger" href="/treasury" demo={demo}>
      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No transactions yet.</p>
      ) : (
        <table className="w-full font-mono text-xs">
          <thead className="sr-only">
            <tr>
              <th>Amount</th>
              <th>Type</th>
              <th>Transaction</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.signature} className="border-b border-line/[0.06] last:border-0">
                <td className={`py-2.5 pr-2 ${e.direction === "in" ? "text-good" : "text-accent"}`}>
                  {e.direction === "in" ? "+" : "−"}
                  {fmtNum(e.sol, 3)}
                </td>
                <td className="truncate py-2.5 pr-2 text-fg/80">{e.direction === "in" ? "Fee" : "Purchase"}</td>
                <td className="hidden py-2.5 pr-2 text-muted sm:table-cell">{demo ? "demo" : shortAddr(e.signature, 4)}</td>
                <td className="py-2.5 text-right text-muted">{timeAgo(e.time * 1000, now)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </BentoCard>
  );
}
