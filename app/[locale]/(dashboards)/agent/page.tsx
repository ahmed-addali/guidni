import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FiSend,
  FiTrendingUp,
  FiUsers,
  FiGift,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
} from "react-icons/fi";
import { getAgentDashboardStats } from "@/lib/actions/agent";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AgentTierBadge } from "@/components/agent/AgentTierBadge";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  return { title: "Agent Dashboard" };
}

export default async function AgentOverviewPage({ params }: { params: Params }) {
  const { locale } = await params;
  const stats = await getAgentDashboardStats();
  if (!stats) notFound();

  const { profile, totalInvitations, pendingInvitations, bookedInvitations, conversionRate, confirmedEarnings, pendingEarnings, recentInvitations, referralCount } = stats;

  return (
    <div className="space-y-8 max-w-screen-lg">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile.pseudonym ? `@${profile.pseudonym}` : profile.displayName}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s your agent activity at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <AgentTierBadge tier={profile.tier} />
          <Link
            href={`/${locale}/agent/new-invitation`}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <FiSend className="h-3.5 w-3.5" />
            Send invitation
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total invitations"
          value={totalInvitations}
          icon={<FiSend className="h-5 w-5 text-primary" />}
        />
        <StatCard
          label="Conversion rate"
          value={`${conversionRate}%`}
          sub={`${bookedInvitations} booked`}
          icon={<FiTrendingUp className="h-5 w-5 text-green-600" />}
        />
        <StatCard
          label="Confirmed earnings"
          value={`${confirmedEarnings.toFixed(2)} TND`}
          sub={pendingEarnings > 0 ? `+ ${pendingEarnings.toFixed(2)} TND pending` : undefined}
          icon={<FiCheckCircle className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          label="Points balance"
          value={`${profile.points} pts`}
          sub={`≈ ${(profile.points * 0.5).toFixed(2)} TND`}
          icon={<FiGift className="h-5 w-5 text-amber-500" />}
        />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Partner referrals</p>
          <p className="text-2xl font-bold text-gray-900">{referralCount}</p>
          <Link href={`/${locale}/agent/referrals`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            View details <FiArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Pending invitations</p>
          <p className="text-2xl font-bold text-gray-900">{pendingInvitations}</p>
          <Link href={`/${locale}/agent/invitations`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            View all <FiArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total earned (all time)</p>
          <p className="text-2xl font-bold text-gray-900">{Number(profile.totalEarned).toFixed(2)} TND</p>
          <Link href={`/${locale}/agent/earnings`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            View earnings <FiArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Recent invitations */}
      <div className="bg-white border border-gray-100 rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Recent invitations</h2>
          <Link href={`/${locale}/agent/invitations`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            All invitations <FiArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentInvitations.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FiClock className="h-8 w-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No invitations yet.</p>
            <Link
              href={`/${locale}/agent/new-invitation`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
            >
              <FiSend className="h-3.5 w-3.5" />
              Send your first invitation
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    <FiSend className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {inv.touristEmail || inv.touristPhone || "Tourist"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {inv.listingType} · {new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <InvitationStatusBadge status={inv.status} />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function InvitationStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING:   { label: "Pending",   className: "bg-yellow-50 text-yellow-700 border-yellow-100" },
    OPENED:    { label: "Opened",    className: "bg-blue-50 text-blue-700 border-blue-100" },
    BOOKED:    { label: "Booked",    className: "bg-green-50 text-green-700 border-green-100" },
    EXPIRED:   { label: "Expired",   className: "bg-gray-50 text-gray-500 border-gray-100" },
    CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-600 border-red-100" },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.className}`}>
      {s.label}
    </span>
  );
}
