"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiStar, FiMessageSquare, FiSend } from "react-icons/fi";
import { addPartnerReply } from "@/lib/actions/reviews";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  response: string | null;
  createdAt: string;
  user: { name: string | null; image: string | null };
};

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

function ReviewCard({ review }: { review: Review }) {
  const t = useTranslations("PartnerDashboard.guideReviews");
  const [reply,   setReply]   = useState(review.response ?? "");
  const [editing, setEditing] = useState(!review.response);
  const [pending, start]      = useTransition();

  function handleSave() {
    if (!reply.trim()) return;
    start(async () => {
      const res = await addPartnerReply(review.id, reply.trim());
      if (res.success) {
        toast.success(t("saveSuccess"));
        setEditing(false);
      } else {
        toast.error(res.error ?? t("saveFailed"));
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
            <p className="text-sm font-medium text-gray-800">{review.user.name ?? t("guestFallback")}</p>
            <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <StarRow rating={review.rating} />
      </div>

      {review.title   && <p className="text-sm font-semibold text-gray-800">{review.title}</p>}
      {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}

      <div className="pl-4 border-l-2 border-gray-100">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              placeholder={t("responsePlaceholder")}
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
                {pending ? t("saving") : t("saveResponse")}
              </button>
              {review.response && (
                <button
                  type="button"
                  onClick={() => { setReply(review.response!); setEditing(false); }}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {t("cancel")}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500">{t("yourResponse")}</p>
            <p className="text-sm text-gray-600">{reply}</p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-blue-600 hover:underline"
            >
              {t("editResponse")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function GuideReviewsClient({ reviews }: { reviews: Review[] }) {
  const t = useTranslations("PartnerDashboard.guideReviews");

  const avg        = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const unanswered = reviews.filter((r) => !r.response).length;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      {/* Rating summary */}
      {avg && (
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
          <span className="text-3xl font-bold text-gray-900">{avg}</span>
          <div>
            <StarRow rating={Math.round(Number(avg))} />
            <p className="text-xs text-gray-400 mt-1">
              {reviews.length} {reviews.length !== 1 ? "reviews" : "review"}
              {unanswered > 0 && (
                <span className="ml-2 text-orange-600 font-medium">
                  · {t("awaitingReply", { count: unanswered })}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Guest reviews heading */}
      <p className="text-sm font-semibold text-gray-800 mb-1">{t("guestTitle")}</p>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <FiMessageSquare className="h-8 w-8 text-gray-200" />
          <p className="text-sm text-gray-400">{t("guestEmpty")}</p>
        </div>
      ) : (
        <div>
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}
