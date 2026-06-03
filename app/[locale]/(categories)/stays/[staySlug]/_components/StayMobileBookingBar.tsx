import { FiStar } from "react-icons/fi";

type Props = {
  price: number;
  averageRating?: number | null;
  nbReviews: number;
  labels: {
    perNight: string;
    bookNow: string;
    reviews: string;
  };
};

export function StayMobileBookingBar({ price, averageRating, nbReviews, labels }: Props) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-gray-900">{price} TND</span>
          <span className="text-sm text-gray-400">{labels.perNight}</span>
        </div>
        {(averageRating ?? 0) > 0 && nbReviews > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <FiStar className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span className="font-medium text-gray-700">{averageRating!.toFixed(1)}</span>
            <span>· {nbReviews} {labels.reviews}</span>
          </div>
        )}
      </div>
      <a
        href="#booking-card"
        className="shrink-0 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
      >
        {labels.bookNow}
      </a>
    </div>
  );
}
