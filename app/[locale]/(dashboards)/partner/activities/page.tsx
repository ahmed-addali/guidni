import { getPartnerActivities } from "@/lib/actions/partner";
import { ActivitiesClient } from "./_components/ActivitiesClient";

export async function generateMetadata() {
  return { title: "Activities · Partner Dashboard" };
}

export default async function PartnerActivitiesPage() {
  const activities = await getPartnerActivities();

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your activity listings.</p>
      </div>
      <ActivitiesClient activities={activities as any} />
    </div>
  );
}
