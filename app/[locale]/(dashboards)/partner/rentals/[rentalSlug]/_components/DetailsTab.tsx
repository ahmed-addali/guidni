"use client";

import { useState, useMemo, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiCheck, FiAlertCircle } from "react-icons/fi";
import { PhoneInput } from "@/components/shared/PhoneInput";
import { CounterInput } from "@/components/shared/CounterInput";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { updateRental } from "@/lib/actions/partner-rentals";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";

type RentalTypeValue = "CAR" | "MOTORBIKE" | "SCOOTER" | "BICYCLE" | "BOAT" | "QUAD" | "BUGGY" | "JET_SKI" | "OTHER";
type Destination = { id: string; label: string; city: string; country: string; region: string | null };

const RENTAL_TYPES: RentalTypeValue[] = [
  "CAR", "MOTORBIKE", "SCOOTER", "BICYCLE", "BOAT", "QUAD", "BUGGY", "JET_SKI", "OTHER",
];
const TYPE_EMOJI: Record<RentalTypeValue, string> = {
  CAR: "🚗", MOTORBIKE: "🏍️", SCOOTER: "🛵", BICYCLE: "🚲",
  BOAT: "⛵", QUAD: "🏎️", BUGGY: "🪖", JET_SKI: "🌊", OTHER: "🔧",
};

