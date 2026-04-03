import { FiStar } from "react-icons/fi";

type Props = {
  note: string | null;
  nbReviews: number;
  reservationsEnabled: boolean;
  labels: {
    bookTable: string;
    viewMenu: string;
    reviews: string;
  };
};

export function RestaurantMobileBar({ note, nbReviews, reservationsEnabled, labels }: Props) {
  const rating = note ? parseFloat(note) : 0;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-4">
      <div>
        {rating > 0 && nbReviews > 0 ? (
          <a href="#reviews-section" className="flex items-center gap-1 text-sm text-gray-600 hover:underline">
            <FiStar className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
            <span className="text-gray-400">· {nbReviews} {labels.reviews}</span>
          </a>
        ) : (
          <span className="text-sm text-gray-400">{labels.reviews}</span>
        )}
      </div>
      <a
        href={reservationsEnabled ? "#reservation-widget" : "#menu-section"}
        className="shrink-0 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
      >
        {reservationsEnabled ? labels.bookTable : labels.viewMenu}
      </a>
    </div>
  );
}
