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
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleRentalBlockedDate } from "@/lib/actions/partner-rentals";

const DAY_HEADERS = {
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  fr: ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"],
  ar: ["إث", "ثل", "أر", "خم", "جم", "سب", "أح"],
};

interface Reservation {
  startDate:  string;
  endDate:    string;
  status:     string;
  bookingRef: string;
}

interface Props {
  rentalId:            string;
  locale:              string;
  initialBlockedDates: string[];
  initialReservations: Reservation[];
}

/** Expand a [startDate, endDate] inclusive range into YYYY-MM-DD strings. */
function expandDates(startDate: string, endDate: string): string[] {
  const start = parseISO(startDate);
  const end   = parseISO(endDate);
  if (start > end) return [];
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

export function AvailabilityTab({
  rentalId,
  locale,
  initialBlockedDates,
  initialReservations,
}: Props) {
  const t = useTranslations("PartnerDashboard.editRental.availability");
  const [, start] = useTransition();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blocked,  setBlocked]  = useState<Set<string>>(new Set(initialBlockedDates));
  const [toggling, setToggling] = useState<string | null>(null);

  const loc        = locale as "en" | "fr" | "ar";
  const dfnsLocale = loc === "fr" ? fr : loc === "ar" ? arTN : enUS;
  const isRtl      = loc === "ar";

  const today = startOfDay(new Date());

  // ── Reservation date sets ─────────────────────────────────────────────
  const { confirmedSet, pendingSet } = useMemo(() => {
    const confirmed = new Set<string>();
    const pending   = new Set<string>();
    for (const r of initialReservations) {
      const dates = expandDates(r.startDate, r.endDate);
      if (r.status === "CONFIRMED") dates.forEach((d) => confirmed.add(d));
      else                          dates.forEach((d) => pending.add(d));
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

  const sortedBlocked = useMemo(() => Array.from(blocked).sort(), [blocked]);

  // ── Toggle handler ───────────────────────────────────────────────────
  const handleToggle = useCallback(
    (day: Date) => {
      if (isBefore(startOfDay(day), today)) return;
      const dateStr = format(day, "yyyy-MM-dd");
      if (confirmedSet.has(dateStr) || pendingSet.has(dateStr)) return;
      if (toggling) return;
      setToggling(dateStr);
      start(async () => {
        const res = await toggleRentalBlockedDate(rentalId, dateStr);
        if (res.success) {
          setBlocked((prev) => {
            const next = new Set(prev);
            if (res.blocked) next.add(dateStr);
            else next.delete(dateStr);
            return next;
          });
        } else {
          toast.error(t("toggleError"));
        }
        setToggling(null);
      });
    },
    [rentalId, today, toggling, confirmedSet, pendingSet, t]
  );

  // ── Day cell styling ─────────────────────────────────────────────────
  function getDayStyle(dateStr: string, isPast: boolean) {
    if (isPast) return "text-gray-300 cursor-not-allowed";
    if (blocked.has(dateStr))      return "bg-red-100 text-red-600 font-semibold hover:bg-red-200 cursor-pointer";
    if (confirmedSet.has(dateStr)) return "bg-gray-200 text-gray-600 font-medium cursor-default";
    if (pendingSet.has(dateStr))   return "bg-amber-100 text-amber-700 font-medium cursor-default";
    return "text-gray-700 hover:bg-gray-100 cursor-pointer";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-gray-900">{t("heading")}</h2>
        <p className="text-sm text-gray-500 mt-1">{t("subheading")}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
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
              <div
                key={h}
                className="h-8 w-8 flex items-center justify-center text-[10px] font-medium text-gray-400"
              >
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
              const isLoading = toggling === dateStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleToggle(day)}
                  className={cn(
                    "h-9 w-9 rounded-full text-sm flex items-center justify-center transition-colors relative",
                    getDayStyle(dateStr, isPast)
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                  ) : (
                    format(day, "d")
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
              <div className="w-3.5 h-3.5 rounded-full bg-gray-200 shrink-0" />
              <span className="text-xs text-gray-500">{t("legendConfirmed")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-100 shrink-0" />
              <span className="text-xs text-gray-500">{t("legendPending")}</span>
            </div>
          </div>
        </div>

        {/* Right panel: reservations + manually blocked */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Upcoming reservations */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">{t("reservationsHeading")}</h3>
            {initialReservations.length === 0 ? (
              <p className="text-sm text-gray-400">{t("noReservations")}</p>
            ) : (
              <div className="space-y-2">
                {initialReservations.map((r) => (
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
                    <div className="flex items-center gap-4 text-xs text-gray-600 shrink-0">
                      <span>
                        <span className="text-gray-400 mr-1">{t("labelStartDate")}</span>
                        {r.startDate}
                      </span>
                      <span>
                        <span className="text-gray-400 mr-1">{t("labelEndDate")}</span>
                        {r.endDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manually blocked dates */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">{t("legendBlocked")}</h3>
            {sortedBlocked.length === 0 ? (
              <p className="text-sm text-gray-400">{t("noBlockedDates")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sortedBlocked.map((d) => (
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
      </div>
    </div>
  );
}
