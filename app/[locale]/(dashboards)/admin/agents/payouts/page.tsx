import { notFound } from "next/navigation";
import { getPendingPayoutsAdmin } from "@/lib/actions/admin-agents";
import { PayoutsAdminClient } from "./_components/PayoutsAdminClient";

export async function generateMetadata() {
  return { title: "Agent Payouts — Admin" };
}

export default async function AgentPayoutsAdminPage() {
  const data = await getPendingPayoutsAdmin().catch(() => null);
  if (!data) notFound();

  return (
    <div className="space-y-6 max-w-screen-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Payouts</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage earnings payout requests and points redemptions.
        </p>
      </div>

      <PayoutsAdminClient
        earningPayouts={data.earningPayouts}
        redemptions={data.redemptions}
      />
    </div>
  );
}
