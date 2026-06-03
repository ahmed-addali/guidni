"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FiCalendar } from "react-icons/fi";
import { TbCar } from "react-icons/tb";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { BookingStatus } from "@prisma/client";

interface RentalBookingCardProps {
  id: string;
  rentalTitle: string;
  rentalType: string;
  coverImageUrl?: string;
  startDate: Date;
  endDate: Date;
  days: number;
  totalPrice: number;
  status: BookingStatus;
  bookingRef: string;
  labels: {
    days: string;
    viewDetails: string;
    bookingRef: string;
  };
}

export function RentalBookingCard({
  id,
  rentalTitle,
  rentalType,
  coverImageUrl,
  startDate,
  endDate,
  days,
  totalPrice,
  status,
  bookingRef,
  labels,
}: RentalBookingCardProps) {
  const params = useParams();
  const locale = params.locale as string;
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <Link
      href={`/${locale}/bookings/rentals/${id}`}
      className="flex flex-col sm:flex-row gap-4 border border-gray-100 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
    >
      {coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImageUrl}
          alt={rentalTitle}
          className="w-full sm:w-28 h-24 object-cover rounded-md shrink-0"
        />
      ) : (
        <div className="w-full sm:w-28 h-24 rounded-md shrink-0 bg-teal-50 flex items-center justify-center">
          <TbCar className="h-8 w-8 text-teal-400" />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">{rentalTitle}</h3>
            <span className="inline-block mt-0.5 text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full capitalize">
              {rentalType.toLowerCase()}
            </span>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FiCalendar className="h-3 w-3" />
            {fmt(startDate)} → {fmt(endDate)}
          </span>
          <span className="flex items-center gap-1">
            <TbCar className="h-3 w-3" />
            {days} {labels.days}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-primary text-sm">{totalPrice} TND</span>
            <span className="text-xs text-gray-400 ml-2">
              {labels.bookingRef} #{bookingRef}
            </span>
          </div>
          <span className="text-xs text-blue-600">{labels.viewDetails} →</span>
        </div>
      </div>
    </Link>
  );
}
