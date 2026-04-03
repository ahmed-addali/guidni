"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateBookingStatus } from "@/lib/actions/partner";

type Booking = {
  id: string;
  bookingRef: string;
  title: string;
  date: string;
  checkOut?: string;
  nights?: number;
  amount: number;
  status: string;
  customer: string;
  guests: number;
  type: "activity" | "stay" | "restaurant" | "rental";
  meta?: string; // e.g. reservation time for restaurants
};

const STATUS_TABS = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-green-50  text-green-700  border-green-200",
  CANCELLED: "bg-red-50    text-red-700    border-red-200",
  COMPLETED: "bg-gray-100  text-gray-700   border-gray-200",
};

export function BookingsClient({ bookings }: { bookings: Booking[] }) {
  const [filter, setFilter]     = useState<string>("ALL");
  const [pending, startTransition] = useTransition();
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = filter === "ALL"
    ? bookings
    : bookings.filter((b) => b.status === filter);

  function handleStatusChange(id: string, type: "activity" | "stay" | "restaurant" | "rental", status: string) {
    setUpdating(id);
    startTransition(async () => {
      const res = await updateBookingStatus(id, type, status as any);
      if (res.success) {
        toast.success("Booking updated");
      } else {
        toast.error(res.error ?? "Failed to update");
      }
      setUpdating(null);
    });
  }

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === tab
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
            <span className="ml-1.5 text-xs opacity-70">
              ({tab === "ALL" ? bookings.length : bookings.filter((b) => b.status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-16 text-center text-sm text-gray-400">
          No bookings found.
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Ref</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Listing</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Guests</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Amount</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{b.bookingRef}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-800 truncate max-w-[180px]">{b.title}</div>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                        b.type === "activity"   ? "bg-blue-50 text-blue-600" :
                        b.type === "stay"       ? "bg-purple-50 text-purple-600" :
                        b.type === "restaurant" ? "bg-orange-50 text-orange-600" :
                                                  "bg-teal-50 text-teal-600"
                      }`}>
                        {b.type.charAt(0).toUpperCase() + b.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 truncate max-w-[140px]">{b.customer}</td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                      {new Date(b.date).toLocaleDateString()}
                      {b.meta && <span className="text-gray-400"> {b.meta}</span>}
                      {b.checkOut && !b.meta && (
                        <span className="text-gray-400"> → {new Date(b.checkOut).toLocaleDateString()}</span>
                      )}
                      {b.nights != null && (
                        <div className="text-xs text-gray-400">
                          {b.type === "rental" ? `${b.nights} day${b.nights !== 1 ? "s" : ""}` : `${b.nights} nights`}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-center">{b.guests}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-700">
                      {b.amount > 0 ? `${b.amount.toLocaleString()} TND` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[b.status] ?? ""}`}>
                        {b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {b.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={updating === b.id || pending}
                            onClick={() => handleStatusChange(b.id, b.type as never, "CONFIRMED")}
                            className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            disabled={updating === b.id || pending}
                            onClick={() => handleStatusChange(b.id, b.type as never, "CANCELLED")}
                            className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {b.status === "CONFIRMED" && (
                        <button
                          disabled={updating === b.id || pending}
                          onClick={() => handleStatusChange(b.id, b.type as never, "COMPLETED")}
                          className="text-xs bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          Mark done
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
