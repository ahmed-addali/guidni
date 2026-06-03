"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  acceptPlanRequest,
  declinePlanRequest,
  startPlanRequest,
  deliverPlanRequest,
} from "@/lib/actions/plan-requests";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, ExternalLink, Send, Plus, Loader2 } from "lucide-react";
import { NewGuidePlanModal } from "@/components/partner/NewGuidePlanModal";
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
import type { PlanRequestStatus } from "@prisma/client";

/* ── Types ───────────────────────────────────────────────────────────────────── */

type Request = {
  id:              string;
  requestRef:      string;
  message:         string;
  duration:        number;
  budget:          number;
  groupSize:       number;
  interests:       string[];
  startDate:       string | null;
  status:          PlanRequestStatus;
  quotePrice:      number | null;
  quoteNote:       string | null;
  estimatedBudget: number | null;
  changesNote:     string | null;
  declineNote:     string | null;
  createdAt:       Date;
  user:            { id: string; name: string | null; email: string | null; image: string | null };
  resultPlan:      { id: string; title: string | null } | null;
};

type GuidePlan   = { id: string; title: string | null; duration: number; city: string | null };
type Destination = { id: string; city: string; country: string };

interface Props {
  request:               Request;
  locale:                string;
  plans:                 GuidePlan[];
  destinations:          Destination[];
  defaultDestinationId?: string;
  onUpdate:              () => void;
}

/* ── Status config ───────────────────────────────────────────────────────────── */

