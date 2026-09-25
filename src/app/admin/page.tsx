import type { Metadata } from "next";
import AdminPanel from "@/components/AdminPanel";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <div className="section pt-14">
      <p className="label">Admin</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Redemption queue</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Buy the code from a retailer, pay from the treasury wallet, paste that transaction signature here and mark it
        fulfilled — then email the code. Rejecting returns the points to the wallet.
      </p>
      <div className="mt-8">
        <AdminPanel />
      </div>
    </div>
  );
}
