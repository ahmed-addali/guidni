import { cn } from "@/lib/utils";
import type { BookingStatus } from "@prisma/client";

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-800",
};

interface StatusBadgeProps {
  status: BookingStatus;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        STATUS_STYLES[status]
      )}
    >
      {label ?? status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
