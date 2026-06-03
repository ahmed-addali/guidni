import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getUserPlans } from "@/lib/actions/planner";
import { getMyPlanRequests } from "@/lib/actions/plan-requests";
import { format } from "date-fns";
import { Sparkles, MapPin, Clock, Users, Calendar, Plus, Globe, Inbox } from "lucide-react";
import type { UserPreferences } from "@/lib/planner/types";
import { MyRequestsClient } from "./_components/MyRequestsClient";

type Params       = Promise<{ locale: string }>;
type SearchParams  = Promise<{ tab?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PlannerMyPlans" });
  return { title: t("metaTitle") };
}

const GROUP_LABELS: Record<string, string> = {
  solo:    "Solo",
  couple:  "Couple",
  family:  "Family",
  friends: "Friends",
};

export default async function MyPlansPage({
  params,
  searchParams,
}: {
  params:       Params;
  searchParams: SearchParams;
}) {
  const { locale }        = await params;
  const { tab = "plans" } = await searchParams;

  const [plans, requests, t] = await Promise.all([
    getUserPlans(),
    getMyPlanRequests(),
    getTranslations({ locale, namespace: "PlannerMyPlans" }),
  ]);

  const activeTab = tab === "requests" ? "requests" : "plans";

  const TAB_ITEMS = [
    { key: "plans",    label: t("tabPlans"),    count: plans.length },
    { key: "requests", label: t("tabRequests"), count: requests.length },
  ];

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("subtitle", { count: plans.length })}
          </p>
        </div>
        <Link
          href={`/${locale}/planner/ai`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          {t("newPlan")}
        </Link>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-gray-100 mb-8">
        {TAB_ITEMS.map(({ key, label, count }) => (
          <Link
            key={key}
            href={`/${locale}/my-plans${key === "plans" ? "" : `?tab=${key}`}`}
            className={[
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {label}
            <span className={[
              "text-xs rounded-full px-2 py-0.5 font-semibold",
              activeTab === key ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500",
            ].join(" ")}>
              {count}
            </span>
          </Link>
        ))}
      </div>

      {/* Plans tab */}
      {activeTab === "plans" && (
        <>
          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white border border-gray-100 rounded-2xl text-center px-6">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("emptyTitle")}</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">{t("emptyDescription")}</p>
              <Link
                href={`/${locale}/planner/ai`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                {t("createFirstPlan")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const prefs = plan.preferences as UserPreferences | null;
                const city  = plan.destination?.city ?? prefs?.destinationCity ?? "—";
                const group = prefs?.groupType ? GROUP_LABELS[prefs.groupType] : null;

                return (
                  <Link
                    key={plan.id}
                    href={`/${locale}/planner/${plan.id}`}
                    className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow block"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="text-xs font-semibold text-blue-600 truncate">{city}</span>
                      </div>
                      {plan.isPublic && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 shrink-0 ml-2">
                          <Globe className="h-2.5 w-2.5" />
                          Public
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                      {plan.title ?? `${plan.duration}-Day Trip`}
                    </p>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{plan.duration} day{plan.duration !== 1 ? "s" : ""}</span>
                      </div>
                      {group && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Users className="h-3 w-3 shrink-0" />
                          <span>{group}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{format(new Date(plan.createdAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Requests tab */}
      {activeTab === "requests" && (
        <>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white border border-gray-100 rounded-2xl text-center px-6">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-4">
                <Inbox className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("requestsEmptyTitle")}</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">{t("requestsEmptyDesc")}</p>
              <Link
                href={`/${locale}/planner/guides`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
              >
                {t("browseGuides")}
              </Link>
            </div>
          ) : (
            <MyRequestsClient requests={requests} locale={locale} />
          )}
        </>
      )}
    </div>
  );
}
