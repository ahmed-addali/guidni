import Link from "next/link";
import { FiCalendar, FiUsers } from "react-icons/fi";
import { IoBedOutline } from "react-icons/io5";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { BookingStatus } from "@prisma/client";

interface StayBookingCardProps {
  id: string;
  stayTitle: string;
  location: string;
  coverImageUrl?: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  totalPrice: number;
  status: BookingStatus;
  bookingRef: string;
  locale: string;
  labels: {
    adults: string;
    children: string;
    nights: string;
    viewDetails: string;
    bookingRef: string;
  };
}

export function StayBookingCard({
  id,
  stayTitle,
  location,
  coverImageUrl,
  checkIn,
  checkOut,
  nights,
  adults,
  children,
  totalPrice,
  status,
  bookingRef,
  locale,
  labels,
}: StayBookingCardProps) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <Link
      href={`/${locale}/bookings/stays/${id}`}
      className="flex flex-col sm:flex-row gap-4 border border-gray-100 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
    >
      {coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImageUrl}
          alt={stayTitle}
          className="w-full sm:w-28 h-24 object-cover rounded-md shrink-0"
        />
      )}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">
              {stayTitle}
            </h3>
            {location && (
              <p className="text-xs text-gray-400 mt-0.5">{location}</p>
            )}
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FiCalendar className="h-3 w-3" />
            {fmt(checkIn)} → {fmt(checkOut)}
          </span>
          <span className="flex items-center gap-1">
            <IoBedOutline className="h-3 w-3" />
            {nights} {labels.nights}
          </span>
          <span className="flex items-center gap-1">
            <FiUsers className="h-3 w-3" />
            {adults} {labels.adults}
            {children > 0 ? `, ${children} ${labels.children}` : ""}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-primary text-sm">
              {totalPrice} TND
            </span>
            <span className="text-xs text-gray-400 ml-2">
              {labels.bookingRef} #{bookingRef}
            </span>
          </div>
          <span className="text-xs text-blue-600 hover:underline">
            {labels.viewDetails} →
          </span>
        </div>
      </div>
    </Link>
  );
}
