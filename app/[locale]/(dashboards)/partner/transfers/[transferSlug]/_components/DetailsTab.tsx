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
import { updateTransfer } from "@/lib/actions/partner-transfers";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";

type TransferTypeValue = "AIRPORT_TRANSFER" | "TAXI" | "CHAUFFEUR" | "SHUTTLE";
type Destination = { id: string; label: string; city: string; country: string; region: string | null };

const TRANSFER_TYPES: TransferTypeValue[] = ["AIRPORT_TRANSFER", "TAXI", "CHAUFFEUR", "SHUTTLE"];
const VEHICLE_TYPES = ["Sedan", "SUV", "Van", "Minibus", "Bus", "Luxury"] as const;
type VehicleType = typeof VEHICLE_TYPES[number];

const TYPE_EMOJI: Record<TransferTypeValue, string> = {
  AIRPORT_TRANSFER: "✈️", TAXI: "🚕", CHAUFFEUR: "🎩", SHUTTLE: "🚌",
};

interface Transfer {
  id:              string;
  title:           string;
  arabicTitle?:    string | null;
  arabicDescription?: string | null;
  description:     string;
  languages?:      string | null;
  type:            TransferTypeValue;
  pricePerTrip?:   number | null;
  pricePerHour?:   number | null;
  pricePerPerson?: number | null;
  capacity:        number;
  vehicleType?:    string | null;
  brand?:          string | null;
  model?:          string | null;
  year?:           number | null;
  isAC:            boolean;
  isMeetGreet:     boolean;
  isChildSeat:     boolean;
  freeCancellation: boolean;
  phone?:          string | null;
  country:         string;
  region:          string;
  city?:           string | null;
  address?:        string | null;
  destinationId?:  string | null;
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

type FormState = {
  title:           string;
  arabicTitle:     string;
  description:     string;
  arabicDescription: string;
  showArabic:      boolean;
  languages:       string;
  type:            TransferTypeValue;
  pricePerTrip:    string;
  pricePerHour:    string;
  pricePerPerson:  string;
  capacity:        number;
  vehicleType:     string;
  brand:           string;
  model:           string;
  year:            string;
  isAC:            boolean;
  isMeetGreet:     boolean;
  isChildSeat:     boolean;
  freeCancellation: boolean;
  phone:           string;
  country:         string;
  region:          string;
  city:            string;
  address:         string;
  destinationId:   string;
};

function initialForm(transfer: Transfer): FormState {
  return {
    title:            transfer.title,
    arabicTitle:      transfer.arabicTitle ?? "",
    description:      transfer.description,
    arabicDescription: transfer.arabicDescription ?? "",
    showArabic:       !!(transfer.arabicTitle || transfer.arabicDescription),
    languages:        transfer.languages ?? "",
    type:             transfer.type,
    pricePerTrip:     transfer.pricePerTrip?.toString() ?? "",
    pricePerHour:     transfer.pricePerHour?.toString() ?? "",
    pricePerPerson:   transfer.pricePerPerson?.toString() ?? "",
    capacity:         transfer.capacity,
    vehicleType:      transfer.vehicleType ?? "",
    brand:            transfer.brand ?? "",
    model:            transfer.model ?? "",
    year:             transfer.year?.toString() ?? "",
    isAC:             transfer.isAC,
    isMeetGreet:      transfer.isMeetGreet,
    isChildSeat:      transfer.isChildSeat,
    freeCancellation: transfer.freeCancellation,
    phone:            transfer.phone ?? "",
    country:          transfer.country,
    region:           transfer.region,
    city:             transfer.city ?? "",
    address:          transfer.address ?? "",
    destinationId:    transfer.destinationId ?? "",
  };
}

export function DetailsTab({ transfer, destinations }: { transfer: Transfer; destinations: Destination[] }) {
  const t  = useTranslations("PartnerDashboard.editTransfer.details");
  const tw = useTranslations("PartnerTransfers.wizard");

  const [form, setForm]       = useState<FormState>(() => initialForm(transfer));
  const [initial, setInitial] = useState<FormState>(() => initialForm(transfer));
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
      const res = await updateTransfer(transfer.id, {
        title:            form.title,
        arabicTitle:      form.arabicTitle || null,
        description:      form.description,
        arabicDescription: form.arabicDescription || null,
        languages:        form.languages || null,
        type:             form.type,
        pricePerTrip:     form.pricePerTrip   ? Number(form.pricePerTrip)   : null,
        pricePerHour:     form.pricePerHour   ? Number(form.pricePerHour)   : null,
        pricePerPerson:   form.pricePerPerson ? Number(form.pricePerPerson) : null,
        capacity:         form.capacity,
        vehicleType:      form.vehicleType || null,
        brand:            form.brand || null,
        model:            form.model || null,
        year:             form.year ? Number(form.year) : null,
        isAC:             form.isAC,
        isMeetGreet:      form.isMeetGreet,
        isChildSeat:      form.isChildSeat,
        freeCancellation: form.freeCancellation,
        phone:            form.phone || null,
        country:          form.country,
        region:           form.region,
        city:             form.city || null,
        address:          form.address || null,
        destinationId:    form.destinationId || null,
        featuredInHome:   false,
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

      {/* Service type */}
      <div className={sectionCls}>
        <p className={headingCls}>{t("typeLabel")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TRANSFER_TYPES.map((value) => (
            <button key={value} type="button" onClick={() => set("type", value)}
              className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                form.type === value
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
              }`}>
              <span className="text-xl leading-none">{TYPE_EMOJI[value]}</span>
              <span className="leading-tight">
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

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("languagesLabel")}</label>
          <input value={form.languages} onChange={(e) => set("languages", e.target.value)}
            placeholder={t("languagesPlaceholder")} className={inputCls} />
        </div>
      </div>

      {/* Vehicle specs */}
      <div className={sectionCls}>
        <p className={headingCls}>{t("sectionVehicle")}</p>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("vehicleLabel")}</label>
          <Select value={form.vehicleType} onValueChange={(v) => set("vehicleType", v ?? "")}>
            <SelectTrigger>
              <span className={form.vehicleType ? "text-gray-800" : "text-gray-400"}>
                {form.vehicleType
                  ? t(`vehicleTypes.${form.vehicleType as VehicleType}`)
                  : t("vehiclePlaceholder")}
              </span>
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map((v) => (
                <SelectItem key={v} value={v}>{t(`vehicleTypes.${v}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("brandLabel")}</label>
            <input value={form.brand} onChange={(e) => set("brand", e.target.value)}
              placeholder="e.g. Mercedes" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("modelLabel")}</label>
            <input value={form.model} onChange={(e) => set("model", e.target.value)}
              placeholder="e.g. E-Class" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("yearLabel")}</label>
            <input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="space-y-1.5 border-t border-gray-100 pt-4">
          <label className="text-sm font-medium text-gray-700">{t("capacityLabel")}</label>
          <CounterInput value={form.capacity} onChange={(v) => set("capacity", v)} min={1} max={60} />
        </div>

        {/* Feature toggles */}
        <div className="space-y-3">
          {([
            ["isAC",           t("features.isAC")],
            ["isMeetGreet",    t("features.isMeetGreet")],
            ["isChildSeat",    t("features.isChildSeat")],
            ["freeCancellation", t("freeCancellationLabel")],
          ] as [keyof FormState, string][]).map(([key, label]) => (
            <div key={key}
              className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
              onClick={() => set(key, !form[key])}
            >
              <span className="text-sm text-gray-700">{label}</span>
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
              <span onClick={(e) => e.stopPropagation()}>
                <Switch checked={form[key] as boolean} onCheckedChange={(v) => set(key, v)} />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className={sectionCls}>
        <p className={headingCls}>{t("sectionPricing")}</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {(form.type === "AIRPORT_TRANSFER" || form.type === "TAXI" || form.type === "SHUTTLE") && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                {t("pricePerTripLabel").replace("(TND)", `(${PLATFORM_CURRENCY})`)}
              </label>
              <input type="number" min={0} value={form.pricePerTrip}
                onChange={(e) => set("pricePerTrip", e.target.value)} className={inputCls} />
            </div>
          )}
          {(form.type === "CHAUFFEUR") && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                {t("pricePerHourLabel").replace("(TND)", `(${PLATFORM_CURRENCY})`)}
              </label>
              <input type="number" min={0} value={form.pricePerHour}
                onChange={(e) => set("pricePerHour", e.target.value)} className={inputCls} />
            </div>
          )}
          {form.type === "SHUTTLE" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                {t("pricePerPersonLabel").replace("(TND)", `(${PLATFORM_CURRENCY})`)}
              </label>
              <input type="number" min={0} value={form.pricePerPerson}
                onChange={(e) => set("pricePerPerson", e.target.value)} className={inputCls} />
            </div>
          )}
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
