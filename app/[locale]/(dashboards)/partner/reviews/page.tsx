import { FiStar } from "react-icons/fi";
import { getPartnerReviews } from "@/lib/actions/partner";
import { ReviewReplyForm } from "./_components/ReviewReplyForm";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  return { title: "Reviews · Partner Dashboard" };
}

export default async function PartnerReviewsPage() {
  const reviews = await getPartnerReviews();

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const pending = reviews.filter((r) => !r.response).length;

  return (
    <div className="space-y-6 max-w-screen-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-400 mt-1">
            {reviews.length} total · {avgRating.toFixed(1)} avg rating
          </p>
        </div>
        {pending > 0 && (
          <div className="bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2 rounded-xl font-medium">
            {pending} review{pending > 1 ? "s" : ""} awaiting reply
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-16 text-center text-sm text-gray-400">
          No reviews yet. Reviews from your customers will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 space-y-2"
            >
              {/* Header row */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {(r.user.name ?? "G").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{r.user.name ?? "Guest"}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString()} ·{" "}
                      <span className="capitalize">{r.relationType.toLowerCase()}</span>
                    </p>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FiStar
                      key={i}
                      className={`h-4 w-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                    />
                  ))}
                  <span className="ml-1.5 text-sm font-semibold text-gray-700">
                    {r.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Review content */}
              {r.title && (
                <p className="font-semibold text-gray-800">{r.title}</p>
              )}
              <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>

              {/* Reply form */}
              <ReviewReplyForm
                reviewId={r.id}
                existingResponse={r.response}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
