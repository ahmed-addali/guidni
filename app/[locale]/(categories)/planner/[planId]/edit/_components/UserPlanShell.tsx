"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ChevronLeft, ExternalLink, Check, Edit2,
  Globe, Globe2, Link2, Printer, MapPin, Clock,
} from "lucide-react";
import { updatePlanTitle } from "@/lib/actions/guide-plan-editor";
import { updatePlan } from "@/lib/actions/planner";
import { GuidePlanItineraryTab } from "./GuidePlanItineraryTab";
import type { PlanItinerary } from "@/lib/planner/types";

/* ─── Types ──────────────────────────────────────────────────────────────────── */

export interface UserEditablePlan {
  id:          string;
  title:       string | null;
  duration:    number;
  isPublic:    boolean;
  itinerary:   PlanItinerary;
  destination: { id: string; city: string; country: string } | null;
}

interface Props {
  locale: string;
  tab:    string;
  plan:   UserEditablePlan;
}

/* ── Main shell ─────────────────────────────────────────────────────────────── */

export function UserPlanShell({ locale, plan }: Props) {
  const t = useTranslations("UserPlanShell");

  const [title,        setTitle]        = useState(plan.title ?? "");
  const [editingTitle, setEditingTitle] = useState(false);
  const [isPublic,     setIsPublic]     = useState(plan.isPublic);
  const [isPending,    startTransition] = useTransition();

  const planUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${locale}/planner/${plan.id}`
    : "";

  function copyLink() {
    navigator.clipboard.writeText(planUrl).then(() => toast.success(t("linkCopied")));
  }

  function togglePublic() {
    const next = !isPublic;
    setIsPublic(next);
    startTransition(async () => {
      const res = await updatePlan(plan.id, { isPublic: next });
      if (!res.success) {
        setIsPublic(!next);
        toast.error(t("toggleError"));
      } else {
        toast.success(t("toggleSuccess"));
      }
    });
  }

  function saveTitle() {
    const trimmed = title.trim();
    startTransition(async () => {
      const res = await updatePlanTitle(plan.id, trimmed);
      if (!res.success) { toast.error(res.error); return; }
      toast.success(t("titleSaved"));
      setEditingTitle(false);
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-3">

        {/* ── Card 1: Actions bar ────────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 flex items-center justify-between gap-4">
          <Link
            href={`/${locale}/planner/${plan.id}`}
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("backToPlan")}
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePublic}
              disabled={isPending}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-60",
                isPublic
                  ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {isPublic
                ? <><Globe  className="h-3.5 w-3.5" />{t("public")}</>
                : <><Globe2 className="h-3.5 w-3.5" />{t("private")}</>
              }
            </button>

            <div className="w-px h-4 bg-gray-200 shrink-0" />

            <button
              type="button"
              onClick={copyLink}
              title={t("copyLink")}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Link2 className="h-4 w-4" />
            </button>

            <Link
              href={`/${locale}/planner/${plan.id}/print`}
              target="_blank"
              rel="noopener noreferrer"
              title={t("printLabel")}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Printer className="h-4 w-4" />
            </Link>

            <div className="w-px h-4 bg-gray-200 shrink-0" />

            <Link
              href={`/${locale}/planner/${plan.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("previewLink")}
            </Link>
          </div>
        </div>

        {/* ── Card 2: Plan details ───────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5">
          {editingTitle ? (
            <div className="flex items-center gap-2 mb-3">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")  saveTitle();
                  if (e.key === "Escape") setEditingTitle(false);
                }}
                maxLength={100}
                placeholder={t("titlePlaceholder")}
                className="text-xl font-bold text-black bg-transparent border-b-2 border-primary outline-none flex-1 min-w-0 pb-0.5"
              />
              <button
                type="button"
                onClick={saveTitle}
                disabled={isPending}
                className="p-1 text-primary hover:opacity-70 disabled:opacity-40 transition-opacity shrink-0"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-3">
              <h1 className="text-xl font-bold text-black truncate">
                {title}
              </h1>
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                className="p-1 text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                title={t("editTitle")}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
            {plan.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {plan.destination.city}
                {plan.destination.country ? `, ${plan.destination.country}` : ""}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("dayCount", { count: plan.duration })}
            </span>
          </div>
        </div>

        {/* ── Itinerary ──────────────────────────────────────────────────── */}
        <GuidePlanItineraryTab
          planId={plan.id}
          itinerary={plan.itinerary}
          destinationId={plan.destination?.id ?? ""}
        />
      </div>
    </div>
  );
}
