"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { FiCalendar, FiUsers, FiClock, FiPhone, FiMessageSquare, FiCheck, FiX } from "react-icons/fi";
import { updateReservationStatus, type PartnerReservationRow } from "@/lib/actions/restaurant-reservations";
import { BookingStatus } from "@prisma/client";

type Tab = "all" | BookingStatus;

interface Props {
  initialReservations: PartnerReservationRow[];
  locale?: string;
}

export function ReservationsTab({ initialReservations, locale = "en" }: Props) {
  const t = useTranslations("PartnerDashboard.editRestaurant.reservations");
  const [reservations, setReservations] = useState(initialReservations);
  const [activeTab, setActiveTab]       = useState<Tab>("all");
  const [pending, start]                = useTransition();
  const [updating, setUpdating]         = useState<string | null>(null);

  const STATUS_LABELS: Record<BookingStatus, { label: string; classes: string }> = {
    PENDING:   { label: t("statusLabels.PENDING"),   classes: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
    CONFIRMED: { label: t("statusLabels.CONFIRMED"), classes: "bg-green-50 text-green-700 border border-green-200" },
    CANCELLED: { label: t("statusLabels.CANCELLED"), classes: "bg-red-50 text-red-600 border border-red-200" },
    COMPLETED: { label: t("statusLabels.COMPLETED"), classes: "bg-gray-50 text-gray-600 border border-gray-200" },
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "all",       label: t("tabs.all") },
    { key: "PENDING",   label: t("tabs.pending") },
    { key: "CONFIRMED", label: t("tabs.confirmed") },
    { key: "CANCELLED", label: t("tabs.cancelled") },
    { key: "COMPLETED", label: t("tabs.completed") },
  ];

  const filtered = activeTab === "all"
    ? reservations
    : reservations.filter((r) => r.status === activeTab);

  function handleStatusChange(id: string, status: BookingStatus) {
    setUpdating(id);
    start(async () => {
      const result = await updateReservationStatus(id, status);
      if (result.success) {
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
        toast.success(STATUS_LABELS[status].label);
      } else {
        toast.error(result.error);
      }
      setUpdating(null);
    });
  }

  const counts: Record<Tab, number> = {
    all:       reservations.length,
    PENDING:   reservations.filter((r) => r.status === "PENDING").length,
    CONFIRMED: reservations.filter((r) => r.status === "CONFIRMED").length,
    CANCELLED: reservations.filter((r) => r.status === "CANCELLED").length,
    COMPLETED: reservations.filter((r) => r.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({counts[key]})</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FiCalendar className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((res) => {
            const { label, classes } = STATUS_LABELS[res.status];
            const isUpdating = updating === res.id && pending;

            return (
              <div
                key={res.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
              >
                {/* Left — info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{res.user.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${classes}`}>
                      {label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FiCalendar className="h-3.5 w-3.5" />
                      {new Date(res.date).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock className="h-3.5 w-3.5" />
                      {res.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiUsers className="h-3.5 w-3.5" />
                      {res.guests} {res.guests === 1 ? t("guest") : t("guests")}
                    </span>
                  </div>

                  {res.phone && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <FiPhone className="h-3 w-3" /> {res.phone}
                    </p>
                  )}
                  {res.notes && (
                    <p className="text-xs text-gray-400 flex items-start gap-1">
                      <FiMessageSquare className="h-3 w-3 mt-0.5 shrink-0" /> {res.notes}
                    </p>
                  )}

                  <p className="text-xs text-gray-300">
                    {res.user.email} · {t("booked")} {new Date(res.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Right — actions */}
                {res.status === "PENDING" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(res.id, "CONFIRMED")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      <FiCheck className="h-4 w-4" /> {t("confirm")}
                    </button>
                    <button
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(res.id, "CANCELLED")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <FiX className="h-4 w-4" /> {t("decline")}
                    </button>
                  </div>
                )}
                {res.status === "CONFIRMED" && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(res.id, "COMPLETED")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 border border-gray-200 text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 shrink-0"
                  >
                    <FiCheck className="h-4 w-4" /> {t("markCompleted")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
