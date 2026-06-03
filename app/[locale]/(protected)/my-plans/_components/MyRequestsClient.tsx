"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Clock, Users, DollarSign, Calendar, MapPin, CheckCircle2,
  XCircle, ChevronDown, ChevronUp, Loader2, ExternalLink,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  confirmPlanRequestQuote,
  cancelPlanRequest,
  completePlanRequest,
  requestChanges,
} from "@/lib/actions/plan-requests";
import type { PlanRequestStatus } from "@prisma/client";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface GuideInfo {
  slug:        string;
  displayName: string;
  avatarUrl:   string | null;
  isVerified:  boolean;
  destination: { city: string } | null;
}

interface ResultPlan {
  id:       string;
  title:    string | null;
  duration: number;
}

export interface RequestItem {
  id:              string;
  requestRef:      string;
  status:          PlanRequestStatus;
  message:         string;
  duration:        number;
  budget:          number;
  groupSize:       number;
  interests:       string[];
  startDate:       string | null;
  quotePrice:      number | null;
  quoteNote:       string | null;
  estimatedBudget: number | null;
  changesNote:     string | null;
  declineNote:     string | null;
  createdAt:       Date;
  updatedAt:       Date;
  guide:           GuideInfo | null;
  resultPlan:      ResultPlan | null;
}

interface Props {
  requests: RequestItem[];
  locale:   string;
}

/* ── Status config ─────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<PlanRequestStatus, { dot: string; label: string }> = {
  PENDING:           { dot: "bg-amber-400",  label: "text-amber-700 bg-amber-50 border-amber-200" },
  QUOTE_SENT:        { dot: "bg-blue-500",   label: "text-blue-700 bg-blue-50 border-blue-200" },
  CONFIRMED:         { dot: "bg-indigo-500", label: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  IN_PROGRESS:       { dot: "bg-purple-500", label: "text-purple-700 bg-purple-50 border-purple-200" },
  CHANGES_REQUESTED: { dot: "bg-orange-500", label: "text-orange-700 bg-orange-50 border-orange-200" },
  DELIVERED:         { dot: "bg-teal-500",   label: "text-teal-700 bg-teal-50 border-teal-200" },
  COMPLETED:         { dot: "bg-green-500",  label: "text-green-700 bg-green-50 border-green-200" },
  CANCELLED:         { dot: "bg-gray-400",   label: "text-gray-600 bg-gray-50 border-gray-200" },
  DECLINED:          { dot: "bg-red-400",    label: "text-red-700 bg-red-50 border-red-200" },
};

const ACTIVE_STATUSES: PlanRequestStatus[] = [
  "PENDING", "QUOTE_SENT", "CONFIRMED", "IN_PROGRESS", "CHANGES_REQUESTED", "DELIVERED",
];
const CLOSED_STATUSES: PlanRequestStatus[] = ["COMPLETED", "CANCELLED", "DECLINED"];

/* ── RequestCard ───────────────────────────────────────────────────────────── */

