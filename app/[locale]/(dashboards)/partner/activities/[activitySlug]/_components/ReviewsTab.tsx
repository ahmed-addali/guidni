"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiStar, FiMessageSquare, FiSend, FiCheckCircle, FiClock } from "react-icons/fi";
import { BookOpen } from "lucide-react";
import { addPartnerReply } from "@/lib/actions/reviews";
import { RequestReviewDialog } from "@/components/partner/RequestReviewDialog";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  response: string | null;
  createdAt: Date;
  user: { name: string | null; image: string | null };
};

type GuidniReview = {
  id: string;
  status: string;
  reviewerName: string | null;
  visitedAt: Date | null;
  summaryQuote: string | null;
  fullReview: string | null;
  whatWeLoved: string | null;
  worthKnowing: string | null;
  bestFor: string | null;
  scoreTotal: number | null;
  publishedAt: Date | null;
  images: { url: string }[];
} | null;

type Props = {
  reviews: Review[];
  guidniReview: GuidniReview;
  activityId: string;
};

// ── helpers ──────────────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <FiStar
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:      "bg-gray-100 text-gray-600",
  SCHEDULED:    "bg-blue-50 text-blue-600",
  UNDER_REVIEW: "bg-amber-50 text-amber-600",
  PUBLISHED:    "bg-green-50 text-green-600",
  WITHDRAWN:    "bg-red-50 text-red-600",
};

// ── Guidni Review section ─────────────────────────────────────────────────────

function GuidniReviewSection({
  guidniReview,
  activityId,
}: {
  guidniReview: GuidniReview;
  activityId: string;
}) {
  const t = useTranslations("PartnerDashboard.editActivity.reviews");
  const tDialog = useTranslations("Components.requestReviewDialog");
  const statusKey = guidniReview?.status ?? "PENDING";
  const status = guidniReview
    ? { label: t(`guidni.statuses.${statusKey}` as Parameters<typeof t>[0]), color: STATUS_COLOR[statusKey] ?? STATUS_COLOR.PENDING }
    : null;
  const isPublished = guidniReview?.status === "PUBLISHED";

  return (
    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">{t("guidni.title")}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {guidniReview ? t("guidni.hasReviewHint") : t("guidni.noReviewHint")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status badge */}
          {status && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
              {isPublished
                ? <FiCheckCircle className="h-3.5 w-3.5" />
                : <FiClock className="h-3.5 w-3.5" />}
              {status.label}
            </span>
          )}

          {/* Request / Request new */}
          <RequestReviewDialog
            listingId={activityId}
            relationType="ACTIVITY"
            offerHint={tDialog("activityOfferHint")}
          />
        </div>
      </div>

      {/* Published review details */}
      {isPublished && guidniReview && (
        <div className="space-y-3 pt-1 border-t border-primary/10">
          {guidniReview.reviewerName && (
            <p className="text-xs text-gray-500">
              {t("guidni.by")} <span className="font-medium text-gray-700">{guidniReview.reviewerName}</span>
              {guidniReview.visitedAt && (
                <> · {t("guidni.visited")} {new Date(guidniReview.visitedAt).toLocaleDateString()}</>
              )}
            </p>
          )}
          {guidniReview.summaryQuote && (
            <p className="text-sm text-gray-700 italic">"{guidniReview.summaryQuote}"</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {guidniReview.whatWeLoved && (
              <div className="bg-white rounded-xl p-3 space-y-1 border border-primary/10">
                <p className="text-xs font-semibold text-primary">{t("guidni.whatWeLoved")}</p>
                <p className="text-xs text-gray-600">{guidniReview.whatWeLoved}</p>
              </div>
            )}
            {guidniReview.worthKnowing && (
              <div className="bg-white rounded-xl p-3 space-y-1 border border-primary/10">
                <p className="text-xs font-semibold text-primary">{t("guidni.worthKnowing")}</p>
                <p className="text-xs text-gray-600">{guidniReview.worthKnowing}</p>
              </div>
            )}
            {guidniReview.bestFor && (
              <div className="bg-white rounded-xl p-3 space-y-1 border border-primary/10">
                <p className="text-xs font-semibold text-primary">{t("guidni.bestFor")}</p>
                <p className="text-xs text-gray-600">{guidniReview.bestFor}</p>
              </div>
            )}
          </div>
          {guidniReview.scoreTotal != null && (
            <p className="text-xs text-gray-500">
              {t("guidni.scoreLabel")} <span className="font-semibold text-gray-800">{guidniReview.scoreTotal} {t("guidni.scoreMax")}</span>
            </p>
          )}
        </div>
      )}

      {/* Pending/in-progress state */}
      {guidniReview && !isPublished && (
        <p className="text-xs text-gray-500 pt-1 border-t border-primary/10">
          {t("guidni.pendingNote")}
        </p>
      )}
    </div>
  );
}

// ── Guest review card ─────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const t = useTranslations("PartnerDashboard.editActivity.reviews");
  const [reply, setReply]     = useState(review.response ?? "");
  const [editing, setEditing] = useState(!review.response);
  const [pending, start]      = useTransition();

  function handleSave() {
    if (!reply.trim()) return;
    start(async () => {
      const res = await addPartnerReply(review.id, reply.trim());
      if (res.success) {
        toast.success(t("guest.saveSuccess"));
        setEditing(false);
      } else {
        toast.error(res.error ?? t("guest.saveFailed"));
      }
    });
  }

  return (
    <div className="space-y-3 py-5 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {review.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={review.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500">
              {(review.user.name ?? "G").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-800">{review.user.name ?? t("guest.guestFallback")}</p>
            <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <StarRow rating={review.rating} />
      </div>

      {review.title && <p className="text-sm font-semibold text-gray-800">{review.title}</p>}
      {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}

      <div className="pl-4 border-l-2 border-gray-100">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              placeholder={t("guest.responsePlaceholder")}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={pending || !reply.trim()}
                className="inline-flex items-center gap-1.5 text-sm font-medium bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <FiSend className="h-3.5 w-3.5" />
                {pending ? t("guest.saving") : t("guest.saveResponse")}
              </button>
              {review.response && (
                <button
                  type="button"
                  onClick={() => { setReply(review.response!); setEditing(false); }}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {t("guest.cancel")}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500">{t("guest.yourResponse")}</p>
            <p className="text-sm text-gray-600">{reply}</p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-blue-600 hover:underline"
            >
              {t("guest.editResponse")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ReviewsTab({ reviews, guidniReview, activityId }: Props) {
  const t = useTranslations("PartnerDashboard.editActivity.reviews");
  const avg       = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const unanswered = reviews.filter((r) => !r.response).length;

  return (
    <div className="space-y-6">
      {/* Guidni Review — always shown */}
      <GuidniReviewSection guidniReview={guidniReview} activityId={activityId} />

      {/* Guest reviews */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">{t("guest.title")}</p>
          {avg && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">{avg}</span>
              <StarRow rating={Math.round(Number(avg))} />
              <span className="text-xs text-gray-400">
                {reviews.length} {t(reviews.length !== 1 ? "guest.reviewPlural" : "guest.reviewSingular")}
              </span>
              {unanswered > 0 && (
                <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
                  {t("guest.awaitingReply", { count: unanswered })}
                </span>
              )}
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <FiMessageSquare className="h-8 w-8 text-gray-200" />
            <p className="text-sm text-gray-400">{t("guest.empty")}</p>
          </div>
        ) : (
          <div>
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