interface Rental {
  id:              string;
  title:           string;
  arabicTitle?:    string | null;
  arabicDescription?: string | null;
  description:     string;
  type:            RentalTypeValue;
  brand?:          string | null;
  model?:          string | null;
  year?:           number | null;
  color?:          string | null;
  transmission?:   string | null;
  fuelType?:       string | null;
  capacity:        number;
  hasAC:           boolean;
  hasGPS:          boolean;
  hasInsurance:    boolean;
  requiresLicense: boolean;
  freeCancellation?: boolean;
  country:         string;
  region:          string;
  city?:           string | null;
  address?:        string | null;
  phone?:          string | null;
  pricePerDay:     number;
  pricePerHour?:   number | null;
  deposit?:        number | null;
  minDays:         number;
  destinationId?:  string | null;
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

type FormState = {
  title:            string;
  arabicTitle:      string;
  description:      string;
  arabicDescription: string;
  showArabic:       boolean;
  type:             RentalTypeValue;
  brand:            string;
  model:            string;
  year:             string;
  color:            string;
  transmission:     string;
  fuelType:         string;
  capacity:         number;
  hasAC:            boolean;
  hasGPS:           boolean;
  hasInsurance:     boolean;
  requiresLicense:  boolean;
  freeCancellation: boolean;
  country:          string;
  region:           string;
  city:             string;
  address:          string;
  phone:            string;
  pricePerDay:      number;
  pricePerHour:     string;
  deposit:          string;
  minDays:          number;
  destinationId:    string;
};

function initialForm(rental: Rental): FormState {
  return {
    title:             rental.title,
    arabicTitle:       rental.arabicTitle ?? "",
    description:       rental.description,
    arabicDescription: rental.arabicDescription ?? "",
    showArabic:        !!(rental.arabicTitle || rental.arabicDescription),
    type:              rental.type,
    brand:             rental.brand ?? "",
    model:             rental.model ?? "",
    year:              rental.year?.toString() ?? "",
    color:             rental.color ?? "",
    transmission:      rental.transmission ?? "",
    fuelType:          rental.fuelType ?? "",
    capacity:          rental.capacity,
    hasAC:             rental.hasAC,
    hasGPS:            rental.hasGPS,
    hasInsurance:      rental.hasInsurance,
    requiresLicense:   rental.requiresLicense,
    freeCancellation:  rental.freeCancellation ?? false,
    country:           rental.country,
    region:            rental.region,
    city:              rental.city ?? "",
    address:           rental.address ?? "",
    phone:             rental.phone ?? "",
    pricePerDay:       rental.pricePerDay,
    pricePerHour:      rental.pricePerHour?.toString() ?? "",
    deposit:           rental.deposit?.toString() ?? "",
    minDays:           rental.minDays,
    destinationId:     rental.destinationId ?? "",
  };
}

export function DetailsTab({ rental, destinations }: { rental: Rental; destinations: Destination[] }) {
  const t = useTranslations("PartnerDashboard.editRental.details");
  const tw = useTranslations("PartnerRentals.wizard");

  const [form, setForm]       = useState<FormState>(() => initialForm(rental));
  const [initial, setInitial] = useState<FormState>(() => initialForm(rental));
  const [pending, start]      = useTransition();
  const [errors, setErrors]   = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const isDirty = useMemo(() => {
    const keys = Object.keys(form) as (keyof FormState)[];
    return keys.some((k) => form[k] !== initial[k]);
  }, [form, initial]);

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim())       errs.title       = t("titleLabel") + " is required";
    if (!form.description.trim()) errs.description = t("descriptionLabel") + " is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    start(async () => {
      const res = await updateRental(rental.id, {
        title:            form.title,
        arabicTitle:      form.arabicTitle || null,
        description:      form.description,
        arabicDescription: form.arabicDescription || null,
        type:             form.type,
        brand:            form.brand || null,
        model:            form.model || null,
        year:             form.year ? parseInt(form.year) : null,
        color:            form.color || null,
        transmission:     form.transmission || null,
        fuelType:         form.fuelType || null,
        capacity:         form.capacity,
        hasAC:            form.hasAC,
        hasGPS:           form.hasGPS,
        hasInsurance:     form.hasInsurance,
        requiresLicense:  form.requiresLicense,
        freeCancellation: form.freeCancellation,
        country:          form.country,
        region:           form.region,
        city:             form.city || null,
        address:          form.address || null,
        phone:            form.phone || null,
        pricePerDay:      form.pricePerDay,
        pricePerHour:     form.pricePerHour ? Number(form.pricePerHour) : null,
        deposit:          form.deposit ? Number(form.deposit) : null,
        minDays:          form.minDays,
        destinationId:    form.destinationId || null,
      });
      if (res.success) {
        toast.success(t("updateSuccess"));
        setInitial(form);
        setErrors({});
      } else {
        toast.error(t("updateFailed"));
      }
    });
  }

  const selectedDest = destinations.find((d) => d.id === form.destinationId);
  const sectionCls   = "bg-white border border-gray-100 rounded-2xl p-6 space-y-4";
  const headingCls   = "text-sm font-semibold text-gray-800 border-b border-gray-100 pb-3";

  return (
    <div className="space-y-5">
      {/* Unsaved banner */}
      {isDirty && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <FiAlertCircle className="h-4 w-4 shrink-0" />
            {t("unsavedBanner")}
          </div>
          <button type="button" onClick={handleSave} disabled={pending}
            className="shrink-0 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors disabled:opacity-50">
            {pending ? t("saving") : t("saveNow")}
          </button>
        </div>
      )}

      {/* Vehicle type */}
      <div className={sectionCls}>
        <p className={headingCls}>{t("typeLabel")}</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {RENTAL_TYPES.map((value) => (
            <button key={value} type="button" onClick={() => set("type", value)}
              className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-xs font-medium transition-all ${
                form.type === value
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
              }`}>
              <span className="text-xl leading-none">{TYPE_EMOJI[value]}</span>
              <span className="text-center leading-tight">
                {form.type === value && <FiCheck className="h-3 w-3 inline mr-0.5 mb-0.5" />}
                {tw(`type.types.${value}.label`)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Basic info */}
      <div className={sectionCls}>
        <p className={headingCls}>{t("sectionBasic")}</p>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("titleLabel")}</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)}
            className={`${inputCls} ${errors.title ? "border-red-300" : ""}`} />
          {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("descriptionLabel")}</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
            rows={4} className={`${inputCls} resize-none ${errors.description ? "border-red-300" : ""}`} />
          {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
        </div>

        {/* Arabic toggle */}
        <div
          className="flex items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
          onClick={() => set("showArabic", !form.showArabic)}
        >
          <p className="text-sm font-medium text-gray-700">{t("arabicToggleLabel")}</p>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
          <span onClick={(e) => e.stopPropagation()}>
            <Switch checked={form.showArabic} onCheckedChange={(v) => set("showArabic", v)} />
          </span>
        </div>

        {form.showArabic && (
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("arabicTitleLabel")}</label>
              <input value={form.arabicTitle} onChange={(e) => set("arabicTitle", e.target.value)} dir="rtl" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("arabicDescriptionLabel")}</label>
              <textarea value={form.arabicDescription} onChange={(e) => set("arabicDescription", e.target.value)}
                dir="rtl" rows={3} className={`${inputCls} resize-none`} />
            </div>
          </div>
        )}
      </div>

      {/* Vehicle specs */}
      <div className={sectionCls}>
        <p className={headingCls}>{t("sectionSpecs")}</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("brandLabel")}</label>
            <input value={form.brand} onChange={(e) => set("brand", e.target.value)}
              placeholder={t("brandPlaceholder")} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("modelLabel")}</label>
            <input value={form.model} onChange={(e) => set("model", e.target.value)}
              placeholder={t("modelPlaceholder")} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("yearLabel")}</label>
            <input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("colorLabel")}</label>
            <input value={form.color} onChange={(e) => set("color", e.target.value)} className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("transmissionLabel")}</label>
            <Select value={form.transmission} onValueChange={(v) => set("transmission", v ?? "")}>
              <SelectTrigger>
                <span className={form.transmission ? "text-gray-800" : "text-gray-400"}>
                  {form.transmission
                    ? t(`transmissions.${form.transmission as "Automatic"}`)
                    : t("transmissionPlaceholder")}
                </span>
              </SelectTrigger>
              <SelectContent>
                {(["Automatic", "Manual"] as const).map((v) => (
                  <SelectItem key={v} value={v}>{t(`transmissions.${v}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("fuelTypeLabel")}</label>
            <Select value={form.fuelType} onValueChange={(v) => set("fuelType", v ?? "")}>
              <SelectTrigger>
                <span className={form.fuelType ? "text-gray-800" : "text-gray-400"}>
                  {form.fuelType
                    ? t(`fuelTypes.${form.fuelType as "Petrol"}`)
                    : t("fuelTypePlaceholder")}
                </span>
              </SelectTrigger>
              <SelectContent>
                {(["Petrol", "Diesel", "Electric", "Hybrid"] as const).map((v) => (
                  <SelectItem key={v} value={v}>{t(`fuelTypes.${v}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Seats counter */}
        <div className="space-y-1.5 border-t border-gray-100 pt-4">
          <label className="text-sm font-medium text-gray-700">{t("capacityLabel")}</label>
          <CounterInput value={form.capacity} onChange={(v) => set("capacity", v)} min={1} max={30} />
        </div>

        {/* Feature toggles */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          {([
            ["hasAC",           t("hasACLabel")],
            ["hasGPS",          t("hasGPSLabel")],
            ["hasInsurance",    t("hasInsuranceLabel")],
            ["requiresLicense", t("requiresLicenseLabel")],
            ["freeCancellation", t("freeCancellationLabel")],
          ] as [keyof FormState, string][]).map(([key, label]) => (
            <button key={key} type="button" onClick={() => set(key, !form[key])}
              className={`flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-xl border font-medium transition-all ${
                form[key]
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
              }`}>
              {form[key] && <FiCheck className="h-3.5 w-3.5 shrink-0" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className={sectionCls}>
        <p className={headingCls}>{t("sectionPricing")}</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {t("pricePerDayLabel").replace("(TND)", `(${PLATFORM_CURRENCY})`)}
            </label>
            <input type="number" min={0} value={form.pricePerDay}
              onChange={(e) => set("pricePerDay", parseInt(e.target.value) || 0)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {t("pricePerHourLabel").replace("(TND,", `(${PLATFORM_CURRENCY},`)}
            </label>
            <input type="number" min={0} value={form.pricePerHour}
              onChange={(e) => set("pricePerHour", e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {t("depositLabel").replace("(TND,", `(${PLATFORM_CURRENCY},`)}
            </label>
            <input type="number" min={0} value={form.deposit}
              onChange={(e) => set("deposit", e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="space-y-1.5 border-t border-gray-100 pt-4">
          <label className="text-sm font-medium text-gray-700">{t("minDaysLabel")}</label>
          <CounterInput value={form.minDays} onChange={(v) => set("minDays", v)} min={1} max={365} />
        </div>
      </div>

      {/* Location */}
      <div className={sectionCls}>
        <p className={headingCls}>{t("locationDetails")}</p>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("destinationLabel")}</label>
          <Select
            value={form.destinationId}
            onValueChange={(id) => {
              const dest = destinations.find((d) => d.id === (id ?? ""));
              setForm((p) => ({
                ...p,
                destinationId: id ?? "",
                country: dest?.country ?? p.country,
                region:  dest?.region  ?? p.region,
                city:    dest?.city    ?? p.city,
              }));
            }}
          >
            <SelectTrigger>
              <span className={form.destinationId ? "text-gray-800" : "text-gray-400"}>
                {selectedDest?.label ?? t("destinationPlaceholder")}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("destinationPlaceholder")}</SelectItem>
              {destinations.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {form.destinationId && (
          <div className="flex flex-wrap items-center gap-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            {[
              { label: t("countryLabel"), value: form.country },
              { label: t("regionLabel"),  value: form.region  },
              { label: t("cityLabel"),    value: form.city    },
            ].filter((f) => f.value).map((f) => (
              <span key={f.label} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700">
                <span className="text-gray-400">{f.label}:</span> {f.value}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("addressLabel")}</label>
          <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("phoneLabel")}</label>
          <PhoneInput value={form.phone} onChange={(v) => set("phone", v)} />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={pending || !isDirty}
          className="bg-primary text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {pending ? t("saving") : t("saveChanges")}
        </button>
      </div>
    </div>
  );
}
