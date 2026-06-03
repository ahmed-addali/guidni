import Link from "next/link";
import { FiCalendar, FiUsers, FiClock } from "react-icons/fi";
import { FaTicket } from "react-icons/fa6";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { BookingStatus } from "@prisma/client";

interface PassBookingCardProps {
  bookingRef: string;
  passName: string;
  passKey: string;
  date: Date;
  expiresAt: Date;
  participants: number;
  totalPrice: number;
  status: BookingStatus;
  locale: string;
  labels: {
    participants: string;
    validUntil: string;
    viewDetails: string;
  };
}

export function PassBookingCard({
  bookingRef,
  passName,
  passKey,
  date,
  expiresAt,
  participants,
  totalPrice,
  status,
  locale,
  labels,
}: PassBookingCardProps) {
  const displayDate = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const displayExpiry = expiresAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/${locale}/bookings/pass/${bookingRef}`}
      className="flex flex-col sm:flex-row gap-4 border border-gray-100 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
    >
      {/* Icon placeholder */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/5 border border-primary/10">
        <FaTicket className="h-7 w-7 text-primary" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">{passName}</h3>
            <p className="text-xs text-gray-400 font-mono">{bookingRef}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FiCalendar className="h-3 w-3" />
            {displayDate}
          </span>
          <span className="flex items-center gap-1">
            <FiClock className="h-3 w-3" />
            {labels.validUntil} {displayExpiry}
          </span>
          <span className="flex items-center gap-1">
            <FiUsers className="h-3 w-3" />
            {participants} {labels.participants}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-primary text-sm">{totalPrice} TND</span>
          <span className="text-xs text-blue-600 hover:underline">{labels.viewDetails} →</span>
        </div>
      </div>
    </Link>
  );
}
