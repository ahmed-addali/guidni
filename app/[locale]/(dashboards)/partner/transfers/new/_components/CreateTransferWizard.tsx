"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiCheck, FiChevronLeft, FiChevronRight, FiCamera } from "react-icons/fi";
import { createTransfer } from "@/lib/actions/partner-transfers";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/shared/PhoneInput";
import { CounterInput } from "@/components/shared/CounterInput";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3 | 4 | 5;
type TransferTypeValue = "AIRPORT_TRANSFER" | "TAXI" | "CHAUFFEUR" | "SHUTTLE";
type Destination = { id: string; label: string; city: string; country: string; region: string };

const TRANSFER_TYPES: TransferTypeValue[] = ["AIRPORT_TRANSFER", "TAXI", "CHAUFFEUR", "SHUTTLE"];

const TYPE_EMOJI: Record<TransferTypeValue, string> = {
  AIRPORT_TRANSFER: "✈️",
  TAXI:             "🚕",
  CHAUFFEUR:        "🎩",
  SHUTTLE:          "🚌",
};

const VEHICLE_TYPES = ["Sedan", "SUV", "Van", "Minibus", "Bus", "Luxury"] as const;
type VehicleType = typeof VEHICLE_TYPES[number];

type FormData = {
  type:           TransferTypeValue;
  title:          string;
  arabicTitle:    string;
  description:    string;
  languages:      string;
  vehicleType:    string;
  brand:          string;
  model:          string;
  capacity:       number;
  isAC:           boolean;
  isMeetGreet:    boolean;
  isChildSeat:    boolean;
  phone:          string;
  country:        string;
  region:         string;
  city:           string;
  address:        string;
  destinationId:  string;
  pricePerTrip:   string;
  pricePerHour:   string;
  pricePerPerson: string;
};

const DEFAULTS: FormData = {
  type: "AIRPORT_TRANSFER", title: "", arabicTitle: "", description: "", languages: "",
  vehicleType: "", brand: "", model: "",
  capacity: 4, isAC: true, isMeetGreet: false, isChildSeat: false,
  phone: "", country: "", region: "", city: "", address: "",
  destinationId: "", pricePerTrip: "", pricePerHour: "", pricePerPerson: "",
};

// ─── Step progress ────────────────────────────────────────────────────────────

