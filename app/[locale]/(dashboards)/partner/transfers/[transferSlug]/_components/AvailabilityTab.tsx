"use client";

import { useState, useTransition, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
  getDay,
  parseISO,
} from "date-fns";
import { enUS, fr, arTN } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, ArrowLeft, Clock, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleTransferBlockedDate } from "@/lib/actions/partner-transfers";

const DAY_HEADERS = {
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  fr: ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"],
  ar: ["إث", "ثل", "أر", "خم", "جم", "سب", "أح"],
};

type TransferType = "AIRPORT_TRANSFER" | "TAXI" | "CHAUFFEUR" | "SHUTTLE";

interface Reservation {
  date:           string;
  time:           string;
  status:         string;
  bookingRef:     string;
  passengers:     number;
  hoursRequested: number | null;
  contactName:    string;
}

interface Props {
  transferId:          string;
  transferType:        TransferType;
  locale:              string;
  initialBlockedDates: string[];
  initialReservations: Reservation[];
}

function toMins(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

/** Horizontal 24h timeline strip showing booked blocks */
function TimelineStrip({
  reservations,
  isChauffeur,
}: {
  reservations: Reservation[];
  isChauffeur:  boolean;
}) {
  const TOTAL_MINS = 24 * 60;
  // Hour tick labels
  const ticks = [0, 6, 12, 18, 24];

  return (
    <div className="space-y-1">
      {/* Bar */}
      <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
        {reservations.map((r) => {
          const startMins  = toMins(r.time);
          const durationMins = isChauffeur ? (r.hoursRequested ?? 1) * 60 : 45; // non-chauffeur: 45min block for visual
          const leftPct  = (startMins / TOTAL_MINS) * 100;
          const widthPct = Math.max((durationMins / TOTAL_MINS) * 100, 1);
          return (
            <div
              key={r.bookingRef}
              title={`${r.time} · ${r.bookingRef}`}
              className={cn(
                "absolute top-0 h-full",
                r.status === "CONFIRMED" ? "bg-primary/70" : "bg-amber-400/80"
              )}
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            />
          );
        })}
      </div>
      {/* Hour ticks */}
      <div className="relative flex justify-between px-0.5">
        {ticks.map((h) => (
          <span key={h} className="text-[9px] text-gray-400">{String(h).padStart(2, "0")}:00</span>
        ))}
      </div>
    </div>
  );
}

export function AvailabilityTab({
  transferId,
  transferType,
  locale,
  initialBlockedDates,
  initialReservations,
}: Props) {
  const t = useTranslations("PartnerDashboard.editTransfer.availability");
  const [, start]        = useTransition();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blocked,  setBlocked]  = useState<Set<string>>(new Set(initialBlockedDates));
  const [toggling, setToggling] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const isChauffeur = transferType === "CHAUFFEUR";
  const loc         = locale as "en" | "fr" | "ar";
  const dfnsLocale  = loc === "fr" ? fr : loc === "ar" ? arTN : enUS;
  const isRtl       = loc === "ar";
  const today       = startOfDay(new Date());

  // ── Reservation sets per date ────────────────────────────────────────
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of initialReservations) {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push(r);
    }
    return map;
  }, [initialReservations]);

  // Confirmed / pending date sets for calendar colouring
  const { confirmedSet, pendingSet } = useMemo(() => {
    const confirmed = new Set<string>();
    const pending   = new Set<string>();
    for (const r of initialReservations) {
      if (r.status === "CONFIRMED") confirmed.add(r.date);
      else                          pending.add(r.date);
    }
    return { confirmedSet: confirmed, pendingSet: pending };
  }, [initialReservations]);

  // ── Calendar helpers ─────────────────────────────────────────────────
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const rawDay = getDay(monthStart);
  const offset = rawDay === 0 ? 6 : rawDay - 1;

  const headers  = DAY_HEADERS[loc] ?? DAY_HEADERS.en;
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft  : ChevronRight;

  // ── Day select handler ───────────────────────────────────────────────
  const handleDayClick = useCallback((day: Date) => {
    if (isBefore(startOfDay(day), today)) return;
    const dateStr = format(day, "yyyy-MM-dd");
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  }, [today]);

  // ── Block toggle handler (from day detail panel) ─────────────────────
  const handleToggleBlock = useCallback(() => {
    if (!selectedDate || toggling) return;
    setToggling(true);
    start(async () => {
      const res = await toggleTransferBlockedDate(transferId, selectedDate);
      if (res.success) {
        setBlocked((prev) => {
          const next = new Set(prev);
          if (res.blocked) next.add(selectedDate);
          else next.delete(selectedDate);
          return next;
        });
      } else {
        toast.error(t("toggleError"));
      }
      setToggling(false);
    });
  }, [transferId, selectedDate, toggling, t]);

  // ── Day cell styling ─────────────────────────────────────────────────
  function getDayStyle(dateStr: string, isPast: boolean, isSelected: boolean) {
    if (isPast)                    return "text-gray-300 cursor-not-allowed";
    if (isSelected)                return "ring-2 ring-primary ring-offset-1 text-primary font-semibold cursor-pointer";
    if (blocked.has(dateStr))      return "bg-red-100 text-red-600 font-semibold hover:bg-red-200 cursor-pointer";
    if (confirmedSet.has(dateStr)) return "bg-gray-100 text-gray-700 font-medium cursor-pointer hover:bg-gray-200";
    if (pendingSet.has(dateStr))   return "bg-amber-50 text-amber-700 font-medium cursor-pointer hover:bg-amber-100";
    return "text-gray-700 hover:bg-gray-100 cursor-pointer";
  }

  // ── Selected day data ────────────────────────────────────────────────
  const selectedReservations = selectedDate ? (bookingsByDate.get(selectedDate) ?? []) : [];
  const isSelectedBlocked    = selectedDate ? blocked.has(selectedDate) : false;
  const isSelectedPast       = selectedDate ? isBefore(parseISO(selectedDate), today) : false;

  // Format selected date for display
  const selectedDateFormatted = selectedDate
    ? format(parseISO(selectedDate), "EEEE, d MMMM yyyy", { locale: dfnsLocale })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-gray-900">{t("heading")}</h2>
        <p className="text-sm text-gray-500 mt-1">{t("subheading")}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Calendar ─────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 w-full max-w-sm shrink-0">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <PrevIcon className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900 capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: dfnsLocale })}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <NextIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1" dir={isRtl ? "rtl" : "ltr"}>
            {headers.map((h) => (
              <div key={h} className="h-8 w-9 flex items-center justify-center text-[10px] font-medium text-gray-400">
                {h}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7" dir={isRtl ? "rtl" : "ltr"}>
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`e-${i}`} className="h-9 w-9" />
            ))}
            {days.map((day) => {
              const dateStr   = format(day, "yyyy-MM-dd");
              const isPast    = isBefore(startOfDay(day), today);
              const isSelected = selectedDate === dateStr;
              const count     = bookingsByDate.get(dateStr)?.length ?? 0;

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "h-9 w-9 rounded-full text-sm flex flex-col items-center justify-center transition-colors relative",
                    getDayStyle(dateStr, isPast, isSelected)
                  )}
                >
                  <span className="leading-none">{format(day, "d")}</span>
                  {/* Booking count dot(s) */}
                  {!isPast && count > 0 && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-1 w-1 rounded-full",
                            confirmedSet.has(dateStr) ? "bg-primary/50" : "bg-amber-400"
                          )}
                        />
                      ))}
                    </span>
                  )}
                  {/* Blocked dot */}
                  {!isPast && blocked.has(dateStr) && count === 0 && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-red-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-red-100 shrink-0" />
              <span className="text-xs text-gray-500">{t("legendBlocked")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-gray-100 shrink-0" />
              <span className="text-xs text-gray-500">{t("legendConfirmed")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-50 border border-amber-200 shrink-0" />
              <span className="text-xs text-gray-500">{t("legendPending")}</span>
            </div>
            <p className="text-[10px] text-gray-400 pt-1">{t("legendSelectHint")}</p>
          </div>
        </div>

        {/* ── Right panel ──────────────────────────────────────────── */}
        <div className="flex-1 space-y-6 min-w-0">

          {selectedDate ? (
            /* ── Day detail view ── */
            <div className="space-y-5">
              {/* Header row */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t("backToAll")}
                </button>
                <span className="text-gray-200">|</span>
                <p className="text-sm font-semibold text-gray-900 capitalize">{selectedDateFormatted}</p>
              </div>

              {/* 24h timeline card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {t("dayDetailTitle")} {selectedDateFormatted}
                  </h3>
                  {/* Block / unblock button */}
                  {!isSelectedPast && (
                    <button
                      type="button"
                      onClick={handleToggleBlock}
                      disabled={toggling || selectedReservations.length > 0}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40",
                        isSelectedBlocked
                          ? "border-green-200 text-green-700 hover:bg-green-50"
                          : "border-red-200 text-red-600 hover:bg-red-50"
                      )}
                    >
                      {toggling && <Loader2 className="h-3 w-3 animate-spin" />}
                      {isSelectedBlocked ? t("unblockDay") : t("blockDay")}
                    </button>
                  )}
                </div>

                {/* Blocked banner */}
                {isSelectedBlocked && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-600">
                    {t("dayBlocked")}
                  </div>
                )}

                {/* Timeline strip */}
                {selectedReservations.length > 0 ? (
                  <TimelineStrip reservations={selectedReservations} isChauffeur={isChauffeur} />
                ) : (
                  <p className="text-sm text-gray-400">{t("noBookingsToday")}</p>
                )}
              </div>

              {/* Booking cards for the day */}
              {selectedReservations.length > 0 && (
                <div className="space-y-3">
                  {selectedReservations
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((r) => {
                      const endTime = isChauffeur && r.hoursRequested
                        ? (() => {
                            const startM = toMins(r.time);
                            const endM   = startM + r.hoursRequested * 60;
                            return `${String(Math.floor(endM / 60)).padStart(2, "0")}:${String(endM % 60).padStart(2, "0")}`;
                          })()
                        : null;

                      return (
                        <div
                          key={r.bookingRef}
                          className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3"
                        >
                          {/* Top row: status badge + ref */}
                          <div className="flex items-center justify-between gap-3">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
                                r.status === "CONFIRMED"
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-amber-100 text-amber-700"
                              )}
                            >
                              {r.status === "CONFIRMED" ? t("statusConfirmed") : t("statusPending")}
                            </span>
                            <span className="text-xs font-mono text-gray-400">{r.bookingRef}</span>
                          </div>

                          {/* Time range */}
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="font-semibold">
                              {r.time}
                              {endTime && (
                                <span className="font-normal text-gray-400"> → {endTime}</span>
                              )}
                            </span>
                            {isChauffeur && r.hoursRequested && (
                              <span className="text-xs text-gray-400 ml-1">
                                ({r.hoursRequested} {t("labelHours").toLowerCase()})
                              </span>
                            )}
                          </div>

                          {/* Details row */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {r.passengers} {t("labelPassengers").toLowerCase()}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {r.contactName}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ) : (
            /* ── All reservations list view ── */
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">{t("reservationsHeading")}</h3>
                {initialReservations.length === 0 ? (
                  <p className="text-sm text-gray-400">{t("noReservations")}</p>
                ) : (
                  <div className="space-y-2">
                    {initialReservations.map((r) => {
                      const endTime = isChauffeur && r.hoursRequested
                        ? (() => {
                            const startM = toMins(r.time);
                            const endM   = startM + r.hoursRequested * 60;
                            return `${String(Math.floor(endM / 60)).padStart(2, "0")}:${String(endM % 60).padStart(2, "0")}`;
                          })()
                        : null;

                      return (
                        <div
                          key={r.bookingRef}
                          className="flex flex-wrap items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={cn(
                                "shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
                                r.status === "CONFIRMED"
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-amber-100 text-amber-700"
                              )}
                            >
                              {r.status === "CONFIRMED" ? t("statusConfirmed") : t("statusPending")}
                            </span>
                            <span className="text-xs font-mono text-gray-500 truncate">{r.bookingRef}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600 shrink-0 flex-wrap">
                            <span>
                              <span className="text-gray-400 mr-1">{t("labelDate")}</span>
                              {r.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {r.time}
                              {endTime && <span className="text-gray-400"> → {endTime}</span>}
                            </span>
                            <span>
                              <span className="text-gray-400 mr-1">{t("labelPassengers")}</span>
                              {r.passengers}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Manually blocked dates */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">{t("legendBlocked")}</h3>
                {blocked.size === 0 ? (
                  <p className="text-sm text-gray-400">{t("noBlockedDates")}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Array.from(blocked).sort().map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-100 text-xs font-medium px-2.5 py-1 rounded-full"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
