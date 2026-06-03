"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FiExternalLink, FiTrash2, FiCheck, FiX, FiAlertCircle } from "react-icons/fi";
import { adminForceUnpublishPlan, reviewGuidePlan } from "@/lib/actions/admin-guides";

type Plan = {
  id: string;
  title: string | null;
  duration: number;
  planType: string;
  isPublic: boolean;
  price: number | null;
  purchaseCount: number;
  viewCount: number;
  summary: string | null;
  createdAt: Date;
  destination?: { city: string } | null;
  guide?: { slug: string; displayName: string; isVerified: boolean } | null;
};

type QueuePlan = {
  id: string;
  title: string | null;
  duration: number;
  planType: string;
  isPublic: boolean;
  price: number | null;
  summary: string | null;
  createdAt: string;
  destination?: { city: string } | null;
  guide?: { slug: string; displayName: string; isVerified: boolean } | null;
};

type Props = { plans: Plan[]; moderationQueue: QueuePlan[]; locale: string };

const PLAN_TYPE_LABEL: Record<string, string> = {
  GUIDE_FREE: "Free",
  GUIDE_PAID: "Paid",
};

export function GuidePlansAdminClient({ plans: initial, moderationQueue: initialQueue, locale }: Props) {
  const [tab, setTab] = useState<"all" | "queue">(initialQueue.length > 0 ? "queue" : "all");
  const [plans, setPlans] = useState(initial);
  const [queue, setQueue] = useState(initialQueue);
  const [isPending, startTransition] = useTransition();

  const handleUnpublish = (planId: string) => {
    if (!confirm("Force unpublish this plan? It will revert to a personal plan.")) return;
    startTransition(async () => {
      const result = await adminForceUnpublishPlan(planId);
      if (result.success) {
        setPlans((prev) => prev.filter((p) => p.id !== planId));
        toast.success("Plan unpublished");
      } else {
        toast.error("error" in result ? result.error : "Failed");
      }
    });
  };

  const handleModerationDecision = (planId: string, decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED") => {
    startTransition(async () => {
      const result = await reviewGuidePlan(planId, decision);
      if (result.success) {
        setQueue((prev) => prev.filter((p) => p.id !== planId));
        const labels: Record<string, string> = {
          APPROVED:           "Plan approved",
          REJECTED:           "Plan rejected",
          CHANGES_REQUESTED:  "Changes requested",
        };
        toast.success(labels[decision] ?? "Done");
      } else {
        toast.error("error" in result ? result.error : "Failed");
      }
    });
  };

  const tabs = [
    { id: "all" as const,   label: "All Plans",          count: plans.length  },
    { id: "queue" as const, label: "Moderation Queue",   count: queue.length  },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.id ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-500"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* All Plans tab */}
      {tab === "all" && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Guide</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Destination</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Stats</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">
                        {plan.title ?? `${plan.duration}-Day Plan`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{plan.duration} days</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {plan.guide ? (
                        <Link href={`/${locale}/planner/guides/${plan.guide.slug}`} target="_blank" className="text-primary hover:underline text-sm">
                          {plan.guide.displayName}
                        </Link>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-500 hidden lg:table-cell">{plan.destination?.city ?? "—"}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        plan.planType === "GUIDE_FREE" ? "bg-green-50 text-green-700" : "bg-primary/10 text-primary"
                      }`}>
                        {PLAN_TYPE_LABEL[plan.planType] ?? plan.planType}
                        {plan.planType === "GUIDE_PAID" && plan.price ? ` · TND ${plan.price}` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-xs text-gray-500 hidden xl:table-cell">
                      <span>{plan.viewCount} views</span>
                      <span className="mx-1 text-gray-300">·</span>
                      <span>{plan.purchaseCount} trips</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        plan.isPublic ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {plan.isPublic ? "Public" : "Private"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/${locale}/planner/${plan.id}`} target="_blank" className="text-gray-400 hover:text-primary transition-colors" title="View plan">
                          <FiExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleUnpublish(plan.id)}
                          disabled={isPending}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Force unpublish"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {plans.length === 0 && (
              <div className="py-16 text-center text-sm text-gray-400">No guide plans yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Moderation Queue tab */}
      {tab === "queue" && (
        <div className="space-y-4">
          {queue.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center">
              <p className="text-sm text-gray-400">No plans pending moderation.</p>
            </div>
          ) : (
            queue.map((plan) => (
              <div key={plan.id} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {plan.title ?? `${plan.duration}-Day Plan`}
                      </h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        plan.planType === "GUIDE_FREE" ? "bg-green-50 text-green-700" : "bg-primary/10 text-primary"
                      }`}>
                        {PLAN_TYPE_LABEL[plan.planType] ?? plan.planType}
                        {plan.planType === "GUIDE_PAID" && plan.price ? ` · TND ${plan.price}` : ""}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {plan.guide?.displayName ?? "Unknown guide"} · {plan.destination?.city ?? "—"} · {plan.duration} days
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => handleModerationDecision(plan.id, "CHANGES_REQUESTED")}
                      disabled={isPending}
                      className="flex items-center gap-1.5 px-3 py-2 border border-amber-200 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-50 transition-colors disabled:opacity-50"
                    >
                      <FiAlertCircle className="h-3.5 w-3.5" /> Changes
                    </button>
                    <button
                      onClick={() => handleModerationDecision(plan.id, "REJECTED")}
                      disabled={isPending}
                      className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <FiX className="h-3.5 w-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleModerationDecision(plan.id, "APPROVED")}
                      disabled={isPending}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <FiCheck className="h-3.5 w-3.5" /> Approve
                    </button>
                  </div>
                </div>

                {plan.summary && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 line-clamp-3">
                    {plan.summary}
                  </p>
                )}

                <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                  <Link
                    href={`/${locale}/planner/${plan.id}`}
                    target="_blank"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <FiExternalLink className="h-3 w-3" /> Preview plan
                  </Link>
                  {plan.guide && (
                    <Link
                      href={`/${locale}/planner/guides/${plan.guide.slug}`}
                      target="_blank"
                      className="text-xs text-gray-400 hover:text-primary hover:underline"
                    >
                      View guide profile
                    </Link>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    Submitted {new Date(plan.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