function StepProgress({ current, labels }: { current: Step; labels: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
      {labels.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${done   ? "bg-primary text-white"
                : active ? "bg-primary text-white ring-4 ring-primary/20"
                         : "bg-gray-100 text-gray-400"}`}>
                {done ? <FiCheck className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs mt-1 font-medium whitespace-nowrap ${active ? "text-primary" : done ? "text-gray-600" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 min-w-[16px] ${done ? "bg-primary" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Input styles ─────────────────────────────────────────────────────────────

const inputCls    = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const inputErrCls = "w-full border border-red-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400";

// ─── Main component ───────────────────────────────────────────────────────────

export function CreateTransferWizard({
  profileCountry,
  profileRegion,
  profilePhone,
  destinations,
}: {
  profileCountry?: string;
  profileRegion?:  string;
  profilePhone?:   string;
  destinations:    Destination[];
}) {
  const t      = useTranslations("PartnerTransfers.wizard");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [step, setStep]             = useState<Step>(0);
  const [showArabic, setShowArabic] = useState(false);
  const [createdId, setCreatedId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormData>({
    ...DEFAULTS,
    country: profileCountry ?? "",
    region:  profileRegion  ?? "",
    phone:   profilePhone   ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [pending, start]    = useTransition();

  const set      = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((p) => ({ ...p, [key]: value }));
  const clearErr = (key: keyof FormData) =>
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 1) {
      if (!form.title.trim())                   e.title       = t("validation.titleRequired");
      if (form.title.trim().length < 3)         e.title       = t("validation.titleMin");
      if (!form.description.trim())             e.description = t("validation.descriptionRequired");
      if (form.description.trim().length < 20)  e.description = t("validation.descriptionMin");
    }
    if (step === 2) {
      if (!form.destinationId) e.destinationId = t("validation.destinationRequired");
    }
    if (step === 4) {
      const needsTrip = form.type === "AIRPORT_TRANSFER" || form.type === "TAXI" || form.type === "SHUTTLE";
      const needsHour = form.type === "CHAUFFEUR";
      if (needsTrip && !form.pricePerTrip && !form.pricePerPerson) e.pricePerTrip = t("validation.priceRequired");
      if (needsHour && !form.pricePerHour)                         e.pricePerHour  = t("validation.pricePerHourRequired");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() { if (validate()) setStep((s) => (s + 1) as Step); }
  function handleBack() { setStep((s) => (s - 1) as Step); }

  const selectedDest = destinations.find((d) => d.id === form.destinationId);

  function handleSubmit() {
    start(async () => {
      const res = await createTransfer({
        type:             form.type,
        title:            form.title,
        arabicTitle:      form.arabicTitle       || null,
        description:      form.description,
        languages:        form.languages         || null,
        vehicleType:      form.vehicleType       || null,
        brand:            form.brand             || null,
        model:            form.model             || null,
        year:             null,
        capacity:         form.capacity,
        isAC:             form.isAC,
        isMeetGreet:      form.isMeetGreet,
        isChildSeat:      form.isChildSeat,
        phone:            form.phone             || null,
        country:          form.country,
        region:           form.region,
        city:             form.city              || null,
        address:          form.address           || null,
        destinationId:    form.destinationId     || null,
        pricePerTrip:     form.pricePerTrip   ? Number(form.pricePerTrip)   : null,
        pricePerHour:     form.pricePerHour   ? Number(form.pricePerHour)   : null,
        pricePerPerson:   form.pricePerPerson ? Number(form.pricePerPerson) : null,
        featuredInHome:   false,
        freeCancellation: false,
      });
      if (res.success) {
        setCreatedId(res.data.id);
      } else {
        toast.error(res.error ?? t("createFailed"));
      }
    });
  }

  const stepLabels = [
    t("steps.type"), t("steps.details"), t("steps.coverage"),
    t("steps.specs"), t("steps.pricing"), t("steps.review"),
  ];

  // ── Post-creation photos screen ─────────────────────────────────────────────
  if (createdId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <FiCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("photos.heading")}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{t("photos.subheading")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <FiCamera className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700">{t("photos.hint")}</p>
          </div>

          <ImageUploader entity="transfer" entityId={createdId} images={[]} />

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/partner/transfers`)}
              className="flex items-center gap-1.5 text-sm bg-primary text-white rounded-xl px-5 py-2 hover:bg-primary/90 transition-colors font-medium"
            >
              <FiCheck className="h-4 w-4" />
              {t("nav.done")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepProgress current={step} labels={stepLabels} />

      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-6">

        {/* ── Step 0 — Type ──────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("type.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("type.subheading")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TRANSFER_TYPES.map((value) => {
                const active = form.type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("type", value)}
                    className={`flex items-start gap-3 px-4 py-4 rounded-xl border font-medium transition-all text-left ${
                      active
                        ? "bg-primary/10 text-primary border-primary/30 ring-2 ring-primary/20"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <span className="text-2xl leading-none mt-0.5">{TYPE_EMOJI[value]}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight">
                        {active && <FiCheck className="h-3.5 w-3.5 inline mr-1 mb-0.5" />}
                        {t(`type.types.${value}.label`)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 font-normal leading-snug">
                        {t(`type.types.${value}.desc`)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 1 — Details ───────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("details.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("details.subheading")}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("details.titleLabel")}</label>
              <input
                value={form.title}
                onChange={(e) => { set("title", e.target.value); clearErr("title"); }}
                placeholder={t("details.titlePlaceholder")}
                className={errors.title ? inputErrCls : inputCls}
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("details.descriptionLabel")}</label>
              <textarea
                value={form.description}
                onChange={(e) => { set("description", e.target.value); clearErr("description"); }}
                rows={5}
                placeholder={t("details.descriptionPlaceholder")}
                className={`${errors.description ? inputErrCls : inputCls} resize-none`}
              />
              <div className="flex justify-between items-center">
                {errors.description
                  ? <p className="text-xs text-red-500">{errors.description}</p>
                  : <span />}
                <span className={`text-xs tabular-nums ${form.description.length > 2900 ? "text-red-400" : "text-gray-400"}`}>
                  {form.description.length} / 3000
                </span>
              </div>
            </div>

            {/* Arabic toggle */}
            <div>
              <div
                className="flex items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
                onClick={() => setShowArabic((v) => !v)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">{t("details.arabicTitleLabel")}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t("details.arabicTitleHint")}</p>
                </div>
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                <span onClick={(e) => e.stopPropagation()}>
                  <Switch checked={showArabic} onCheckedChange={setShowArabic} />
                </span>
              </div>

              {showArabic && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">{t("details.arabicTitleLabel")}</label>
                    <input
                      value={form.arabicTitle}
                      onChange={(e) => set("arabicTitle", e.target.value)}
                      dir="rtl"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("details.languagesLabel")}</label>
              <input
                value={form.languages}
                onChange={(e) => set("languages", e.target.value)}
                placeholder={t("details.languagesPlaceholder")}
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* ── Step 2 — Coverage ──────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("coverage.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("coverage.subheading")}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("coverage.destinationLabel")}</label>
              <p className="text-xs text-gray-400">{t("coverage.destinationHint")}</p>
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
                  clearErr("destinationId");
                }}
              >
                <SelectTrigger className={errors.destinationId ? "border-red-400 ring-2 ring-red-200" : undefined}>
                  <span className={form.destinationId ? "text-gray-800" : "text-gray-400"}>
                    {selectedDest?.label ?? t("coverage.destinationPlaceholder")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.destinationId && <p className="text-xs text-red-500">{errors.destinationId}</p>}
            </div>

            {form.destinationId && (
              <div className="flex flex-wrap items-center gap-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-400 font-medium w-full mb-0.5">{t("coverage.locationDetails")}</span>
                {[
                  { label: t("coverage.countryLabel"), value: form.country },
                  { label: t("coverage.regionLabel"),  value: form.region  },
                  { label: t("coverage.cityLabel"), value: form.city },
                ].filter((f) => f.value).map((f) => (
                  <span key={f.label} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700">
                    <span className="text-gray-400">{f.label}:</span> {f.value}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("coverage.addressLabel")}</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("coverage.phoneLabel")}</label>
              <PhoneInput
                value={form.phone}
                onChange={(v) => set("phone", v)}
              />
            </div>
          </div>
        )}

        {/* ── Step 3 — Specs ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("specs.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("specs.subheading")}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("specs.vehicleTypeLabel")}</label>
              <Select value={form.vehicleType} onValueChange={(v) => set("vehicleType", v ?? "")}>
                <SelectTrigger>
                  <span className={form.vehicleType ? "text-gray-800" : "text-gray-400"}>
                    {form.vehicleType
                      ? t(`specs.vehicleTypes.${form.vehicleType as VehicleType}`)
                      : t("specs.vehicleTypePlaceholder")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((v) => (
                    <SelectItem key={v} value={v}>{t(`specs.vehicleTypes.${v}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("specs.brandLabel")}</label>
                <input value={form.brand} onChange={(e) => set("brand", e.target.value)}
                  placeholder={t("specs.brandPlaceholder")} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("specs.modelLabel")}</label>
                <input value={form.model} onChange={(e) => set("model", e.target.value)}
                  placeholder={t("specs.modelPlaceholder")} className={inputCls} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 py-2 border-t border-gray-100">
              <label className="text-sm font-medium text-gray-700">{t("specs.capacityLabel")}</label>
              <CounterInput
                value={form.capacity}
                onChange={(v) => set("capacity", v)}
                min={1}
                max={60}
              />
            </div>

            <div className="space-y-3 pt-1">
              <p className="text-sm font-medium text-gray-700">{t("specs.featuresLabel")}</p>
              {(["isAC", "isMeetGreet", "isChildSeat"] as const).map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
                  onClick={() => set(key, !form[key])}
                >
                  <span className="text-sm text-gray-700">{t(`specs.features.${key}`)}</span>
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                  <span onClick={(e) => e.stopPropagation()}>
                    <Switch checked={form[key]} onCheckedChange={(v) => set(key, v)} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4 — Pricing ───────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("pricing.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("pricing.subheading")}</p>
            </div>

            {(form.type === "AIRPORT_TRANSFER" || form.type === "TAXI") && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  {t("pricing.pricePerTripLabel", { currency: PLATFORM_CURRENCY })}
                </label>
                <input
                  type="number" min={1}
                  value={form.pricePerTrip}
                  onChange={(e) => { set("pricePerTrip", e.target.value); clearErr("pricePerTrip"); }}
                  className={errors.pricePerTrip ? inputErrCls : inputCls}
                />
                {errors.pricePerTrip && <p className="text-xs text-red-500">{errors.pricePerTrip}</p>}
              </div>
            )}

            {form.type === "CHAUFFEUR" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  {t("pricing.pricePerHourLabel", { currency: PLATFORM_CURRENCY })}
                </label>
                <input
                  type="number" min={1}
                  value={form.pricePerHour}
                  onChange={(e) => { set("pricePerHour", e.target.value); clearErr("pricePerHour"); }}
                  className={errors.pricePerHour ? inputErrCls : inputCls}
                />
                {errors.pricePerHour && <p className="text-xs text-red-500">{errors.pricePerHour}</p>}
              </div>
            )}

            {form.type === "SHUTTLE" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    {t("pricing.pricePerTripOptLabel", { currency: PLATFORM_CURRENCY })}
                  </label>
                  <input
                    type="number" min={1}
                    value={form.pricePerTrip}
                    onChange={(e) => { set("pricePerTrip", e.target.value); clearErr("pricePerTrip"); }}
                    className={errors.pricePerTrip ? inputErrCls : inputCls}
                  />
                  {errors.pricePerTrip && <p className="text-xs text-red-500">{errors.pricePerTrip}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    {t("pricing.pricePerPersonLabel", { currency: PLATFORM_CURRENCY })}
                  </label>
                  <input
                    type="number" min={1}
                    value={form.pricePerPerson}
                    onChange={(e) => set("pricePerPerson", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 5 — Review ────────────────────────────────────────────── */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("review.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("review.subheading")}</p>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
              {([
                [t("review.labels.type"),     t(`type.types.${form.type}.label`)],
                [t("review.labels.title"),    form.title],
                [t("review.labels.location"), [selectedDest?.city, selectedDest?.country].filter(Boolean).join(", ") || "—"],
                [t("review.labels.capacity"), t("review.values.passengers", { n: form.capacity })],
                [t("review.labels.features"), [
                  form.isAC        && t("specs.features.isAC"),
                  form.isMeetGreet && t("specs.features.isMeetGreet"),
                  form.isChildSeat && t("specs.features.isChildSeat"),
                ].filter(Boolean).join(", ") || "—"],
                form.pricePerTrip   ? [t("review.labels.pricePerTrip"),   `${form.pricePerTrip} ${PLATFORM_CURRENCY}`]   : null,
                form.pricePerHour   ? [t("review.labels.pricePerHour"),   `${form.pricePerHour} ${PLATFORM_CURRENCY}`]   : null,
                form.pricePerPerson ? [t("review.labels.pricePerPerson"), `${form.pricePerPerson} ${PLATFORM_CURRENCY}`] : null,
              ] as ([string, string] | null)[])
                .filter((x): x is [string, string] => x !== null)
                .map(([label, value]) => (
                  <div key={label} className="flex gap-4 px-4 py-3">
                    <span className="text-xs font-semibold text-gray-500 w-28 shrink-0">{label}</span>
                    <span className="text-sm text-gray-800 break-words">{value}</span>
                  </div>
                ))}
            </div>
            <p className="text-xs text-gray-400 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              {t("review.photosNote")}
            </p>
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────────────── */}
        <div className={`flex pt-2 ${step === 0 ? "justify-end" : "justify-between"}`}>
          {step > 0 && (
            <button type="button" onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:border-gray-400 transition-colors">
              <FiChevronLeft className="h-4 w-4" />
              {t("nav.back")}
            </button>
          )}
          {step < 5 ? (
            <button type="button" onClick={handleNext}
              className="flex items-center gap-1.5 text-sm bg-primary text-white rounded-xl px-5 py-2 hover:bg-primary/90 transition-colors font-medium">
              {t("nav.next")}
              <FiChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" disabled={pending} onClick={handleSubmit}
              className="flex items-center gap-2 text-sm bg-primary text-white rounded-xl px-6 py-2 hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
              <FiCheck className="h-4 w-4" />
              {pending ? t("nav.creating") : t("nav.create")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
