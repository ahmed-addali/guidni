import { BookOpen, Star, CheckCircle, AlertCircle, Users } from "lucide-react";
import type { getGuidniReview } from "@/lib/actions/badges";

type GuidniReviewData = NonNullable<Awaited<ReturnType<typeof getGuidniReview>>>;

interface Props {
  review: GuidniReviewData;
  labels: {
    title: string;
    by: string;
    visited: string;
    score: string;
    accuracy: string;
    quality: string;
    value: string;
    presentation: string;
    host: string;
    fullReview: string;
    loved: string;
    worth: string;
    bestFor: string;
    partnerReply: string;
    outOf: string;
  };
}

function ScoreBar({ label, score }: { label: string; score: number | null | undefined }) {
  if (score === null || score === undefined) return null;
  const display = (score / 10).toFixed(1);
  const pct = score; // score is 0-100
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-900 w-8 text-right">{display}</span>
    </div>
  );
}

export function GuidniReviewSection({ review, labels }: Props) {
  const totalDisplay = review.scoreTotal ? (review.scoreTotal / 10).toFixed(1) : null;

  const lovedItems = review.whatWeLoved
    ? review.whatWeLoved.split("\n").filter(Boolean)
    : [];
  const worthItems = review.worthKnowing
    ? review.worthKnowing.split("\n").filter(Boolean)
    : [];
  const bestForItems = review.bestFor
    ? review.bestFor
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const visitDate = review.visitedAt
    ? new Date(review.visitedAt).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : review.season;

  return (
    <div className="border border-primary/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-5 w-5 text-white" />
          <span className="text-white font-semibold text-base">{labels.title}</span>
        </div>
        {totalDisplay && (
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-300 fill-amber-300" />
            <span className="text-white font-bold text-lg">{totalDisplay}</span>
            <span className="text-white/60 text-sm">{labels.outOf}</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6 bg-white">
        {/* Reviewer + date */}
        {(review.reviewerName || visitDate) && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {review.reviewerName && (
              <span>
                {labels.by}{" "}
                <span className="font-medium text-gray-700">{review.reviewerName}</span>
                {review.reviewerTitle && (
                  <span className="text-gray-400"> · {review.reviewerTitle}</span>
                )}
              </span>
            )}
            {visitDate && (
              <span className="text-gray-400">
                {review.reviewerName ? "·" : ""} {labels.visited} {visitDate}
              </span>
            )}
          </div>
        )}

        {/* Pull quote */}
        {review.summaryQuote && (
          <blockquote className="border-l-4 border-primary/30 pl-4 italic text-gray-700 text-base leading-relaxed">
            &ldquo;{review.summaryQuote}&rdquo;
          </blockquote>
        )}

        {/* Score breakdown */}
        {review.scoreTotal !== null && review.scoreTotal !== undefined && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {labels.score}
            </p>
            <ScoreBar label={labels.accuracy} score={review.scoreAccuracy} />
            <ScoreBar label={labels.quality} score={review.scoreQuality} />
            <ScoreBar label={labels.value} score={review.scoreValue} />
            <ScoreBar label={labels.presentation} score={review.scorePresent} />
            <ScoreBar label={labels.host} score={review.scoreHost} />
          </div>
        )}

        {/* Full review */}
        {review.fullReview && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {labels.fullReview}
            </h4>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{review.fullReview}</p>
          </div>
        )}

        {/* Photo strip */}
        {review.images.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {review.images.map((img) => (
              <div key={img.id} className="shrink-0 w-40 h-28 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Loved + Worth knowing */}
        {(lovedItems.length > 0 || worthItems.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lovedItems.length > 0 && (
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-semibold text-green-700">{labels.loved}</p>
                </div>
                <ul className="space-y-1.5">
                  {lovedItems.map((item, i) => (
                    <li key={i} className="text-sm text-green-800 flex gap-2">
                      <span className="text-green-500 shrink-0">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {worthItems.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-700">{labels.worth}</p>
                </div>
                <ul className="space-y-1.5">
                  {worthItems.map((item, i) => (
                    <li key={i} className="text-sm text-amber-800 flex gap-2">
                      <span className="text-amber-500 shrink-0">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Best for */}
        {bestForItems.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-500 shrink-0">{labels.bestFor}:</span>
            {bestForItems.map((item) => (
              <span key={item} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Partner response */}
        {review.partnerResponse && (
          <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {labels.partnerReply}
            </p>
            <p className="text-sm text-gray-700">{review.partnerResponse}</p>
            {review.partnerResponseDate && (
              <p className="text-xs text-gray-400 mt-1">
                {new Date(review.partnerResponseDate).toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