const STATUS_LABELS: Record<PlanRequestStatus, { label: string; color: string }> = {
  PENDING:           { label: "Pending",           color: "bg-amber-50 text-amber-700 border-amber-200" },
  QUOTE_SENT:        { label: "Quote sent",         color: "bg-blue-50 text-blue-700 border-blue-200" },
  CONFIRMED:         { label: "Confirmed",          color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  IN_PROGRESS:       { label: "In progress",        color: "bg-purple-50 text-purple-700 border-purple-200" },
  DELIVERED:         { label: "Delivered",          color: "bg-green-50 text-green-700 border-green-200" },
  CHANGES_REQUESTED: { label: "Changes requested",  color: "bg-orange-50 text-orange-700 border-orange-200" },
  COMPLETED:         { label: "Completed",          color: "bg-green-100 text-green-800 border-green-300" },
  DECLINED:          { label: "Declined",           color: "bg-red-50 text-red-700 border-red-200" },
  CANCELLED:         { label: "Cancelled",          color: "bg-gray-100 text-gray-500 border-gray-200" },
};

/* ── Deliver section ─────────────────────────────────────────────────────────── */

function DeliverSection({
  request, locale, plans, destinations, defaultDestinationId, onDelivered,
}: {
  request:               Request;
  locale:                string;
  plans:                 GuidePlan[];
  destinations:          Destination[];
  defaultDestinationId?: string;
  onDelivered:           () => void;
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(request.resultPlan?.id ?? "");
  const [newPlanOpen, setNewPlanOpen]        = useState(false);
  const [isPending, startTransition]         = useTransition();

  const isChanges  = request.status === "CHANGES_REQUESTED";
  const linkedPlan = plans.find((p) => p.id === (request.resultPlan?.id ?? selectedPlanId));

  function handleDeliver() {
    if (!selectedPlanId) { toast.error("Select a plan first"); return; }
    startTransition(async () => {
      const res = await deliverPlanRequest(request.id, selectedPlanId);
      if (!res.success) { toast.error(res.error); return; }
      toast.success(`Plan delivered to ${request.user.name ?? "traveler"}`);
      onDelivered();
    });
  }

  return (
    <div className="pt-3 border-t border-gray-100 space-y-4">
      {isChanges && (
        <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-100 rounded-xl text-xs text-orange-800">
          <span className="shrink-0 mt-0.5">⚠</span>
          <div>
            <p className="font-medium">The traveler requested changes. Update the plan below, then re-deliver.</p>
            {request.changesNote && (
              <p className="mt-1 text-orange-700 italic">&quot;{request.changesNote}&quot;</p>
            )}
          </div>
        </div>
      )}

      {request.resultPlan && (
        <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Linked plan</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {request.resultPlan.title ?? "Untitled plan"}
            </p>
          </div>
          <Link
            href={`/${locale}/planner/${request.resultPlan.id}/edit`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline shrink-0"
          >
            <ExternalLink className="h-3 w-3" />
            Edit plan
          </Link>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {request.resultPlan ? "Or select a different plan" : "Select a plan to deliver"}
        </label>
        {plans.length === 0 ? (
          <p className="text-xs text-gray-400 mb-2">You have no plans yet. Create one below.</p>
        ) : (
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="">— Choose a plan —</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title ?? "Untitled"} · {p.duration} days{p.city ? ` · ${p.city}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedPlanId && selectedPlanId !== request.resultPlan?.id && (
        <Link
          href={`/${locale}/planner/${selectedPlanId}/edit`}
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Open &quot;{linkedPlan?.title ?? "this plan"}&quot; in editor
        </Link>
      )}

      <AlertDialog>
        <AlertDialogTrigger
          disabled={isPending || !selectedPlanId}
          className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {isChanges ? "Re-deliver plan" : "Deliver to traveler"}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isChanges ? "Re-deliver this plan?" : "Deliver plan to traveler?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isChanges
                ? "The traveler will be notified that the updated plan is ready for review."
                : "The traveler will be notified and can review, accept, or request changes."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeliver}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, deliver it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <button
        type="button"
        onClick={() => setNewPlanOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Create new plan
      </button>

      {newPlanOpen && (
        <NewGuidePlanModal
          locale={locale}
          destinations={destinations}
          defaultDestinationId={defaultDestinationId}
          defaultDuration={request.duration}
          onClose={() => setNewPlanOpen(false)}
        />
      )}
    </div>
  );
}

/* ── Main card ───────────────────────────────────────────────────────────────── */

export function RequestCard({ request, locale, plans, destinations, defaultDestinationId, onUpdate }: Props) {
  const [expanded,         setExpanded]         = useState(request.status === "PENDING");
  const [quote,            setQuote]            = useState(request.quotePrice ?? 0);
  const [estimatedBudget,  setEstimatedBudget]  = useState(request.estimatedBudget?.toString() ?? "");
  const [quoteNote,        setQuoteNote]        = useState(request.quoteNote ?? "");
  const [declineReason,    setDeclineReason]    = useState("");
  const [isPending,        startTransition]     = useTransition();

  const status = STATUS_LABELS[request.status];

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptPlanRequest(
        request.id,
        quote,
        quoteNote || undefined,
        estimatedBudget ? Number(estimatedBudget) : undefined
      );
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Quote sent to traveler.");
      onUpdate();
    });
  }

  function handleDecline() {
    startTransition(async () => {
      const result = await declinePlanRequest(request.id, declineReason || undefined);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Request declined.");
      onUpdate();
    });
  }

  function handleStart() {
    startTransition(async () => {
      const result = await startPlanRequest(request.id);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Marked as in progress.");
      onUpdate();
    });
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {request.user.image ? (
            <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0">
              <Image src={request.user.image} alt={request.user.name ?? ""} fill className="object-cover" sizes="36px" />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
              {(request.user.name ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {request.user.name ?? request.user.email ?? "Traveler"}
            </p>
            <p className="text-xs text-gray-400">
              {request.duration} days · {request.groupSize} {request.groupSize === 1 ? "person" : "people"} · TND {request.budget} budget
              {" · "}
              {new Date(request.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", status.color)}>
            {status.label}
          </span>
          {expanded
            ? <ChevronUp   className="h-4 w-4 text-gray-400" />
            : <ChevronDown className="h-4 w-4 text-gray-400" />
          }
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-5">
          {/* Request details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Duration</p>
              <p className="font-medium text-gray-900">{request.duration} days</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Group</p>
              <p className="font-medium text-gray-900">{request.groupSize} people</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Budget</p>
              <p className="font-medium text-gray-900">TND {request.budget}</p>
            </div>
            {request.startDate && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Start date</p>
                <p className="font-medium text-gray-900">{request.startDate}</p>
              </div>
            )}
          </div>

          {/* Interests */}
          {request.interests.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {request.interests.map((i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                    {i.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Their message</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 whitespace-pre-line">
              {request.message}
            </p>
          </div>

          <p className="text-xs text-gray-300 font-mono">{request.requestRef}</p>

          {/* ── Status-specific action areas ── */}

          {request.status === "PENDING" && (
            <div className="pt-4 space-y-4 border-t border-gray-100">
              {/* Fee + estimated budget row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Your service fee (TND)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">TND</span>
                    <input
                      type="number"
                      min={0}
                      value={quote}
                      onChange={(e) => setQuote(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-12 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Set to 0 for a free plan</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Estimated total trip budget{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">~TND</span>
                    <input
                      type="number"
                      min={0}
                      value={estimatedBudget}
                      onChange={(e) => setEstimatedBudget(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full pl-14 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Hint to traveler about total trip cost</p>
                </div>
              </div>

              {/* Quote description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  What&apos;s included in your quote{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  placeholder={`e.g. "3-day plan with 3 curated activities, accommodation recommendations, and airport transfers. I'll personally select the best local spots for your group."`}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <p className="text-[11px] text-gray-400 text-right mt-0.5">{quoteNote.length}/500</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {/* Send quote */}
                <AlertDialog>
                  <AlertDialogTrigger
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {quote === 0 ? "Accept (free)" : `Send quote: TND ${quote}`}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Send this quote?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {quote === 0
                          ? "You're offering this plan for free. The traveler will be notified."
                          : `You're sending a quote of TND ${quote}${estimatedBudget ? ` with an estimated trip budget of ~TND ${estimatedBudget}` : ""}. The traveler will need to confirm before you begin.`}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Go back</AlertDialogCancel>
                      <AlertDialogAction onClick={handleAccept}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, send it"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Decline */}
                <AlertDialog>
                  <AlertDialogTrigger
                    disabled={isPending}
                    className="px-4 py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    Decline
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Decline this request?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The traveler will be notified. You can optionally explain why.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <textarea
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="Reason for declining (optional)"
                      rows={3}
                      maxLength={300}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none mx-4"
                      style={{ width: "calc(100% - 2rem)" }}
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Go back</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDecline}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, decline"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {request.status === "QUOTE_SENT" && (
            <div className="space-y-2">
              <p className="text-sm text-blue-700 bg-blue-50 rounded-xl px-4 py-3">
                Waiting for traveler to confirm your quote of TND {request.quotePrice}
                {request.estimatedBudget ? ` (est. trip budget ~TND ${request.estimatedBudget})` : ""}.
              </p>
              {request.quoteNote && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3 italic">
                  &quot;{request.quoteNote}&quot;
                </p>
              )}
            </div>
          )}

          {request.status === "CONFIRMED" && (
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <p className="text-sm text-indigo-700 font-medium">
                Traveler confirmed your quote of TND {request.quotePrice}. Ready to start building.
              </p>
              <AlertDialog>
                <AlertDialogTrigger
                  disabled={isPending}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  Mark as in progress
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Start working on this plan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the request as in progress. The traveler will see that you&apos;ve started building their plan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Go back</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStart}>
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, start now"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {(request.status === "IN_PROGRESS" || request.status === "CHANGES_REQUESTED") && (
            <DeliverSection
              request={request}
              locale={locale}
              plans={plans}
              destinations={destinations}
              defaultDestinationId={defaultDestinationId}
              onDelivered={onUpdate}
            />
          )}

          {request.status === "DELIVERED" && (
            <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
              Plan delivered — waiting for traveler to accept.
            </p>
          )}

          {request.status === "COMPLETED" && (
            <p className="text-sm text-green-800 bg-green-50 rounded-xl px-4 py-3">
              ✓ Completed. Earnings will be processed in the next payout cycle.
            </p>
          )}

          {request.status === "DECLINED" && request.declineNote && (
            <p className="text-xs text-gray-400 italic">Your note: &quot;{request.declineNote}&quot;</p>
          )}
        </div>
      )}
    </div>
  );
}
