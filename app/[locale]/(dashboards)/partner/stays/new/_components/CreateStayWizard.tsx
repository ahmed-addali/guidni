"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiCheck, FiChevronLeft, FiChevronRight, FiCamera } from "react-icons/fi";
import { createStay } from "@/lib/actions/partner";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/shared/PhoneInput";
import { CounterInput } from "@/components/shared/CounterInput";
import { TimePickerInput } from "@/components/shared/TimePickerInput";
import {
  PROPERTY_TYPES,
  SPACE_CATEGORIES,
  AMENITY_KEYS,
  AMENITY_ICONS,
  type AmenityKey,
} from "@/lib/utils/stay-constants";

// ─── Constants ────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3 | 4 | 5;

type Destination = { id: string; label: string; city: string; country: string; region: string };

type FormData = {
  propertyType:       string;
  category:           string;
  title:              string;
  arabicTitle:        string;
  description:        string;
  arabicDescription:  string;
  price:              number;
  guestCount:         number;
  bedroomCount:       number;
  bedCount:           number;
  bathroomCount:      number;
  country:            string;
  region:             string;
  city:               string;
  address:            string;
  phone:              string;
  checkInTime:        string;
  checkOutTime:       string;
  minStayNights:      number;
  hasWifi:              boolean;
  hasPool:              boolean;
  hasParking:           boolean;
  hasKitchen:           boolean;
  hasAirConditioning:   boolean;
  isPetFriendly:        boolean;
  hasHeating:           boolean;
  hasGarden:            boolean;
  hasBalcony:           boolean;
  hasSecurity:          boolean;
  hasConcierge:         boolean;
  isSmokeFree:          boolean;
  wheelchairAccessible: boolean;
  elevatorAvailable:    boolean;
  destinationId:        string;
};

const DEFAULTS: FormData = {
  propertyType:       PROPERTY_TYPES[0],
  category:           SPACE_CATEGORIES[0],
  title:              "",
  arabicTitle:        "",
  description:        "",
  arabicDescription:  "",
  price:              0,
  guestCount:         2,
  bedroomCount:       1,
  bedCount:           1,
  bathroomCount:      1,
  country:            "",
  region:             "",
  city:               "",
  address:            "",
  phone:              "",
  checkInTime:        "15:00",
  checkOutTime:       "11:00",
  minStayNights:      1,
  hasWifi:              false,
  hasPool:              false,
  hasParking:           false,
  hasKitchen:           false,
  hasAirConditioning:   false,
  isPetFriendly:        false,
  hasHeating:           false,
  hasGarden:            false,
  hasBalcony:           false,
  hasSecurity:          false,
  hasConcierge:         false,
  isSmokeFree:          true,
  wheelchairAccessible: false,
  elevatorAvailable:    false,
  destinationId:      "",
};

// ─── Step progress bar ────────────────────────────────────────────────────────

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

// ─── Amenity keys ─────────────────────────────────────────────────────────────


// ─── Main component ───────────────────────────────────────────────────────────

