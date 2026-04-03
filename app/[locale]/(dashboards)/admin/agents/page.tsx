import { getAllAgentsAdmin } from "@/lib/actions/admin-agents";
import { AgentsAdminClient } from "./_components/AgentsAdminClient";

type Params = Promise<{ locale: string }>;

export const metadata = { title: "Local Agents — Admin · Guidni" };

export default async function AdminAgentsPage({ params }: { params: Params }) {
  const { locale } = await params;
  const agents = await getAllAgentsAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Local Agents</h1>
        <p className="text-sm text-gray-400 mt-1">
          {agents.length} agent profile{agents.length !== 1 ? "s" : ""}
        </p>
      </div>
      <AgentsAdminClient agents={agents} locale={locale} />
    </div>
  );
}
