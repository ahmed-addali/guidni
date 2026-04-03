"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FiCalendar, FiUser, FiMapPin } from "react-icons/fi";
import { updateTransferReservationStatus } from "@/lib/actions/transfer-reservations";
import type { BookingStatus } from "@prisma/client";

interface Reservation {
  id:              string;
  bookingRef:      string;
  date:            Date | string;
  time:            string;
  pickupLocation:  string;
  dropoffLocation?: string | null;
  passengers:      number;
  hoursRequested?: number | null;
  flightNumber?:   string | null;
  contactName:     string;
  contactPhone?:   string | null;
  notes?:          string | null;
  totalPrice:      number | { toString(): string };
  status:          BookingStatus;
  user:            { name: string | null; email: string };
}

const STATUS_FILTERS: { value: BookingStatus | "ALL"; label: string }[] = [
  { value: "ALL",       label: "All" },
  { value: "PENDING",   label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
];

const STATUS_BADGE: Record<BookingStatus, string> = {
  PENDING:   "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
  COMPLETED: "bg-gray-100 text-gray-600",
};

export function ReservationsTab({ initialReservations }: { initialReservations: Reservation[] }) {
  const [reservations, setReservations] = useState(initialReservations);
  const [filter, setFilter]             = useState<BookingStatus | "ALL">("ALL");
  const [pending, start]                = useTransition();

  const visible = filter === "ALL" ? reservations : reservations.filter((r) => r.status === filter);

  function updateStatus(id: string, status: "CONFIRMED" | "CANCELLED" | "COMPLETED") {
    start(async () => {
      const res = await updateTransferReservationStatus(id, status);
      if (res.success) {
        setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
        toast.success(`Marked as ${status.toLowerCase()}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === value
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {label}
            {value !== "ALL" && (
              <span className="ml-1.5 opacity-70">
                ({reservations.filter((r) => r.status === value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <p className="text-gray-500 text-sm">No reservations{filter !== "ALL" ? ` with status "${filter.toLowerCase()}"` : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono text-gray-400">{r.bookingRef}</p>
                  <p className="font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                    <FiUser className="h-3.5 w-3.5 text-gray-400" />
                    {r.contactName}
                    {r.contactPhone && <span className="text-sm text-gray-500 font-normal">· {r.contactPhone}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.user.name ?? r.user.email}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[r.status]}`}>
                  {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="h-3.5 w-3.5 text-gray-400" />
                  {new Date(r.date).toLocaleDateString()} at {r.time}
                </span>
                <span>{r.passengers} passenger{r.passengers !== 1 ? "s" : ""}</span>
                {r.hoursRequested && <span>{r.hoursRequested} hr{r.hoursRequested !== 1 ? "s" : ""}</span>}
                {r.flightNumber && <span>✈ {r.flightNumber}</span>}
                <span className="font-semibold text-gray-900">{r.totalPrice.toString()} TND</span>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FiMapPin className="h-3 w-3" /> {r.pickupLocation}
                </span>
                {r.dropoffLocation && (
                  <span>→ {r.dropoffLocation}</span>
                )}
              </div>

              {r.notes && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{r.notes}</p>
              )}

              {r.status === "PENDING" && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => updateStatus(r.id, "CONFIRMED")}
                    disabled={pending}
                    className="flex-1 text-xs font-medium bg-primary text-white rounded-lg py-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, "CANCELLED")}
                    disabled={pending}
                    className="flex-1 text-xs font-medium border border-red-200 text-red-600 rounded-lg py-2 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              )}
              {r.status === "CONFIRMED" && (
                <button
                  onClick={() => updateStatus(r.id, "COMPLETED")}
                  disabled={pending}
                  className="w-full text-xs font-medium border border-gray-200 text-gray-600 rounded-lg py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Mark as completed
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
