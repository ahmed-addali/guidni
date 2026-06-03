import Link from "next/link";
import { FiCalendar, FiClock, FiUsers } from "react-icons/fi";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { BookingStatus } from "@prisma/client";

interface ActivityBookingCardProps {
  id: string;
  activityTitle: string;
  coverImageUrl?: string;
  date: Date;
  time: string;
  adults: number;
  children: number;
  totalPrice: number;
  status: BookingStatus;
  locale: string;
  labels: {
    adults: string;
    children: string;
    viewDetails: string;
  };
}

export function ActivityBookingCard({
  id,
  activityTitle,
  coverImageUrl,
  date,
  time,
  adults,
  children,
  totalPrice,
  status,
  locale,
  labels,
}: ActivityBookingCardProps) {
  const displayDate = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/${locale}/bookings/activity/${id}`}
      className="flex flex-col sm:flex-row gap-4 border border-gray-100 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
    >
      {coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImageUrl}
          alt={activityTitle}
          className="w-full sm:w-28 h-24 object-cover rounded-md shrink-0"
        />
      )}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">
            {activityTitle}
          </h3>
          <StatusBadge status={status} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FiCalendar className="h-3 w-3" />
            {displayDate}
          </span>
          <span className="flex items-center gap-1">
            <FiClock className="h-3 w-3" />
            {time}
          </span>
          <span className="flex items-center gap-1">
            <FiUsers className="h-3 w-3" />
            {adults} {labels.adults}
            {children > 0 ? `, ${children} ${labels.children}` : ""}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-primary text-sm">
            {totalPrice} TND
          </span>
          <span className="text-xs text-blue-600 hover:underline">
            {labels.viewDetails} →
          </span>
        </div>
      </div>
    </Link>
  );
}
