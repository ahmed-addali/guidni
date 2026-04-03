import { cn } from "@/lib/utils";
import type { OrderStatus } from "@prisma/client";

const STYLES: Record<OrderStatus, string> = {
  PENDING:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED:  "bg-green-50  text-green-700  border-green-200",
  PROCESSING: "bg-blue-50   text-blue-700   border-blue-200",
  SHIPPED:    "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED:  "bg-red-50    text-red-600    border-red-200",
  REFUNDED:   "bg-gray-50   text-gray-500   border-gray-200",
};

interface Props {
  status: OrderStatus;
  label:  string;
  className?: string;
}

export function OrderStatusBadge({ status, label, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border",
        STYLES[status],
        className
      )}
    >
      {label}
    </span>
  );
}
