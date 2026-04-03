"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FiExternalLink, FiTrash2 } from "react-icons/fi";
import { adminForceUnpublishPlan } from "@/lib/actions/admin-guides";

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
  guide?: {
    slug: string;
    displayName: string;
    isVerified: boolean;
  } | null;
};

type Props = { plans: Plan[]; locale: string };

export function GuidePlansAdminClient({ plans: initial, locale }: Props) {
  const [plans, setPlans] = useState(initial);
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

  const PLAN_TYPE_LABEL: Record<string, string> = {
    GUIDE_FREE: "Free",
    GUIDE_PAID: "Paid",
  };

  return (
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
                    <Link
                      href={`/${locale}/planner/guides/${plan.guide.slug}`}
                      target="_blank"
                      className="text-primary hover:underline text-sm"
                    >
                      {plan.guide.displayName}
                    </Link>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-5 py-4 text-gray-500 hidden lg:table-cell">
                  {plan.destination?.city ?? "—"}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    plan.planType === "GUIDE_FREE"
                      ? "bg-green-50 text-green-700"
                      : "bg-primary/10 text-primary"
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
                    <Link
                      href={`/${locale}/planner/${plan.id}`}
                      target="_blank"
                      className="text-gray-400 hover:text-primary transition-colors"
                      title="View plan"
                    >
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
  );
}
