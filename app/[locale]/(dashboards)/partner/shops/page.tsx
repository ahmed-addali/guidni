import { getMyShops } from "@/lib/actions/partner-shops";
import { ShopsClient } from "./_components/ShopsClient";

export async function generateMetadata() {
  return { title: "Shops · Partner Dashboard" };
}

export default async function PartnerShopsPage() {
  const shops = await getMyShops();
  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Shops</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your shop listings and products.</p>
      </div>
      <ShopsClient shops={shops as never} />
    </div>
  );
}