function RequestCard({
  req,
  locale,
  onUpdate,
}: {
  req:      RequestItem;
  locale:   string;
  onUpdate: () => void;
}) {
  const t                            = useTranslations("PlannerMyPlans");
  const router                       = useRouter();
  const [open, setOpen]              = useState(false);
  const [changesNote, setChangesNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const style = STATUS_STYLES[req.status];

  function act(fn: () => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (!res.success) {
        toast.error((res as { error: string }).error);
      } else {
        toast.success(t("actionSuccess"));
        onUpdate();
        router.refresh();
      }
    });
  }

  const guideHref  = req.guide ? `/${locale}/planner/guides/${req.guide.slug}` : "#";
  const planHref   = req.resultPlan ? `/${locale}/planner/${req.resultPlan.id}` : "#";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          {req.guide?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={req.guide.avatarUrl}
              alt={req.guide.displayName}
              className="h-9 w-9 rounded-full object-cover shrink-0 mt-0.5"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">
                {(req.guide?.displayName ?? "G").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={guideHref}
                className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {req.guide?.displayName ?? "—"}
              </Link>
              {req.guide?.destination && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" />
                  {req.guide.destination.city}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {req.requestRef} · {format(new Date(req.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${style.label}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {t(`status.${req.status}` as Parameters<typeof t>[0])}
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 transition-colors"
            aria-label={open ? t("collapseDetails") : t("expandDetails")}
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Collapsed summary */}
      {!open && (
        <div className="px-5 pb-4 flex flex-wrap gap-3">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            {t("days", { count: req.duration })}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5 text-gray-400" />
            {t("people", { count: req.groupSize })}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
            {t("budgetValue", { budget: req.budget })}
          </span>
          {req.quotePrice !== null && req.status !== "PENDING" && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
              {t("guideQuote")}: {t("quoteValue", { price: req.quotePrice })}
            </span>
          )}
        </div>
      )}

      {/* Expanded details */}
      {open && (
        <div className="px-5 pb-4 border-t border-gray-50 pt-3 space-y-3">
          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{t("durationLabel")}</p>
              <p className="text-sm text-gray-700 font-medium">{t("days", { count: req.duration })}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{t("budgetLabel")}</p>
              <p className="text-sm text-gray-700 font-medium">{t("budgetValue", { budget: req.budget })}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{t("groupLabel")}</p>
              <p className="text-sm text-gray-700 font-medium">{t("people", { count: req.groupSize })}</p>
            </div>
            {req.startDate && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{t("startDateLabel")}</p>
                <p className="text-sm text-gray-700 font-medium">{format(new Date(req.startDate), "MMM d, yyyy")}</p>
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t("messageLabel")}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{req.message}</p>
          </div>

          {/* Interests */}
          {req.interests.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t("interestsLabel")}</p>
              <div className="flex flex-wrap gap-1.5">
                {req.interests.map((i) => (
                  <span key={i} className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quote */}
          {req.quotePrice !== null && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-sm text-blue-800 font-medium">
                  {t("guideQuote")}:{" "}
                  <span className="font-bold">{t("quoteValue", { price: req.quotePrice })}</span>
                </span>
              </div>
              {req.estimatedBudget !== null && (
                <p className="text-xs text-blue-700 pl-6">
                  {t("estimatedBudgetLabel")}:{" "}
                  <span className="font-semibold">{t("estimatedBudgetValue", { budget: req.estimatedBudget })}</span>
                </p>
              )}
              {req.quoteNote && (
                <p className="text-xs text-blue-700 pl-6 leading-relaxed">
                  <span className="font-semibold">{t("quoteNoteLabel")}:</span> {req.quoteNote}
                </p>
              )}
            </div>
          )}

          {/* Decline note */}
          {req.declineNote && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
              <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700 mb-0.5">{t("declineNote")}</p>
                <p className="text-sm text-red-600">{req.declineNote}</p>
              </div>
            </div>
          )}

          {/* Delivered plan */}
          {req.resultPlan && (
            <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-xl border border-teal-100">
              <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-teal-700 mb-0.5">{t("deliveredPlanLabel")}</p>
                <p className="text-sm text-teal-800 font-medium truncate">
                  {req.resultPlan.title ?? t("unnamedPlan", { days: req.resultPlan.duration })}
                </p>
              </div>
              <Link
                href={planHref}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t("viewPlan")}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Action strip */}
      {req.status === "QUOTE_SENT" && (
        <div className="px-5 py-3 bg-blue-50 border-t border-blue-100 flex flex-wrap items-center gap-3">
          <p className="text-sm text-blue-800 flex-1 font-medium">
            {t("quotePrompt", { price: req.quotePrice ?? 0 })}
          </p>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {t("cancelRequest")}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("cancelConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("cancelConfirmDesc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancelConfirmKeep")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => act(() => cancelPlanRequest(req.id))}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {t("cancelConfirmAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {req.quotePrice === 0 ? t("confirmFree") : t("confirmQuote")}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {req.quotePrice === 0 ? t("confirmFreeConfirmTitle") : t("confirmQuoteConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {req.quotePrice === 0
                      ? t("confirmFreeConfirmDesc")
                      : t("confirmQuoteConfirmDesc", { price: req.quotePrice ?? 0 })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("goBack")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => act(() => confirmPlanRequestQuote(req.id))}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirmAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {req.status === "PENDING" && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">{t("awaitingGuide")}</p>
          <AlertDialog>
            <AlertDialogTrigger
              disabled={isPending}
              className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
            >
              {t("cancelRequest")}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("cancelConfirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("cancelConfirmDesc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancelConfirmKeep")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => act(() => cancelPlanRequest(req.id))}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {t("cancelConfirmAction")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {req.status === "DELIVERED" && (
        <div className="px-5 py-3 bg-teal-50 border-t border-teal-100 flex flex-wrap items-center gap-3">
          <p className="text-sm text-teal-800 font-medium flex-1">{t("deliveredPrompt")}</p>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-teal-200 bg-white text-teal-700 hover:bg-teal-50 transition-colors disabled:opacity-50"
              >
                {t("requestChanges")}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("requestChangesConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("requestChangesConfirmDesc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="px-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    {t("requestChangesNoteLabel")}
                    <span className="text-gray-400 font-normal ml-1">({t("optional")})</span>
                  </label>
                  <textarea
                    value={changesNote}
                    onChange={(e) => setChangesNote(e.target.value)}
                    placeholder={t("requestChangesNotePlaceholder")}
                    rows={3}
                    maxLength={500}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                  <p className="text-[11px] text-gray-400 text-right mt-0.5">{changesNote.length}/500</p>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("goBack")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => act(() => requestChanges(req.id, changesNote || undefined))}>
                    {t("requestChangesAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("acceptPlan")}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("acceptPlanConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("acceptPlanConfirmDesc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("goBack")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => act(() => completePlanRequest(req.id))}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("acceptPlanAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {req.status === "CHANGES_REQUESTED" && (
        <div className="px-5 py-3 bg-orange-50 border-t border-orange-100">
          <p className="text-xs text-orange-700 font-medium">{t("changesRequestedNote")}</p>
        </div>
      )}

      {req.status === "CONFIRMED" && (
        <div className="px-5 py-3 bg-indigo-50 border-t border-indigo-100">
          <p className="text-xs text-indigo-700 font-medium">{t("confirmedNote")}</p>
        </div>
      )}

      {req.status === "IN_PROGRESS" && (
        <div className="px-5 py-3 bg-purple-50 border-t border-purple-100">
          <p className="text-xs text-purple-700 font-medium">{t("inProgressNote")}</p>
        </div>
      )}

      {req.status === "COMPLETED" && req.resultPlan && (
        <div className="px-5 py-3 bg-green-50 border-t border-green-100 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          <p className="text-xs text-green-700 font-medium flex-1">{t("completedNote")}</p>
          <Link
            href={planHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-900 transition-colors"
          >
            {t("viewPlan")} <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */

export function MyRequestsClient({ requests, locale }: Props) {
  const t = useTranslations("PlannerMyPlans");
  const [tab, setTab]       = useState<"active" | "closed">("active");
  const [version, setVersion] = useState(0);

  // version bump forces re-render of cards after an action
  const onUpdate = () => setVersion((v) => v + 1);

  const active = requests.filter((r) => ACTIVE_STATUSES.includes(r.status));
  const closed = requests.filter((r) => CLOSED_STATUSES.includes(r.status));

  const current = tab === "active" ? active : closed;

  const TAB_ITEMS = [
    { key: "active" as const, label: t("tabActive"), count: active.length },
    { key: "closed" as const, label: t("tabClosed"), count: closed.length },
  ];

  return (
    <div key={version}>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {TAB_ITEMS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {label}
            <span className={[
              "text-xs rounded-full px-2 py-0.5 font-semibold",
              tab === key ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500",
            ].join(" ")}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-100 rounded-2xl text-center px-6">
          <Calendar className="h-10 w-10 text-gray-200 mb-3" />
          <p className="text-sm font-semibold text-gray-600 mb-1">
            {tab === "active" ? t("noActiveRequests") : t("noClosedRequests")}
          </p>
          <p className="text-xs text-gray-400 max-w-xs">
            {tab === "active" ? t("noActiveRequestsDesc") : t("noClosedRequestsDesc")}
          </p>
          {tab === "active" && (
            <Link
              href={`/${locale}/planner/guides`}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              {t("browseGuides")}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {current.map((req) => (
            <RequestCard key={req.id} req={req} locale={locale} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
