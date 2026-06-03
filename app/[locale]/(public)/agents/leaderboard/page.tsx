import Link from "next/link";
import { FiAward } from "react-icons/fi";
import { prisma } from "@/lib/db";
import { AgentTierBadge } from "@/components/agent/AgentTierBadge";

export const revalidate = 86400; // daily

export async function generateMetadata() {
  return { title: "Top Local Agents — Guidni" };
}

type Params = Promise<{ locale: string }>;

export default async function AgentLeaderboardPage({ params }: { params: Params }) {
  const { locale } = await params;

  const agents = await prisma.agentProfile.findMany({
    where:   { isVerified: true, isActive: true },
    select: {
      id:          true,
      displayName: true,
      pseudonym:   true,
      tier:        true,
      totalEarned: true,
      destination: { select: { city: true } },
      _count:      { select: { invitations: true } },
    },
    orderBy: { totalEarned: "desc" },
    take:    20,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-full px-4 py-1.5 mb-2">
          <FiAward className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Leaderboard</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Top Local Agents</h1>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Our most active verified agents — trusted local experts helping tourists discover Guidni destinations.
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-400">No verified agents yet. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {agents.map((agent, i) => {
            const name  = agent.pseudonym ? `@${agent.pseudonym}` : `Agent #${agent.id.slice(-4).toUpperCase()}`;
            const city  = agent.destination?.city ?? "—";
            const rank  = i + 1;
            const isTop = rank <= 3;

            return (
              <Link
                key={agent.id}
                href={agent.pseudonym ? `/${locale}/agents/${agent.pseudonym}` : "#"}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all hover:shadow-sm ${
                  rank === 1 ? "bg-amber-50 border-amber-200" :
                  rank === 2 ? "bg-gray-50 border-gray-200" :
                  rank === 3 ? "bg-orange-50 border-orange-200" :
                  "bg-white border-gray-100 hover:border-gray-200"
                }`}
              >
                <span className={`text-xl font-bold w-8 text-center shrink-0 ${
                  rank === 1 ? "text-amber-500" :
                  rank === 2 ? "text-gray-400" :
                  rank === 3 ? "text-orange-400" :
                  "text-gray-300"
                }`}>
                  {isTop ? ["🥇","🥈","🥉"][rank - 1] : rank}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{name}</p>
                    <AgentTierBadge tier={agent.tier} size="sm" />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{city}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">{agent._count.invitations}</p>
                  <p className="text-xs text-gray-400">bookings</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        Rankings update daily · Showing verified active agents only
      </p>
    </div>
  );
}
