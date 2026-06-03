import Link from "next/link";
import { getPlannerStats } from "@/lib/actions/admin-guides";
import { FiMap, FiEye, FiUsers, FiAward, FiBookOpen, FiStar } from "react-icons/fi";

export const metadata = { title: "Planner Stats — Admin · Guidni" };

type Params = Promise<{ locale: string }>;

export default async function AdminPlannerPage({ params }: { params: Params }) {
  const { locale } = await params;
  const stats = await getPlannerStats();

  const planTypeLabel: Record<string, { label: string; color: string }> = {
    USER_SAVED:  { label: "AI Plan",   color: "bg-blue-50 text-blue-700" },
    GUIDE_FREE:  { label: "Free Guide", color: "bg-green-50 text-green-700" },
    GUIDE_PAID:  { label: "Paid Guide", color: "bg-amber-50 text-amber-700" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planner Stats</h1>
        <p className="text-sm text-gray-400 mt-1">AI Planner usage and Local Guides marketplace overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Plans",    value: stats.totals.plans,       icon: FiMap,      color: "text-primary",    bg: "bg-primary/8"   },
          { label: "AI Plans",       value: stats.totals.userSaved,   icon: FiBookOpen, color: "text-blue-600",   bg: "bg-blue-50"     },
          { label: "Free Guide Plans",value: stats.totals.guideFree,  icon: FiAward,    color: "text-green-600",  bg: "bg-green-50"    },
          { label: "Paid Guide Plans",value: stats.totals.guidePaid,  icon: FiStar,     color: "text-amber-600",  bg: "bg-amber-50"    },
          { label: "Total Views",    value: stats.totals.totalViews,  icon: FiEye,      color: "text-gray-600",   bg: "bg-gray-100"    },
          { label: "Total Guides",   value: stats.guides.total,       icon: FiUsers,    color: "text-violet-600", bg: "bg-violet-50"   },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plans by destination */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Top Destinations by Plan Count</h2>
          {stats.topDestinations.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.topDestinations.map((dest) => {
                const pct = stats.totals.plans > 0
                  ? Math.round((dest.count / stats.totals.plans) * 100)
                  : 0;
                return (
                  <div key={dest.city} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{dest.city}</span>
                      <span className="text-gray-400">{dest.count} plans</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Guide stats */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Local Guides Overview</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total",    value: stats.guides.total    },
              { label: "Verified", value: stats.guides.verified },
              { label: "Featured", value: stats.guides.featured },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xl font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="pt-2 flex gap-3">
            <Link
              href={`/${locale}/admin/guides`}
              className="text-sm text-primary hover:underline"
            >
              Manage guides →
            </Link>
            <Link
              href={`/${locale}/admin/guide-plans`}
              className="text-sm text-primary hover:underline"
            >
              Manage guide plans →
            </Link>
          </div>
        </div>
      </div>

      {/* Most viewed plans */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Most Viewed Public Plans</h2>
        {stats.topPlans.length === 0 ? (
          <p className="text-sm text-gray-400">No public plans yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-3 font-medium">Plan</th>
                  <th className="text-left pb-3 font-medium">Type</th>
                  <th className="text-left pb-3 font-medium">Destination</th>
                  <th className="text-left pb-3 font-medium">Guide</th>
                  <th className="text-right pb-3 font-medium">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.topPlans.map((plan) => {
                  const typeInfo = planTypeLabel[plan.planType] ?? { label: plan.planType, color: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/${locale}/planner/${plan.id}`}
                          className="font-medium text-gray-800 hover:text-primary transition-colors"
                          target="_blank"
                        >
                          {plan.title ?? `${plan.duration}-Day Plan`}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{plan.destination?.city ?? "—"}</td>
                      <td className="py-3 pr-4 text-gray-500">
                        {plan.guide ? (
                          <Link
                            href={`/${locale}/planner/guides/${plan.guide.slug}`}
                            className="hover:text-primary transition-colors"
                            target="_blank"
                          >
                            {plan.guide.displayName}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-700">
                        {(plan.viewCount ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent plans */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Recently Created Plans</h2>
        {stats.recentPlans.length === 0 ? (
          <p className="text-sm text-gray-400">No plans yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-3 font-medium">Plan</th>
                  <th className="text-left pb-3 font-medium">Type</th>
                  <th className="text-left pb-3 font-medium">Destination</th>
                  <th className="text-left pb-3 font-medium">Created by</th>
                  <th className="text-right pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentPlans.map((plan) => {
                  const typeInfo = planTypeLabel[plan.planType] ?? { label: plan.planType, color: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/${locale}/planner/${plan.id}`}
                          className="font-medium text-gray-800 hover:text-primary transition-colors"
                          target="_blank"
                        >
                          {plan.title ?? `${plan.duration}-Day Plan`}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{plan.destination?.city ?? "—"}</td>
                      <td className="py-3 pr-4 text-gray-500">
                        {plan.user?.name ?? plan.user?.email ?? "—"}
                      </td>
                      <td className="py-3 text-right text-gray-400">
                        {new Date(plan.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
