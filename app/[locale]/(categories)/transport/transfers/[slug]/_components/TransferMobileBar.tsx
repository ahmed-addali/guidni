import { FiStar } from "react-icons/fi";

type Props = {
  note: string | null;
  nbReviews: number;
  pricePerTrip: number | null;
  pricePerHour: number | null;
  type: string;
  labels: {
    book: string;
    reviews: string;
    perTrip: string;
    perHour: string;
  };
};

export function TransferMobileBar({ note, nbReviews, pricePerTrip, pricePerHour, type, labels }: Props) {
  const rating = note ? parseFloat(note) : 0;
  const displayPrice = type === "CHAUFFEUR" ? pricePerHour : pricePerTrip;
  const displayLabel = type === "CHAUFFEUR" ? labels.perHour : labels.perTrip;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-4">
      <div>
        {(rating ?? 0) > 0 && nbReviews > 0 ? (
          <a href="#reviews-section" className="flex items-center gap-1 text-sm text-gray-600 hover:underline">
            <FiStar className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
            <span className="text-gray-400">· {nbReviews} {labels.reviews}</span>
          </a>
        ) : displayPrice ? (
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-gray-900">{displayPrice} TND</span>
            <span className="text-xs text-gray-400">{displayLabel}</span>
          </div>
        ) : null}
      </div>
      <a
        href="#booking-widget"
        className="shrink-0 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
      >
        {labels.book}
      </a>
    </div>
  );
}
