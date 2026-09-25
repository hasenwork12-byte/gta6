import type { Metadata } from "next";
import AdminPanel from "@/components/AdminPanel";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <div className="section pt-14">
      <p className="label">Admin</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Redemption queue</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Buy codes from a retailer, paying from the treasury wallet, then add them under Code stock with that purchase
        transaction. Codes are encrypted and delivered automatically: instantly to new requests, and oldest-first to
        anyone waiting. For team donations, take a code from stock below. &quot;Mark fulfilled&quot; is only for copies you
        delivered outside the site. Rejecting returns the points to the wallet.
      </p>
      <div className="mt-8">
        <AdminPanel />
      </div>
    </div>
  );
}
