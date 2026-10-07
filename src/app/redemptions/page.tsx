import type { Metadata } from "next";
import Link from "next/link";
import DemoBadge from "@/components/DemoBadge";
import RedemptionCard from "@/components/cards/RedemptionCard";
import SectionHeading from "@/components/SectionHeading";
import { site } from "@/config";
import { getLedger } from "@/lib/solana";
import { listPublicRedemptions } from "@/lib/points";

export const metadata: Metadata = { title: `Loot drops — ${site.name}` };
export const revalidate = 30;

export default async function RedemptionsPage() {
  const [{ rows, demo }, ledger] = await Promise.all([
    listPublicRedemptions().catch(() => ({ rows: [], demo: true })),
    getLedger().catch(() => null),
  ]);
  const solBySig = new Map((ledger?.entries ?? []).map((e) => [e.signature, e.sol]));
  const now = Date.now();

  return (
    <div className="section pt-14">
      <SectionHeading
        eyebrow="Loot drops"
        title="Every copy that dropped"
        sub="Open a card for its receipt. Delivered copies link to the Pig Bank's payment on Solscan. Proof or it didn't happen."
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {demo && <DemoBadge />}
        <Link href="/redeem" className="btn-primary !py-2 text-xs">
          Claim yours
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">No loot dropped yet. Be the first.</div>
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <RedemptionCard key={r.id} r={r} now={now} paidSol={r.tx ? solBySig.get(r.tx) : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
