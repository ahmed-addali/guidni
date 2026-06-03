"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { submitGuidePlanForReview, unpublishGuidePlan } from "@/lib/actions/guide-plan-editor";
import { deliverPlanRequest } from "@/lib/actions/plan-requests";
import type { PlanType, PlanModerationStatus } from "@prisma/client";

interface Props {
  planId:    string;
  locale:    string;
  guideSlug: string;
  initialData: {
    isPublic:         boolean;
    moderationStatus: PlanModerationStatus;
    planType:         PlanType;
    title:            string | null;
    request:          { id: string; requestRef: string; status: string; userName: string } | null;
  };
}

const STATUS_CONFIG: Record<PlanModerationStatus, {
  icon:  React.ElementType;
  color: string;
  bg:    string;
  label: string;
  desc:  string;
}> = {
  PENDING:            { icon: Clock,        color: "text-amber-600", bg: "bg-amber-50", label: "Under review",      desc: "The Guidni team is reviewing your plan." },
  APPROVED:           { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", label: "Approved",          desc: "Your plan has been approved and is live." },
  REJECTED:           { icon: XCircle,      color: "text-red-600",   bg: "bg-red-50",   label: "Rejected",          desc: "Your plan was not approved. Review the feedback and resubmit." },
  CHANGES_REQUESTED:  { icon: AlertCircle,  color: "text-orange-600",bg: "bg-orange-50",label: "Changes requested", desc: "The team has requested changes. Update your plan and resubmit." },
};

/* ── Request delivery card ───────────────────────────────────────────────────── */

function RequestDeliveryCard({
  planId,
  request,
  onDelivered,
}: {
  planId:      string;
  request:     { id: string; requestRef: string; status: string; userName: string };
  onDelivered: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDeliver() {
    startTransition(async () => {
      const res = await deliverPlanRequest(request.id, planId);
      if (!res.success) { toast.error(res.error); return; }
      toast.success(`Plan delivered to ${request.userName}`);
      onDelivered();
    });
  }

  const isChanges = request.status === "CHANGES_REQUESTED";

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-indigo-600">R</span>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">
            {isChanges ? "Revisions requested" : "Deliver to traveler"}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Request #{request.requestRef} · for {request.userName}
          </p>
        </div>
      </div>

      {isChanges && (
        <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-100 rounded-xl">
          <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-800">
            The traveler has requested changes. Update the itinerary above, then re-deliver.
          </p>
        </div>
      )}

      <p className="text-sm text-gray-600">
        {isChanges
          ? "Once you've applied the requested changes, re-deliver the plan."
          : "Once satisfied with the itinerary, mark it as delivered. The traveler will be notified and can review and accept the plan."}
      </p>

      <button
        onClick={handleDeliver}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <>
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Delivering…
          </>
        ) : (
          isChanges ? "Re-deliver plan" : `Deliver to ${request.userName}`
        )}
      </button>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────────── */

export function GuidePlanPublishTab({ planId, locale, guideSlug, initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  const cfg = STATUS_CONFIG[data.moderationStatus];
  const Icon = cfg.icon;

  function handleSubmit() {
    startTransition(async () => {
      const res = await submitGuidePlanForReview(planId);
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Plan submitted for review!");
      setData((d) => ({ ...d, moderationStatus: "PENDING" }));
    });
  }

  function handleUnpublish() {
    startTransition(async () => {
      const res = await unpublishGuidePlan(planId);
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Plan unpublished.");
      setData((d) => ({ ...d, isPublic: false, moderationStatus: "PENDING" }));
    });
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Moderation status card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Publication status</h2>

        <div className={`flex items-start gap-3 p-4 rounded-xl ${cfg.bg}`}>
          <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${cfg.color}`} />
          <div>
            <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{cfg.desc}</p>
          </div>
        </div>

        {data.isPublic && (
          <Link
            href={`/${locale}/planner/${planId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View live plan
          </Link>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Actions</h2>

        <div className="space-y-3">
          {/* Submit for review */}
          {!data.isPublic && (
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Submit for review</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Once approved by the team, your plan will go live in the marketplace.
                </p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isPending || !data.title}
                className="shrink-0 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isPending ? "Submitting…" : "Submit"}
              </button>
            </div>
          )}

          {!data.title && !data.isPublic && (
            <p className="text-xs text-red-500">
              Add a title before submitting.
            </p>
          )}

          {/* Unpublish */}
          {data.isPublic && (
            <div className="flex items-start gap-4 pt-3 border-t border-gray-100">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Unpublish</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Remove from the marketplace. You can resubmit for review later.
                </p>
              </div>
              <button
                onClick={handleUnpublish}
                disabled={isPending}
                className="shrink-0 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Unpublish"}
              </button>
            </div>
          )}

          {/* View profile */}
          {guideSlug && (
            <div className="pt-3 border-t border-gray-100">
              <Link
                href={`/${locale}/planner/guides/${guideSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View your public guide profile
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Custom request delivery */}
      {data.request && ["IN_PROGRESS", "CHANGES_REQUESTED"].includes(data.request.status) && (
        <RequestDeliveryCard
          planId={planId}
          request={data.request}
          onDelivered={() =>
            setData((d) => ({
              ...d,
              request: d.request ? { ...d.request, status: "DELIVERED" } : null,
            }))
          }
        />
      )}

      {data.request && data.request.status === "DELIVERED" && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800">Plan delivered</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {data.request.userName} has been notified and can now review the plan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
