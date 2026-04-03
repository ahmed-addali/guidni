"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  addMonths,
  subMonths,
  getDay,
  startOfDay,
} from "date-fns";
import { enUS, fr, arTN } from "date-fns/locale";
import { useLocale } from "next-intl";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DAY_HEADERS = {
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  fr: ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"],
  ar: ["إث", "ثل", "أر", "خم", "جم", "سب", "أح"],
};

interface DatePickerInputProps {
  onDateChange: (date: Date | undefined) => void;
  minDate?: Date;
  selected?: Date;
  placeholder?: string;
  className?: string;
}

export function DatePickerInput({
  onDateChange,
  minDate,
  selected,
  placeholder = "Pick a date",
  className,
}: DatePickerInputProps) {
  const locale = useLocale();
  const [currentMonth, setCurrentMonth] = useState<Date>(selected ?? new Date());
  const [open, setOpen] = useState(false);

  const dfnsLocale = locale === "fr" ? fr : locale === "ar" ? arTN : enUS;
  const isRtl = locale === "ar";

  const today = startOfDay(new Date());
  const minDay = minDate ? startOfDay(minDate) : today;

  function handleSelect(day: Date) {
    onDateChange(day);
    setOpen(false);
  }

  // Build grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Monday-first offset: getDay returns 0=Sun … 6=Sat
  const rawDay = getDay(monthStart);
  const offset = rawDay === 0 ? 6 : rawDay - 1;

  const headers = DAY_HEADERS[locale as keyof typeof DAY_HEADERS] ?? DAY_HEADERS.en;

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft  : ChevronRight;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "w-full flex items-center gap-2 text-sm text-left bg-transparent outline-none",
          selected ? "text-gray-800" : "text-gray-400",
          className
        )}
      >
        <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
        <span suppressHydrationWarning>
          {selected
            ? format(selected, "d MMMM yyyy", { locale: dfnsLocale })
            : placeholder}
        </span>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-4"
        align={isRtl ? "end" : "start"}
      >
        <div dir={isRtl ? "rtl" : "ltr"}>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
              aria-label="Previous month"
            >
              <PrevIcon className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900 capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: dfnsLocale })}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
              aria-label="Next month"
            >
              <NextIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
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
          <div className="grid grid-cols-7">
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`e-${i}`} className="h-8 w-8" />
            ))}
            {days.map((day) => {
              const isSelected = selected ? isSameDay(day, selected) : false;
              const isToday    = isSameDay(day, today);
              const isDisabled = isBefore(startOfDay(day), minDay);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => !isDisabled && handleSelect(day)}
                  disabled={isDisabled}
                  className={cn(
                    "h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors",
                    isSelected && "bg-primary text-white font-semibold",
                    !isSelected && isToday && "border border-primary text-primary font-medium",
                    !isSelected && !isToday && !isDisabled && "text-gray-700 hover:bg-gray-100",
                    isDisabled && "text-gray-300 cursor-not-allowed"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

        </div>
      </PopoverContent>
    </Popover>
  );
}
