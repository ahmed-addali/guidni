import { cn } from "@/lib/utils";
import type { BookingStatus } from "@prisma/client";

type ListingStatus = "DRAFT" | "ACTIVE" | "SUSPENDED";

const BOOKING_STYLES: Record<BookingStatus, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-800",
};

const LISTING_STYLES: Record<ListingStatus, string> = {
  DRAFT:     "bg-gray-100 text-gray-600",
  ACTIVE:    "bg-green-100 text-green-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

interface StatusBadgeProps {
  status: BookingStatus | ListingStatus;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const cls =
    status in BOOKING_STYLES
      ? BOOKING_STYLES[status as BookingStatus]
      : LISTING_STYLES[status as ListingStatus] ?? "bg-gray-100 text-gray-600";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        cls
      )}
    >
      {label ?? status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
