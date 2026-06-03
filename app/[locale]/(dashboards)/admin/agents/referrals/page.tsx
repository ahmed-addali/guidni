import { notFound } from "next/navigation";
import { getAllReferralsAdmin } from "@/lib/actions/admin-agents";
import { ReferralsAdminClient } from "./_components/ReferralsAdminClient";

export async function generateMetadata() {
  return { title: "Agent Referrals — Admin" };
}

export default async function AgentReferralsAdminPage() {
  const referrals = await getAllReferralsAdmin().catch(() => null);
  if (!referrals) notFound();

  return (
    <div className="space-y-6 max-w-screen-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Partner Referrals</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Review and approve referrals submitted by local agents.
        </p>
      </div>

      <ReferralsAdminClient initialReferrals={referrals} />
    </div>
  );
}
