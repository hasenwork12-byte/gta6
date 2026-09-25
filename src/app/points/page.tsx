import type { Metadata } from "next";
import Link from "next/link";
import DemoBadge from "@/components/DemoBadge";
import PointsChecker from "@/components/PointsChecker";
import SectionHeading from "@/components/SectionHeading";
import { points, site } from "@/config";
import { fmtNum, shortAddr } from "@/lib/format";
import { getTopHolders } from "@/lib/points";

export const metadata: Metadata = { title: `Points — ${site.name}` };
export const revalidate = 60;

export default async function PointsPage() {
  const holders = await getTopHolders(50).catch(() => ({ rows: [], demo: true }));
  return (
    <div className="section pt-14">
      <SectionHeading
        eyebrow="Points"
        title="Check your points"
        sub={`Paste any address or connect your wallet. ${fmtNum(points.redeemCost)} points redeems one copy of GTA 6.`}
      />
      <PointsChecker />

      <div className="mt-16">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Top holders by points</h2>
          {holders.demo && <DemoBadge />}
        </div>
        <div className="card overflow-hidden">
          {holders.rows.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted">No points issued yet — the first award comes at the second daily snapshot.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/[0.07] text-left">
                  <th className="label px-5 py-3.5 font-normal">#</th>
                  <th className="label px-5 py-3.5 font-normal">Wallet</th>
                  <th className="label px-5 py-3.5 text-right font-normal">Points</th>
                  <th className="label hidden px-5 py-3.5 font-normal sm:table-cell">Progress to a copy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/[0.05]">
                {holders.rows.map((h, i) => {
                  const pct = Math.min(100, (h.points / points.redeemCost) * 100);
                  return (
                    <tr key={h.wallet} className="hover:bg-line/[0.02]">
                      <td className="px-5 py-3 font-mono text-xs text-muted">{i + 1}</td>
                      <td className="px-5 py-3 font-mono text-xs">
                        {holders.demo ? (
                          shortAddr(h.wallet, 5)
                        ) : (
                          <a className="hover:text-accent2" href={site.explorerAccount(h.wallet)} target="_blank" rel="noreferrer">
                            {shortAddr(h.wallet, 5)}
                          </a>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-mono">{fmtNum(h.points, 1)}</td>
                      <td className="hidden px-5 py-3 sm:table-cell">
                        <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-line/[0.07]">
                          <div className={`h-full rounded-full ${pct >= 100 ? "bg-good" : "bg-gradient-to-r from-accent to-accent2"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <p className="mt-4 text-xs text-muted">
          Points have no cash value. See <Link href="/how-it-works" className="link">how points are earned</Link>.
        </p>
      </div>
    </div>
  );
}
