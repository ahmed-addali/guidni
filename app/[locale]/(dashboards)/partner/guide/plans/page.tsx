import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyGuideProfile, getMyGuidePlans } from "@/lib/actions/partner-guides";
import { getDestinations } from "@/lib/actions/destinations";
import { FiEdit, FiEye } from "react-icons/fi";
import { FaBookOpen } from "react-icons/fa6";
import { DuplicatePlanButton } from "./_components/DuplicatePlanButton";
import { NewPlanButton } from "../_components/NewPlanButton";

type Params = Promise<{ locale: string }>;

export const metadata = { title: "Guide Plans — Guidni Partner" };

export default async function GuidePlansPage({ params }: { params: Params }) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/${locale}/login`);

  const profile = await getMyGuideProfile();
  if (!profile) redirect(`/${locale}/partner/guide/profile`);

  const [plans, destinations] = await Promise.all([
    getMyGuidePlans(),
    getDestinations(),
  ]);
  const base = `/${locale}/partner/guide`;

  return (
    <div className="space-y-6 max-w-screen-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Plans</h1>
          <p className="text-sm text-gray-400 mt-1">{plans.length} plan{plans.length !== 1 ? "s" : ""}</p>
        </div>
        <NewPlanButton
          locale={locale}
          destinations={destinations}
          defaultDestinationId={profile.destination?.id}
        />
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-100 rounded-2xl">
          <FaBookOpen className="h-10 w-10 text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium mb-1">No plans yet</p>
          <p className="text-gray-400 text-sm mb-5">
            Publish your first trip plan to start reaching travelers.
          </p>
          <NewPlanButton
            locale={locale}
            destinations={destinations}
            defaultDestinationId={profile.destination?.id}
            label="Create your first plan"
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Destination</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Stats</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900 truncate max-w-[180px]">
                      {plan.title ?? `${plan.duration}-Day Plan`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{plan.duration} days</p>
                  </td>
                  <td className="px-5 py-4 text-gray-600 hidden sm:table-cell">
                    {plan.destination?.city ?? "—"}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      plan.planType === "GUIDE_FREE"
                        ? "bg-green-50 text-green-700"
                        : plan.planType === "GUIDE_PAID"
                        ? "bg-primary/10 text-primary"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {plan.planType === "GUIDE_FREE" ? "Free" : plan.planType === "GUIDE_PAID" ? `Paid · TND ${plan.price}` : "Personal"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs hidden lg:table-cell">
                    <span>{plan.viewCount} views</span>
                    <span className="mx-2 text-gray-300">·</span>
                    <span>{plan.purchaseCount} trips planned</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      plan.isPublic ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {plan.isPublic ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${locale}/planner/${plan.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <FiEdit className="h-4 w-4" />
                      </Link>
                      <DuplicatePlanButton planId={plan.id} locale={locale} />
                      {plan.isPublic && (
                        <Link
                          href={`/${locale}/planner/${plan.id}`}
                          target="_blank"
                          className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                          title="View public"
                        >
                          <FiEye className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
