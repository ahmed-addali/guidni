import { getAdminPlanPurchases } from "@/lib/actions/admin-guides";
import { GuidePurchasesClient } from "./_components/GuidePurchasesClient";

export const metadata = { title: "Guide Purchases — Admin · Guidni" };

type Params = Promise<{ locale: string }>;

export default async function AdminGuidePurchasesPage({ params }: { params: Params }) {
  const purchases = await getAdminPlanPurchases();

  const totalRevenue = purchases.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guide Purchases</h1>
          <p className="text-sm text-gray-400 mt-1">
            {purchases.length} purchase{purchases.length !== 1 ? "s" : ""}
            {purchases.length > 0 ? ` · TND ${totalRevenue} gross` : ""}
          </p>
        </div>
      </div>

      <GuidePurchasesClient purchases={purchases} />
    </div>
  );
}
