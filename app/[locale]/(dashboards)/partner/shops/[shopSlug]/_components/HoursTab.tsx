"use client";

import { useState, useMemo, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { TimePickerInput } from "@/components/shared/TimePickerInput";
import { upsertShopHours } from "@/lib/actions/shops";

// ─── Types ────────────────────────────────────────────────────────────────────

const DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
] as const;

type DayKey = (typeof DAYS)[number];

type HourEntry = {
  day:              DayKey;
  opening:          string;
  closing:          string;
  isClosed:         boolean;
  isFullDayOpening: boolean;
};

type ShopHour = {
  id:               string;
  day:              string;
  opening:          string | null;
  closing:          string | null;
  isClosed:         boolean;
  isFullDayOpening: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInitialHours(existing: ShopHour[]): HourEntry[] {
  return DAYS.map((day) => {
    const found = existing.find((h) => h.day === day);
    return {
      day,
      opening:          found?.opening          ?? "09:00",
      closing:          found?.closing           ?? "20:00",
      isClosed:         found?.isClosed          ?? false,
      isFullDayOpening: found?.isFullDayOpening  ?? false,
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HoursTab({
  shopId,
  initialHours,
}: {
  shopId:       string;
  initialHours: ShopHour[];
}) {
  const t = useTranslations("PartnerDashboard.editShop.hours");

  const [hours, setHours]   = useState<HourEntry[]>(() => buildInitialHours(initialHours));
  const [initial]           = useState<HourEntry[]>(() => buildInitialHours(initialHours));
  const [pending, start]    = useTransition();

  const isDirty = useMemo(
    () => JSON.stringify(hours) !== JSON.stringify(initial),
    [hours, initial]
  );

  function update<K extends keyof HourEntry>(day: DayKey, field: K, value: HourEntry[K]) {
    setHours((prev) =>
      prev.map((h) => (h.day === day ? { ...h, [field]: value } : h))
    );
  }

  function handleSubmit() {
    start(async () => {
      const res = await upsertShopHours(
        shopId,
        hours.map((h) => ({
          day:              h.day,
          opening:          h.isClosed || h.isFullDayOpening ? null : h.opening,
          closing:          h.isClosed || h.isFullDayOpening ? null : h.closing,
          isClosed:         h.isClosed,
          isFullDayOpening: h.isFullDayOpening,
        }))
      );
      if (res.success) toast.success(t("saveSuccess"));
      else toast.error(t("saveFailed"));
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-800">{t("heading")}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{t("subheading")}</p>
      </div>

      {/* Unsaved banner */}
      {isDirty && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <span className="font-medium">{t("unsavedChanges")}</span>
          <button
            type="button"
            disabled={pending}
            onClick={handleSubmit}
            className="shrink-0 px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {pending ? t("saving") : t("saveButton")}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {hours.map(({ day, opening, closing, isClosed, isFullDayOpening }) => (
          <div
            key={day}
            className={`flex flex-wrap items-center gap-4 px-4 py-3.5 rounded-xl border transition-colors ${
              isClosed ? "bg-gray-50 border-gray-100" : "bg-white border-gray-200"
            }`}
          >
            {/* Day name — localised */}
            <span className="w-24 text-sm font-medium text-gray-700 shrink-0">
              {t(`days.${day}` as Parameters<typeof t>[0])}
            </span>

            {/* Closed toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <Switch
                checked={isClosed}
                onCheckedChange={(v) => update(day, "isClosed", v)}
                id={`closed-${day}`}
              />
              <label htmlFor={`closed-${day}`} className="text-xs text-gray-500 cursor-pointer select-none">
                {t("closedLabel")}
              </label>
            </div>

            {!isClosed && (
              <>
                {/* 24h toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={isFullDayOpening}
                    onCheckedChange={(v) => update(day, "isFullDayOpening", v)}
                    id={`fullday-${day}`}
                  />
                  <label htmlFor={`fullday-${day}`} className="text-xs text-gray-500 cursor-pointer select-none">
                    {t("fullDayLabel")}
                  </label>
                </div>

                {!isFullDayOpening && (
                  <div className="flex items-center gap-2">
                    <div className="border border-gray-200 rounded-lg px-2.5 py-1.5 min-w-[5.5rem]">
                      <TimePickerInput
                        value={opening}
                        onChange={(v) => update(day, "opening", v)}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{t("toLabel")}</span>
                    <div className="border border-gray-200 rounded-lg px-2.5 py-1.5 min-w-[5.5rem]">
                      <TimePickerInput
                        value={closing}
                        onChange={(v) => update(day, "closing", v)}
                      />
                    </div>
                  </div>
                )}

                {isFullDayOpening && (
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-lg">
                    {t("openAllDay")}
                  </span>
                )}
              </>
            )}

            {isClosed && (
              <span className="text-xs text-gray-400 italic">{t("closedAllDay")}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={pending || !isDirty}
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? t("saving") : t("saveButton")}
        </button>
      </div>
    </div>
  );
}
