import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyGuideProfile } from "@/lib/actions/partner-guides";
import { getUserPlans } from "@/lib/actions/planner";
import { FiArrowRight } from "react-icons/fi";
import { FaCompass } from "react-icons/fa6";

type Params = Promise<{ locale: string }>;

export const metadata = { title: "New Guide Plan — Guidni Partner" };

export default async function NewGuidePlanPage({ params }: { params: Params }) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/${locale}/login`);

  const profile = await getMyGuideProfile();
  if (!profile) redirect(`/${locale}/partner/guide/profile`);

  const allPlans = await getUserPlans();
  // Only show plans that aren't already published as guide plans
  const eligible = allPlans.filter(
    (p) => p.planType === "USER_SAVED" || !["GUIDE_FREE", "GUIDE_PAID"].includes(p.planType ?? "")
  );

  const base = `/${locale}/partner/guide`;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Publish a Guide Plan</h1>
        <p className="text-sm text-gray-400 mt-1">
          Select one of your saved plans to publish as a guide plan in the marketplace.
        </p>
      </div>

      {/* Option A: from existing plan */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">From your saved plans</h2>

        {eligible.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <FaCompass className="h-8 w-8 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400">No eligible plans found.</p>
            <p className="text-xs text-gray-400">
              First generate a plan using the AI Planner, then come back here to publish it.
            </p>
            <Link
              href={`/${locale}/planner`}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Go to AI Planner <FiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {eligible.map((plan) => {
              const prefs = plan.preferences as { destinationCity?: string } | null;
              return (
                <Link
                  key={plan.id}
                  href={`${base}/plans/${plan.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/3 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {plan.title ?? `${plan.duration}-Day Plan`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {plan.duration} days
                      {prefs?.destinationCity ? ` · ${prefs.destinationCity}` : ""}
                      {" · "}Created {new Date(plan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <FiArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Option B: use AI planner */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-6 space-y-3">
        <h2 className="font-semibold text-gray-800">Or create a new plan from scratch</h2>
        <p className="text-sm text-gray-500">
          Use the AI Planner to generate a fresh itinerary, save it, then come back here to publish it as a guide plan.
        </p>
        <Link
          href={`/${locale}/planner`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Open AI Planner <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
