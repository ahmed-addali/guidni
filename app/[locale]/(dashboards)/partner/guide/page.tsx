import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyGuideProfile, getMyGuidePlans } from "@/lib/actions/partner-guides";
import { FiBookOpen, FiArrowRight, FiEye, FiUser } from "react-icons/fi";
import { FaCompass } from "react-icons/fa6";

type Params = Promise<{ locale: string }>;

export const metadata = { title: "Guide Dashboard — Guidni" };

export default async function GuideOverviewPage({ params }: { params: Params }) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/${locale}/login`);

  const [profile, plans] = await Promise.all([
    getMyGuideProfile(),
    getMyGuidePlans(),
  ]);

  const base = `/${locale}/partner/guide`;
  const publishedPlans = plans.filter((p) => p.isPublic);
  const totalViews    = plans.reduce((sum, p) => sum + p.viewCount, 0);
  const totalPurchases= plans.reduce((sum, p) => sum + p.purchaseCount, 0);

  if (!profile) {
    return (
      <div className="max-w-screen-sm mx-auto py-20 text-center space-y-5">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <FaCompass className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Set up your guide profile</h1>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Create your public guide profile to start publishing trip plans and reaching travelers.
        </p>
        <Link
          href={`${base}/profile`}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Create profile <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const statCards = [
    {
      label:   "Published Plans",
      value:   publishedPlans.length,
      icon:    FiBookOpen,
      href:    `${base}/plans`,
      color:   "text-primary",
      bg:      "bg-primary/10",
    },
    {
      label:   "Total Views",
      value:   totalViews,
      icon:    FiEye,
      href:    `${base}/plans`,
      color:   "text-blue-600",
      bg:      "bg-blue-50",
    },
    {
      label:   "Trips Planned",
      value:   totalPurchases,
      icon:    FiUser,
      href:    `${base}/plans`,
      color:   "text-emerald-600",
      bg:      "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-8 max-w-screen-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guide Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome back, {profile.displayName}</p>
        </div>
        <Link
          href={`${base}/plans/new`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + New Plan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all space-y-3"
          >
            <div className={`h-9 w-9 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent plans */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">My Plans</h2>
          <Link href={`${base}/plans`} className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <FiArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {plans.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-400 mb-3">No plans yet.</p>
            <Link
              href={`${base}/plans/new`}
              className="text-sm text-primary hover:underline"
            >
              Create your first plan →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {plans.slice(0, 5).map((plan) => (
              <li key={plan.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {plan.title ?? `${plan.duration}-Day Plan`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {plan.duration} days · {plan.destination?.city ?? "—"} · {plan.purchaseCount} trips planned
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    plan.isPublic
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {plan.isPublic ? "Published" : "Draft"}
                  </span>
                  <Link
                    href={`${base}/plans/${plan.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
