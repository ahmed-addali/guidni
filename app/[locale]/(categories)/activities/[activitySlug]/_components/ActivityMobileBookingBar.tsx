"use client";

import { FiStar } from "react-icons/fi";

type Props = {
  price: number;
  averageRating: number | null;
  nbReviews: number;
  labels: {
    perPerson: string;
    bookNow: string;
    reviews: string;
  };
};

export function ActivityMobileBookingBar({ price, averageRating, nbReviews, labels }: Props) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    document.getElementById("booking-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-4 py-3 flex items-center justify-between">
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-gray-900">{price} TND</span>
          <span className="text-sm text-gray-400">{labels.perPerson}</span>
        </div>
        {averageRating && averageRating > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <FiStar className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-medium text-gray-700">{averageRating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">· {nbReviews} {labels.reviews}</span>
          </div>
        )}
      </div>

      <a
        href="#booking-card"
        onClick={handleClick}
        className="bg-primary text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        {labels.bookNow}
      </a>
    </div>
  );
}
