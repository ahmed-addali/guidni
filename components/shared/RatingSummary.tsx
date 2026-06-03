import { FiStar } from "react-icons/fi";

type Props = {
  averageRating: number;
  nbReviews: number;
  reviews: { rating: number }[];
  labels: {
    reviews: string;
    outOf: string;
  };
};

export function RatingSummary({ averageRating, nbReviews, reviews, labels }: Props) {
  if (nbReviews === 0) return null;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
    pct:
      reviews.length > 0
        ? (reviews.filter((r) => Math.round(r.rating) === star).length / reviews.length) * 100
        : 0,
  }));

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 items-start">
      {/* Big score */}
      <div className="flex flex-col items-center shrink-0">
        <span className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
        <div className="flex items-center gap-0.5 mt-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <FiStar
              key={s}
              className={
                s <= Math.round(averageRating)
                  ? "h-4 w-4 text-yellow-500 fill-yellow-500"
                  : "h-4 w-4 text-gray-200 fill-gray-200"
              }
            />
          ))}
        </div>
        <span className="text-xs text-gray-400 mt-1">
          {nbReviews} {labels.reviews}
        </span>
      </div>

      {/* Distribution bars */}
      <div className="flex-1 w-full space-y-2">
        {distribution.map(({ star, count, pct }) => (
          <div key={star} className="flex items-center gap-3 text-sm">
            <span className="w-3 text-gray-500 shrink-0">{star}</span>
            <FiStar className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-4 text-right text-gray-400 shrink-0">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
