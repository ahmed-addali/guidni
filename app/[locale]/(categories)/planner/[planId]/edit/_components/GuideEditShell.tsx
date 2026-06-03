"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, ExternalLink, Check, Pencil,
  Map, FileText, DollarSign, Send, MessageSquare,
  CheckCircle2, Clock, XCircle, AlertCircle,
} from "lucide-react";
import { updatePlanTitle } from "@/lib/actions/guide-plan-editor";
import { GuidePlanDetailsTab } from "./GuidePlanDetailsTab";
import { GuidePlanPricingTab } from "./GuidePlanPricingTab";
import { GuidePlanPublishTab } from "./GuidePlanPublishTab";
import { GuidePlanItineraryTab } from "./GuidePlanItineraryTab";
import type { PlanItinerary } from "@/lib/planner/types";
import type { PlanType, PlanModerationStatus } from "@prisma/client";

export interface EditablePlan {
  id:               string;
  title:            string | null;
  duration:         number;
  isPublic:         boolean;
  planType:         PlanType;
  price:            number;
  previewDays:      number;
  isPaidPlan:       boolean;
  moderationStatus: PlanModerationStatus;
  summary:          string | null;
  tags:             string[];
  difficulty:       string | null;
  suitableFor:      string[];
  season:           string[];
  itinerary:        PlanItinerary;
  destination:      { id: string; city: string; country: string } | null;
  guide:            { id: string; slug: string; displayName: string } | null;
  request:          { id: string; requestRef: string; status: string; userName: string } | null;
}

interface Props {
  locale: string;
  tab:    string;
  plan:   EditablePlan;
}

const TABS = [
  { key: "itinerary", label: "Itinerary", icon: Map },
  { key: "details",   label: "Details",   icon: FileText },
  { key: "pricing",   label: "Pricing",   icon: DollarSign },
  { key: "publish",   label: "Publish",   icon: Send },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STATUS_CONFIG: Record<PlanModerationStatus, {
  label: string;
  className: string;
  icon: React.ElementType;
}> = {
  PENDING:           { label: "Under review",      className: "bg-amber-50 text-amber-700 border border-amber-200",   icon: Clock },
  APPROVED:          { label: "Live",               className: "bg-green-50 text-green-700 border border-green-200",   icon: CheckCircle2 },
  REJECTED:          { label: "Rejected",           className: "bg-red-50 text-red-700 border border-red-200",         icon: XCircle },
  CHANGES_REQUESTED: { label: "Changes needed",     className: "bg-orange-50 text-orange-700 border border-orange-200", icon: AlertCircle },
};

/* ── Inline title editor ────────────────────────────────────────────────────── */

function TitleEditor({ planId, initialTitle }: { planId: string; initialTitle: string | null }) {
  const [editing,   setEditing]   = useState(false);
  const [value,     setValue]     = useState(initialTitle ?? "");
  const [isPending, startTransition] = useTransition();

  function save() {
    const trimmed = value.trim();
    if (trimmed === (initialTitle ?? "")) { setEditing(false); return; }
    startTransition(async () => {
      const res = await updatePlanTitle(planId, trimmed);
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Title saved");
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter")  save();
            if (e.key === "Escape") setEditing(false);
          }}
          maxLength={100}
          className="text-sm font-semibold text-gray-900 bg-transparent border-b-2 border-primary/60 outline-none w-72 pb-0.5"
        />
        <button
          onClick={save}
          disabled={isPending}
          className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-50 shrink-0"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 group min-w-0"
      title="Click to edit title"
    >
      <span className="text-sm font-semibold text-gray-900 truncate max-w-xs">
        {value || <span className="text-gray-400 italic">Untitled plan</span>}
      </span>
      <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

/* ── Main shell ─────────────────────────────────────────────────────────────── */

export function GuideEditShell({ locale, tab, plan }: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  const activeTab = (TABS.some((t) => t.key === tab) ? tab : "itinerary") as TabKey;

  function goTab(key: TabKey) {
    router.push(`${pathname}?tab=${key}`, { scroll: false });
  }

  const statusCfg  = STATUS_CONFIG[plan.moderationStatus];
  const StatusIcon = statusCfg.icon;

  const statusLabel = plan.isPublic
    ? STATUS_CONFIG.APPROVED.label
    : statusCfg.label;
  const statusClass = plan.isPublic
    ? STATUS_CONFIG.APPROVED.className
    : statusCfg.className;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky toolbar ─────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">

          {/* Top row */}
          <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50">
            {/* Left: back + title + meta */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={`/${locale}/partner/guide/plans`}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                title="Back to plans"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="w-px h-5 bg-gray-200 shrink-0" />
              <TitleEditor planId={plan.id} initialTitle={plan.title} />
              {plan.destination && (
                <span className="hidden sm:inline text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                  {plan.destination.city} · {plan.duration}{plan.duration === 1 ? " day" : " days"}
                </span>
              )}
            </div>

            {/* Right: status + preview */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusClass}`}>
                <StatusIcon className="h-3 w-3" />
                {statusLabel}
              </span>
              <Link
                href={`/${locale}/planner/${plan.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Preview
              </Link>
            </div>
          </div>

          {/* Tab row */}
          <div className="flex items-center -mb-px">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => goTab(t.key)}
                  className={[
                    "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200",
                  ].join(" ")}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">

        {/* Custom request banner */}
        {plan.request && (
          <div className="mb-6 flex items-start gap-3.5 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Custom plan for {plan.request.userName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Request #{plan.request.requestRef} · {plan.request.status.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        )}

        {activeTab === "itinerary" && (
          <GuidePlanItineraryTab
            planId={plan.id}
            itinerary={plan.itinerary}
            destinationId={plan.destination?.id ?? ""}
          />
        )}
        {activeTab === "details" && (
          <GuidePlanDetailsTab
            planId={plan.id}
            initialData={{
              title:       plan.title,
              summary:     plan.summary,
              tags:        plan.tags,
              difficulty:  plan.difficulty,
              suitableFor: plan.suitableFor,
              season:      plan.season,
            }}
          />
        )}
        {activeTab === "pricing" && (
          <GuidePlanPricingTab
            planId={plan.id}
            duration={plan.duration}
            initialData={{
              planType:    plan.planType,
              price:       plan.price,
              previewDays: plan.previewDays,
            }}
          />
        )}
        {activeTab === "publish" && (
          <GuidePlanPublishTab
            planId={plan.id}
            locale={locale}
            guideSlug={plan.guide?.slug ?? ""}
            initialData={{
              isPublic:         plan.isPublic,
              moderationStatus: plan.moderationStatus,
              planType:         plan.planType,
              title:            plan.title,
              request:          plan.request,
            }}
          />
        )}
      </div>
    </div>
  );
}
