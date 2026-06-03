import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyGuideProfile, getMyGuidePlans } from "@/lib/actions/partner-guides";
import { getGuideRequests } from "@/lib/actions/plan-requests";
import { getDestinations } from "@/lib/actions/destinations";
import { RequestsClient } from "./_components/RequestsClient";

type Params = Promise<{ locale: string }>;

export const metadata = { title: "Custom Requests — Guidni Partner" };

export default async function GuideRequestsPage({ params }: { params: Params }) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/${locale}/login`);

  const profile = await getMyGuideProfile();
  if (!profile) redirect(`/${locale}/partner/guide/profile`);

  const [requests, plans, destinations] = await Promise.all([
    getGuideRequests(),
    getMyGuidePlans(),
    getDestinations(),
  ]);

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6 max-w-screen-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Requests</h1>
          <p className="text-sm text-gray-400 mt-1">
            {requests.length} request{requests.length !== 1 ? "s" : ""}
            {pendingCount > 0 ? ` · ${pendingCount} awaiting response` : ""}
          </p>
        </div>
      </div>

      <RequestsClient
        requests={requests}
        locale={locale}
        plans={plans.map((p) => ({
          id:       p.id,
          title:    p.title,
          duration: p.duration,
          city:     p.destination?.city ?? null,
        }))}
        destinations={destinations}
        defaultDestinationId={profile.destination?.id}
      />
    </div>
  );
}