export function CreateStayWizard({
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
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t      = useTranslations("PartnerDashboard.newStay.wizard");

  const [step, setStep]             = useState<Step>(0);
  const [showArabic, setShowArabic] = useState(false);
  const [createdId, setCreatedId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormData>({
    ...DEFAULTS,
    country: profileCountry ?? "",
    region:  profileRegion  ?? "",
    phone:   profilePhone   ?? "",
  });
  const [errors, setErrors]     = useState<Partial<Record<keyof FormData, string>>>({});
  const [pending, start]        = useTransition();

  const set      = (key: keyof FormData, value: string | number) => setForm((p) => ({ ...p, [key]: value }));
  const setB     = (key: keyof FormData, value: boolean)          => setForm((p) => ({ ...p, [key]: value }));
  const clearErr = (key: keyof FormData)                          => setErrors((e) => { const n = { ...e }; delete n[key]; return n; });

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 0) {
      if (!form.propertyType) e.propertyType = t("validation.propertyTypeRequired");
      if (!form.category)     e.category     = t("validation.categoryRequired");
    }
    if (step === 1) {
      if (!form.title.trim())           e.title       = t("validation.titleRequired");
      if (form.title.trim().length < 3) e.title       = t("validation.titleMin");
      if (!form.description.trim())     e.description = t("validation.descriptionRequired");
      if (form.description.trim().length < 20) e.description = t("validation.descriptionMin");
    }
    if (step === 2) {
      if (!form.destinationId)    e.destinationId = t("validation.destinationRequired");
      if (!form.phone.trim())     e.phone         = t("validation.phoneRequired");
    }
    if (step === 4) {
      if (!form.price || form.price <= 0) e.price      = t("validation.priceRequired");
      if (form.guestCount < 1)            e.guestCount = t("validation.guestCountRequired");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext()   { if (validate()) setStep((s) => (s + 1) as Step); }
  function handleBack()   { setStep((s) => (s - 1) as Step); }

  const selectedDestLabel = destinations.find((d) => d.id === form.destinationId)?.label ?? "";

  function handleSubmit() {
    start(async () => {
      const res = await createStay({
        ...form,
        arabicTitle:       form.arabicTitle       || undefined,
        arabicDescription: form.arabicDescription || undefined,
        destinationId:     form.destinationId     || undefined,
      });
      if (res.success && res.data) {
        setCreatedId(res.data.id);
      } else {
        toast.error(res.error ?? t("createFailed"));
      }
    });
  }

  const stepLabels = [
    t("steps.type"), t("steps.details"), t("steps.location"),
    t("steps.amenities"), t("steps.pricing"), t("steps.review"),
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

          <ImageUploader entity="stay" entityId={createdId} images={[]} />

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/partner/stays`)}
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
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("type.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("type.subheading")}</p>
            </div>

            {/* Property type grid */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("type.propertyTypeLabel")}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PROPERTY_TYPES.map((type) => {
                  const active = form.propertyType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { set("propertyType", type); clearErr("propertyType"); }}
                      className={`relative text-sm px-4 py-3 rounded-xl border font-medium text-left transition-all ${
                        active
                          ? "bg-primary/10 text-primary border-primary/30 ring-2 ring-primary/20"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {active && <FiCheck className="h-3.5 w-3.5 inline mr-1.5 mb-0.5" />}
                      {t(`type.types.${type.replace(" ", "") as "Apartment"}`)}
                    </button>
                  );
                })}
              </div>
              {errors.propertyType && <p className="text-xs text-red-500">{errors.propertyType}</p>}
            </div>

            {/* Space category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("type.spaceCategoryLabel")}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SPACE_CATEGORIES.map((cat) => {
                  const key = cat.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("") as "EntirePlace";
                  const active = form.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => { set("category", cat); clearErr("category"); }}
                      className={`flex flex-col gap-1 px-4 py-3 rounded-xl border font-medium text-left transition-all ${
                        active
                          ? "bg-primary/10 text-primary border-primary/30 ring-2 ring-primary/20"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <span className="text-sm">{t(`type.categories.${key}`)}</span>
                      <span className="text-xs font-normal text-gray-500 leading-snug">
                        {t(`type.categoryHints.${key}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
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

            {/* Title */}
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

            {/* Description */}
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
                  <p className="text-sm font-medium text-gray-700">{t("details.arabicToggleLabel")}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t("details.arabicToggleHint")}</p>
                </div>
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                <span onClick={(e) => e.stopPropagation()}>
                  <Switch checked={showArabic} onCheckedChange={setShowArabic} />
                </span>
              </div>

              {showArabic && (
                <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">{t("details.arabicTitleLabel")}</label>
                    <p className="text-xs text-gray-400">{t("details.arabicTitleHint")}</p>
                    <input
                      value={form.arabicTitle}
                      onChange={(e) => set("arabicTitle", e.target.value)}
                      dir="rtl"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">{t("details.arabicDescriptionLabel")}</label>
                    <textarea
                      value={form.arabicDescription}
                      onChange={(e) => set("arabicDescription", e.target.value)}
                      rows={4}
                      dir="rtl"
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Room counts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {([
                ["guestCount",    t("details.guestCountLabel"),    1, 30],
                ["bedroomCount",  t("details.bedroomCountLabel"),  1, 20],
                ["bedCount",      t("details.bedCountLabel"),      1, 30],
                ["bathroomCount", t("details.bathroomCountLabel"), 1, 15],
              ] as [keyof FormData, string, number, number][]).map(([key, label, min, max]) => (
                <div key={key} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <CounterInput
                    value={form[key] as number}
                    onChange={(v) => set(key, v)}
                    min={min}
                    max={max}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2 — Location ──────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("location.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("location.subheading")}</p>
            </div>

            {/* Destination */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("location.destinationLabel")}</label>
              <p className="text-xs text-gray-400">{t("location.destinationHint")}</p>
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
                    {destinations.find((d) => d.id === form.destinationId)?.label ?? t("location.destinationPlaceholder")}
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
                <span className="text-xs text-gray-400 font-medium w-full mb-0.5">{t("location.locationDetails")}</span>
                {[
                  { label: t("location.countryLabel"), value: form.country },
                  { label: t("location.regionLabel"),  value: form.region  },
                  { label: t("location.cityLabel"),    value: form.city    },
                ].filter((f) => f.value).map((f) => (
                  <span key={f.label} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700">
                    <span className="text-gray-400">{f.label}:</span> {f.value}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("location.addressLabel")}</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("location.phoneLabel")}</label>
              <PhoneInput
                value={form.phone}
                onChange={(v) => { set("phone", v); if (v.trim()) clearErr("phone"); }}
                error={errors.phone}
              />
            </div>
          </div>
        )}

        {/* ── Step 3 — Amenities ─────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("amenities.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("amenities.subheading")}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AMENITY_KEYS.map((key) => {
                const Icon = AMENITY_ICONS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setB(key, !(form[key] as boolean))}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border font-medium text-sm transition-all text-left ${
                      form[key]
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {t(`amenities.labels.${key}` as any)}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("amenities.checkInLabel")}</label>
                <div className={`${inputCls} flex items-center`}>
                  <TimePickerInput
                    value={form.checkInTime}
                    onChange={(v) => set("checkInTime", v)}
                    placeholder="00:00"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("amenities.checkOutLabel")}</label>
                <div className={`${inputCls} flex items-center`}>
                  <TimePickerInput
                    value={form.checkOutTime}
                    onChange={(v) => set("checkOutTime", v)}
                    placeholder="00:00"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <label className="text-sm font-medium text-gray-700">{t("amenities.minStayLabel")}</label>
                <CounterInput
                  value={form.minStayNights}
                  onChange={(v) => set("minStayNights", v)}
                  min={1}
                  max={365}
                />
              </div>
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
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("pricing.priceLabel")}</label>
                <input type="number" min={0} value={form.price}
                  onChange={(e) => { set("price", parseInt(e.target.value) || 0); clearErr("price"); }}
                  className={errors.price ? inputErrCls : inputCls} />
                {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
              </div>
              <div className="flex items-center justify-between gap-4 py-3 border-t border-gray-100">
                <div>
                  <label className="text-sm font-medium text-gray-700">{t("pricing.guestCountLabel")}</label>
                  {errors.guestCount && <p className="text-xs text-red-500 mt-0.5">{errors.guestCount}</p>}
                </div>
                <CounterInput
                  value={form.guestCount}
                  onChange={(v) => { set("guestCount", v); clearErr("guestCount"); }}
                  min={1}
                  max={30}
                />
              </div>
            </div>
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
                [t("review.labels.destination"), selectedDestLabel || "—"],
                [t("review.labels.type"),        `${form.propertyType} · ${form.category}`],
                [t("review.labels.title"),       form.title],
                [t("review.labels.description"), form.description.slice(0, 100) + (form.description.length > 100 ? "…" : "")],
                [t("review.labels.guests"),      t("review.values.guestsMax", { count: form.guestCount })],
                [t("review.labels.rooms"),       t("review.values.roomsSummary", { bedrooms: form.bedroomCount, beds: form.bedCount, bathrooms: form.bathroomCount })],
                [t("review.labels.country"),     form.country],
                [t("review.labels.region"),      form.region],
                [t("review.labels.price"),       t("review.values.pricePerNight", { price: form.price })],
                [t("review.labels.minStay"),     form.minStayNights === 1 ? t("review.values.minNight", { count: 1 }) : t("review.values.minNights", { count: form.minStayNights })],
                [t("review.labels.checkIn"),     t("review.values.checkInOut", { checkIn: form.checkInTime, checkOut: form.checkOutTime })],
              ] as [string, string][]).map(([label, value]) => (
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
