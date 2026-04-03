import { getPartnerStays } from "@/lib/actions/partner";
import { StaysClient } from "./_components/StaysClient";

export async function generateMetadata() {
  return { title: "Stays · Partner Dashboard" };
}

export default async function PartnerStaysPage() {
  const stays = await getPartnerStays();

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stays</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your stay listings.</p>
      </div>
      <StaysClient stays={stays as any} />
    </div>
  );
}
