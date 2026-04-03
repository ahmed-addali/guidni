import { FiCalendar, FiMapPin } from "react-icons/fi";
import { TbRoute } from "react-icons/tb";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { BookingStatus } from "@prisma/client";

const TYPE_LABELS: Record<string, string> = {
  AIRPORT_TRANSFER: "Airport Transfer",
  TAXI:             "City Taxi",
  CHAUFFEUR:        "Private Chauffeur",
  SHUTTLE:          "Shuttle",
};

interface TransferBookingCardProps {
  id:              string;
  transferTitle:   string;
  transferType:    string;
  coverImageUrl?:  string;
  date:            Date;
  time:            string;
  pickupLocation:  string;
  passengers:      number;
  totalPrice:      number;
  status:          BookingStatus;
  bookingRef:      string;
  labels: {
    passengers: string;
    bookingRef:  string;
  };
}

export function TransferBookingCard({
  transferTitle,
  transferType,
  coverImageUrl,
  date,
  time,
  pickupLocation,
  passengers,
  totalPrice,
  status,
  bookingRef,
  labels,
}: TransferBookingCardProps) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="flex flex-col sm:flex-row gap-4 border border-gray-100 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      {coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImageUrl}
          alt={transferTitle}
          className="w-full sm:w-28 h-24 object-cover rounded-md shrink-0"
        />
      ) : (
        <div className="w-full sm:w-28 h-24 rounded-md shrink-0 bg-blue-50 flex items-center justify-center">
          <TbRoute className="h-8 w-8 text-blue-400" />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">{transferTitle}</h3>
            <span className="inline-block mt-0.5 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {TYPE_LABELS[transferType] ?? transferType}
            </span>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FiCalendar className="h-3 w-3" />
            {fmt(date)} at {time}
          </span>
          <span className="flex items-center gap-1">
            <FiMapPin className="h-3 w-3" />
            {pickupLocation}
          </span>
          <span>
            {passengers} {labels.passengers}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-primary text-sm">{totalPrice} TND</span>
            <span className="text-xs text-gray-400 ml-2">
              {labels.bookingRef} #{bookingRef}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
