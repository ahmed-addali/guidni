"use client";

import { useState, useTransition, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiAlertTriangle } from "react-icons/fi";
import { updateActivity } from "@/lib/actions/partner";
import { TimeSlotPicker } from "@/components/partner/TimeSlotPicker";
import { CategoryMultiSelect } from "@/components/partner/CategoryMultiSelect";
import { DurationPicker } from "@/components/partner/DurationPicker";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/shared/PhoneInput";

type Destination = { id: string; label: string; city: string; country: string; region: string };

type Activity = {
  id: string;
  title: string;
  arabicTitle: string | null;
  description: string;
  arabicDescription: string | null;
  categories: string[];
  price: number;
  capacity: number;
  timeSlots: { time: string }[];
  duration: string | null;
  country: string;
  region: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  cancelation: boolean | null;
  paynow: boolean | null;
  destinationId: string | null;
  durationMinutes: number | null;
  includes: string | null;
  excludes: string | null;
  allowed: string | null;
  forbidden: string | null;
};

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";


export function ActivityDetailsTab({
  activity,
  destinations,
}: {
  activity: Activity;
  destinations: Destination[];
}) {
  const [pending, start] = useTransition();
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const t = useTranslations("PartnerDashboard.editActivity.details");

  const buildSnapshot = () => ({
    title:             activity.title,
    arabicTitle:       activity.arabicTitle       ?? "",
    destinationId:     activity.destinationId     ?? "",
    description:       activity.description,
    arabicDescription: activity.arabicDescription ?? "",
    categories:        activity.categories,
    price:             activity.price,
    capacity:          activity.capacity,
    availableTimes:    activity.timeSlots.map((s) => s.time),
    duration:          activity.duration        ?? "",
    durationMinutes:   activity.durationMinutes ?? 0,
    country:           activity.country,
    region:            activity.region,
    city:              activity.city        ?? "",
    address:           activity.address     ?? "",
    phone:             activity.phone       ?? "",
    cancelation:       activity.cancelation ?? true,
    paynow:            activity.paynow      ?? false,
    includes:          activity.includes    ?? "",
    excludes:          activity.excludes    ?? "",
    allowed:           activity.allowed     ?? "",
    forbidden:         activity.forbidden   ?? "",
  });

  const [initial, setInitial] = useState(buildSnapshot);
  const [form,    setForm]    = useState(initial);

  // Auto-expand Arabic section if the activity already has Arabic content
  const [showArabic, setShowArabic] = useState(
    Boolean(activity.arabicTitle || activity.arabicDescription)
  );

  const isDirty = useMemo(() => (
    form.destinationId     !== initial.destinationId     ||
    form.title             !== initial.title             ||
    form.arabicTitle       !== initial.arabicTitle       ||
    form.description       !== initial.description       ||
    form.arabicDescription !== initial.arabicDescription ||
    form.categories.join(",") !== initial.categories.join(",") ||
    form.price             !== initial.price             ||
    form.capacity          !== initial.capacity          ||
    form.duration          !== initial.duration          ||
    form.country           !== initial.country           ||
    form.region            !== initial.region            ||
    form.city              !== initial.city              ||
    form.address           !== initial.address           ||
    form.phone             !== initial.phone             ||
    form.cancelation       !== initial.cancelation       ||
    form.paynow            !== initial.paynow            ||
    form.availableTimes.join(",") !== initial.availableTimes.join(",") ||
    form.includes          !== initial.includes          ||
    form.excludes          !== initial.excludes          ||
    form.allowed           !== initial.allowed           ||
    form.forbidden         !== initial.forbidden
  ), [form, initial]);

  const set  = (key: string, value: string | number) => setForm((p) => ({ ...p, [key]: value }));
  const setB = (key: string, value: boolean)          => setForm((p) => ({ ...p, [key]: value }));

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    doSave();
  }

  function doSave() {
    if (!form.phone.trim()) {
      setPhoneError(t("phoneRequired"));
      return;
    }
    setPhoneError(undefined);
    start(async () => {
      const res = await updateActivity(activity.id, {
        ...form,
        arabicTitle:       form.arabicTitle       || undefined,
        arabicDescription: form.arabicDescription || undefined,
        availableTimes:    form.availableTimes,
      });
      if (res.success) {
        toast.success(t("updateSuccess"));
        setInitial(form); // snapshot current form as the new baseline
      } else {
        toast.error(res.error ?? t("updateFailed"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isDirty && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <FiAlertTriangle className="h-4 w-4 shrink-0" />
            {t("unsavedBanner")}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="text-xs font-semibold text-amber-700 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors disabled:opacity-50 shrink-0"
          >
            {pending ? t("saving") : t("saveNow")}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("titleLabel")}</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} required className={inputCls} />
        </div>

        {/* Description */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("descriptionLabel")}</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} required rows={4} className={`${inputCls} resize-none`} />
        </div>

        {/* Arabic translation toggle */}
        <div
          className="sm:col-span-2 flex items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
          onClick={() => setShowArabic((v) => !v)}
        >
          <div>
            <p className="text-sm font-medium text-gray-700">{t("arabicToggleLabel")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t("arabicToggleHint")}</p>
          </div>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
          <span onClick={(e) => e.stopPropagation()}>
            <Switch checked={showArabic} onCheckedChange={setShowArabic} />
          </span>
        </div>

        {showArabic && (
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("arabicTitleLabel")}</label>
              <p className="text-xs text-gray-400">{t("arabicTitleHint")}</p>
              <input
                value={form.arabicTitle}
                onChange={(e) => set("arabicTitle", e.target.value)}
                placeholder="e.g. رحلة الجمال عند الشروق"
                dir="rtl"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("arabicDescriptionLabel")}</label>
              <p className="text-xs text-gray-400">{t("arabicTitleHint")}</p>
              <textarea
                value={form.arabicDescription}
                onChange={(e) => set("arabicDescription", e.target.value)}
                rows={4}
                placeholder="وصف التجربة، ما هو مشمول، نقطة الالتقاء..."
                dir="rtl"
                className={`${inputCls} resize-none`}
              />
            </div>
          </>
        )}

        {/* Categories */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("categoriesLabel")}</label>
          <CategoryMultiSelect
            value={form.categories}
            onChange={(cats) => setForm((p) => ({ ...p, categories: cats }))}
          />
        </div>

        {/* Duration */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("durationLabel")}</label>
          <DurationPicker
            value={form.duration}
            onChange={(v, mins) => setForm((p) => ({ ...p, duration: v, durationMinutes: mins }))}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">{t("phoneLabel")}</label>
          <PhoneInput
            value={form.phone}
            onChange={(v) => { set("phone", v); if (v.trim()) setPhoneError(undefined); }}
            error={phoneError}
          />
        </div>

        {/* Price + Capacity */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("priceLabel")}</label>
          <input type="number" min={0} value={form.price} onChange={(e) => set("price", parseInt(e.target.value) || 0)} required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("capacityLabel")}</label>
          <p className="text-xs text-gray-400">{t("capacityHint")}</p>
          <input type="number" min={1} value={form.capacity} onChange={(e) => set("capacity", parseInt(e.target.value) || 1)} required className={inputCls} />
        </div>

        {/* Available times */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("timesLabel")}</label>
          <TimeSlotPicker
            value={form.availableTimes}
            onChange={(slots) => setForm((p) => ({ ...p, availableTimes: slots }))}
          />
        </div>

        {/* Location */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("destinationLabel")}</label>
          <p className="text-xs text-gray-400">{t("destinationHint")}</p>
          <Select
            value={form.destinationId}
            onValueChange={(id) => {
              const safeId = id ?? "";
              const dest   = destinations.find((d) => d.id === safeId);
              setForm((p) => ({
                ...p,
                destinationId: safeId,
                country:       dest?.country ?? p.country,
                region:        dest?.region  ?? p.region,
                city:          dest?.city    ?? p.city,
              }));
            }}
          >
            <SelectTrigger>
              <span className={form.destinationId ? "text-gray-800" : "text-gray-400"}>
                {destinations.find((d) => d.id === form.destinationId)?.label ?? t("destinationPlaceholder")}
              </span>
            </SelectTrigger>
            <SelectContent>
              {destinations.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Derived read-only location chips */}
          {form.destinationId && (
            <div className="flex flex-wrap items-center gap-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100 mt-2">
              <span className="text-xs text-gray-400 font-medium w-full mb-0.5">{t("locationDetails")}</span>
              {[
                { label: t("countryLabel"), value: form.country },
                { label: t("regionLabel"),  value: form.region  },
                { label: t("cityLabel"),    value: form.city     },
              ].filter((f) => f.value).map((f) => (
                <span key={f.label} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700">
                  <span className="text-gray-400">{f.label}:</span> {f.value}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("addressLabel")}</label>
          <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
        </div>

        {/* Includes / Excludes / Policies */}
        <div className="sm:col-span-2 space-y-1.5 pt-2">
          <p className="text-sm font-semibold text-gray-800">{t("policiesSectionTitle")}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("includedLabel")}</label>
          <p className="text-xs text-gray-400">{t("includedHint")}</p>
          <textarea
            value={form.includes}
            onChange={(e) => set("includes", e.target.value)}
            placeholder={t("includedPlaceholder")}
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("excludedLabel")}</label>
          <p className="text-xs text-gray-400">{t("excludedHint")}</p>
          <textarea
            value={form.excludes}
            onChange={(e) => set("excludes", e.target.value)}
            placeholder={t("excludedPlaceholder")}
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("allowedLabel")}</label>
          <p className="text-xs text-gray-400">{t("allowedHint")}</p>
          <textarea
            value={form.allowed}
            onChange={(e) => set("allowed", e.target.value)}
            placeholder={t("allowedPlaceholder")}
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("forbiddenLabel")}</label>
          <p className="text-xs text-gray-400">{t("forbiddenHint")}</p>
          <textarea
            value={form.forbidden}
            onChange={(e) => set("forbidden", e.target.value)}
            placeholder={t("forbiddenPlaceholder")}
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Policy toggles */}
        <div className="sm:col-span-2 space-y-3 pt-1">
          <div className="flex items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
            onClick={() => setB("cancelation", !form.cancelation)}>
            <div>
              <p className="text-sm font-medium text-gray-700">{t("freeCancellationLabel")}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t("freeCancellationHint")}</p>
            </div>
            <span onClick={(e) => e.stopPropagation()}>
              <Switch checked={form.cancelation} onCheckedChange={(v) => setB("cancelation", v)} />
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
            onClick={() => setB("paynow", !form.paynow)}>
            <div>
              <p className="text-sm font-medium text-gray-700">{t("payNowLabel")}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t("payNowHint")}</p>
            </div>
            <span onClick={(e) => e.stopPropagation()}>
              <Switch checked={form.paynow} onCheckedChange={(v) => setB("paynow", v)} />
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={pending || !isDirty}
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
          {pending ? t("saving") : t("saveChanges")}
        </button>
      </div>
    </form>
  );
}
