"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiCheck, FiChevronLeft, FiChevronRight, FiMapPin } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PhoneInput } from "@/components/shared/PhoneInput";
import { createShop } from "@/lib/actions/partner-shops";
import { SHOP_CATEGORIES } from "@/lib/utils/shop-categories";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";
import type { DeliveryMethod } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Destination = { id: string; label: string; city: string; country: string; region: string };
type Step = 0 | 1 | 2 | 3 | 4;

type FormData = {
  category:          string;
  name:              string;
  arabicName:        string;
  description:       string;
  arabicDescription: string;
  phone:             string;
  website:           string;
  instagram:         string;
  facebook:          string;
  destinationId:     string;
  country:           string;
  region:            string;
  city:              string;
  address:           string;
  location:          string;
  deliveryMethods:   DeliveryMethod[];
  deliveryFee:       string;
  freeShippingAbove: string;
  minOrderAmount:    string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls    = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const inputErrCls = "w-full border border-red-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400";

function FieldGroup({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Step progress bar ────────────────────────────────────────────────────────

function StepProgress({ current, labels }: { current: Step; labels: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {labels.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${done   ? "bg-primary text-white"
                  : active ? "bg-primary text-white ring-4 ring-primary/20"
                           : "bg-gray-100 text-gray-400"}`}
              >
                {done ? <FiCheck className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-xs mt-1 font-medium whitespace-nowrap ${
                  active ? "text-primary" : done ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 ${done ? "bg-primary" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateShopWizard({
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
  const t      = useTranslations("PartnerShops.wizard");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [step, setStep]     = useState<Step>(0);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | "deliveryMethods", string>>>({});
  const [pending, start]    = useTransition();

  const [form, setForm] = useState<FormData>({
    category:          "",
    name:              "",
    arabicName:        "",
    description:       "",
    arabicDescription: "",
    phone:             profilePhone   ?? "",
    website:           "",
    instagram:         "",
    facebook:          "",
    destinationId:     "",
    country:           profileCountry ?? "",
    region:            profileRegion  ?? "",
    city:              "",
    address:           "",
    location:          "",
    deliveryMethods:   ["PICKUP"],
    deliveryFee:       "",
    freeShippingAbove: "",
    minOrderAmount:    "",
  });

  const set = (key: keyof FormData, value: string | DeliveryMethod[]) =>
    setForm((p) => ({ ...p, [key]: value }));

  function toggleDelivery(method: DeliveryMethod) {
    setForm((p) => {
      const has     = p.deliveryMethods.includes(method);
      const updated = has
        ? p.deliveryMethods.filter((m) => m !== method)
        : [...p.deliveryMethods, method];
      return { ...p, deliveryMethods: updated };
    });
  }

  const hasDelivery = form.deliveryMethods.includes("DELIVERY");

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: typeof errors = {};
    if (step === 0 && !form.category) {
      e.category = t("errors.categoryRequired");
    }
    if (step === 1) {
      if (!form.name.trim())                   e.name        = t("errors.nameRequired");
      else if (form.name.trim().length < 2)    e.name        = t("errors.nameTooShort");
      if (!form.description.trim())            e.description = t("errors.descriptionRequired");
      else if (form.description.trim().length < 20) e.description = t("errors.descriptionTooShort");
    }
    if (step === 2) {
      if (!form.destinationId)   e.destinationId = t("errors.destinationRequired");
      if (!form.country.trim())  e.country        = t("errors.countryRequired");
      if (!form.region.trim())   e.region         = t("errors.regionRequired");
    }
    if (step === 3 && form.deliveryMethods.length === 0) {
      e.deliveryMethods = t("errors.deliveryRequired");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (validate()) setStep((s) => (s + 1) as Step);
  }

  function handleBack() {
    setStep((s) => (s - 1) as Step);
    setErrors({});
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleSubmit() {
    start(async () => {
      const res = await createShop({
        ...form,
        arabicName:        form.arabicName        || undefined,
        arabicDescription: form.arabicDescription || undefined,
        phone:             form.phone             || undefined,
        city:              form.city              || undefined,
        address:           form.address           || undefined,
        location:          form.location          || undefined,
        website:           form.website           || undefined,
        instagram:         form.instagram         || undefined,
        facebook:          form.facebook          || undefined,
        deliveryFee:       form.deliveryFee       ? Number(form.deliveryFee)       : null,
        freeShippingAbove: form.freeShippingAbove ? Number(form.freeShippingAbove) : null,
        minOrderAmount:    form.minOrderAmount    ? Number(form.minOrderAmount)    : null,
        destinationId:     form.destinationId     || undefined,
        isOpen:            true,
        featuredInHome:    false,
      });
      if (res.success) {
        toast.success(t("create"));
        router.push(`/${locale}/partner/shops`);
      } else {
        toast.error(res.error ?? t("create"));
      }
    });
  }

  // ── Step labels ────────────────────────────────────────────────────────────

  const STEP_LABELS = [
    t("category"),
    t("details"),
    t("location"),
    t("delivery"),
    t("review"),
  ];

  const selectedCatLabel  = SHOP_CATEGORIES.find((c) => c.id === form.category)?.label.en ?? "";
  const selectedDestLabel = destinations.find((d) => d.id === form.destinationId)?.label ?? "";

  // ── Delivery method rows ───────────────────────────────────────────────────

  const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string; desc: string }[] = [
    { value: "PICKUP",   label: t("pickupLabel"),   desc: t("pickupDesc")   },
    { value: "DELIVERY", label: t("deliveryLabel"), desc: t("deliveryDesc") },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <StepProgress current={step} labels={STEP_LABELS} />

      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-6">

        {/* ── Step 0 — Category ───────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("step0Title")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("step0Subtitle")}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SHOP_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => set("category", cat.id)}
                  className={`flex flex-col items-center gap-2 px-4 py-5 rounded-xl border font-medium transition-all text-center ${
                    form.category === cat.id
                      ? "bg-primary/10 text-primary border-primary/30 ring-2 ring-primary/20"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-semibold leading-tight">{cat.label.en}</span>
                </button>
              ))}
            </div>
            {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
          </div>
        )}

        {/* ── Step 1 — Details ────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("step1Title")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("step1Subtitle")}</p>
            </div>

            <FieldGroup label={`${t("nameLabel")} *`} error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={t("namePlaceholder")}
                className={errors.name ? inputErrCls : inputCls}
              />
            </FieldGroup>

            <FieldGroup label={t("arabicNameLabel")}>
              <input
                value={form.arabicName}
                onChange={(e) => set("arabicName", e.target.value)}
                dir="rtl"
                placeholder="الاسم بالعربية"
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label={`${t("descriptionLabel")} *`} error={errors.description}>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                placeholder={t("descriptionPlaceholder")}
                className={`${errors.description ? inputErrCls : inputCls} resize-none`}
              />
            </FieldGroup>

            <FieldGroup label={t("arabicDescriptionLabel")}>
              <textarea
                value={form.arabicDescription}
                onChange={(e) => set("arabicDescription", e.target.value)}
                rows={3}
                dir="rtl"
                placeholder="الوصف بالعربية"
                className={`${inputCls} resize-none`}
              />
            </FieldGroup>

            <FieldGroup label={t("phoneLabel")}>
              <PhoneInput
                value={form.phone}
                onChange={(v) => set("phone", v)}
              />
            </FieldGroup>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">{t("socialLabel")}</label>
              <input
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder={t("websitePlaceholder")}
                className={inputCls}
              />
              <input
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                placeholder={t("instagramPlaceholder")}
                className={inputCls}
              />
              <input
                value={form.facebook}
                onChange={(e) => set("facebook", e.target.value)}
                placeholder={t("facebookPlaceholder")}
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* ── Step 2 — Location ───────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("step2Title")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("step2Subtitle")}</p>
            </div>

            {/* Destination selector */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                {t("destinationLabel")} *
              </label>
              <Select
                value={form.destinationId}
                onValueChange={(v) => {
                  const dest = destinations.find((d) => d.id === v);
                  setForm((p) => ({
                    ...p,
                    destinationId: v,
                    ...(dest
                      ? { country: dest.country, region: dest.region || p.region, city: dest.city }
                      : {}),
                  }));
                }}
              >
                <SelectTrigger className="pl-9 relative">
                  <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <span className={form.destinationId ? "text-gray-800" : "text-gray-400"}>
                    {destinations.find((d) => d.id === form.destinationId)?.label ?? t("destinationPlaceholder")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.destinationId && (
                <p className="text-xs text-red-500">{errors.destinationId}</p>
              )}
            </div>

            {/* Destination chips — auto-filled */}
            {form.destinationId && (
              <div className="flex flex-wrap gap-2">
                {[
                  { label: form.country, key: "country" },
                  { label: form.region,  key: "region"  },
                  { label: form.city,    key: "city"    },
                ]
                  .filter((c) => c.label)
                  .map((c) => (
                    <span
                      key={c.key}
                      className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium"
                    >
                      {c.label}
                    </span>
                  ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label={`${t("countryLabel")} *`} error={errors.country}>
                <input
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  className={errors.country ? inputErrCls : inputCls}
                />
              </FieldGroup>
              <FieldGroup label={`${t("regionLabel")} *`} error={errors.region}>
                <input
                  value={form.region}
                  onChange={(e) => set("region", e.target.value)}
                  placeholder={t("regionPlaceholder")}
                  className={errors.region ? inputErrCls : inputCls}
                />
              </FieldGroup>
            </div>

            <FieldGroup label={t("cityLabel")}>
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder={t("cityPlaceholder")}
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label={t("addressLabel")}>
              <input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder={t("addressPlaceholder")}
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label={t("mapsLabel")}>
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder={t("mapsPlaceholder")}
                className={inputCls}
              />
            </FieldGroup>
          </div>
        )}

        {/* ── Step 3 — Delivery ───────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("step3Title")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("step3Subtitle")}</p>
            </div>

            {/* Delivery method toggles */}
            <div className="space-y-2">
              {DELIVERY_OPTIONS.map(({ value, label, desc }) => (
                <div
                  key={value}
                  className="flex items-start justify-between gap-4 p-4 border border-gray-200 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <Switch
                    checked={form.deliveryMethods.includes(value)}
                    onCheckedChange={() => toggleDelivery(value)}
                  />
                </div>
              ))}
            </div>
            {errors.deliveryMethods && (
              <p className="text-xs text-red-500">{errors.deliveryMethods}</p>
            )}

            {/* Delivery fee — shown only when DELIVERY is enabled */}
            {hasDelivery && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  {t("deliveryFeeLabel", { currency: PLATFORM_CURRENCY })}
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.deliveryFee}
                  onChange={(e) => set("deliveryFee", e.target.value)}
                  placeholder={t("deliveryFeePlaceholder")}
                  className={inputCls}
                />
                <p className="text-xs text-gray-400">{t("deliveryFeeHint")}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  {t("freeShippingLabel", { currency: PLATFORM_CURRENCY })}
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.freeShippingAbove}
                  onChange={(e) => set("freeShippingAbove", e.target.value)}
                  placeholder={t("freeShippingPlaceholder")}
                  className={inputCls}
                />
                <p className="text-xs text-gray-400">{t("freeShippingHint")}</p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  {t("minOrderLabel", { currency: PLATFORM_CURRENCY })}
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.minOrderAmount}
                  onChange={(e) => set("minOrderAmount", e.target.value)}
                  placeholder={t("minOrderPlaceholder")}
                  className={inputCls}
                />
                <p className="text-xs text-gray-400">{t("minOrderHint")}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4 — Review ─────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("step4Title")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("step4Subtitle")}</p>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
              {[
                [t("reviewCategory"),    selectedCatLabel || t("noValue")],
                [t("reviewDestination"), selectedDestLabel || t("noValue")],
                [t("reviewName"),        form.name],
                [t("reviewDescription"), form.description.slice(0, 100) + (form.description.length > 100 ? "…" : "")],
                [t("reviewCountry"),     form.country],
                [t("reviewRegion"),      form.region],
                [t("reviewCity"),        form.city || t("noValue")],
                [t("reviewDelivery"),    form.deliveryMethods.join(", ") || t("noValue")],
                [
                  t("reviewDeliveryFee"),
                  form.deliveryFee
                    ? t("deliveryFeeValue", { currency: PLATFORM_CURRENCY, amount: form.deliveryFee })
                    : t("noValue"),
                ],
                [
                  t("reviewFreeShipping"),
                  form.freeShippingAbove
                    ? t("freeAboveValue", { currency: PLATFORM_CURRENCY, amount: form.freeShippingAbove })
                    : t("noValue"),
                ],
                [
                  t("reviewMinOrder"),
                  form.minOrderAmount
                    ? t("minOrderValue", { currency: PLATFORM_CURRENCY, amount: form.minOrderAmount })
                    : t("noValue"),
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 px-4 py-3">
                  <span className="text-xs font-semibold text-gray-500 w-32 shrink-0">{label}</span>
                  <span className="text-sm text-gray-800 break-words">{value}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              {t("reviewHint")}
            </p>
          </div>
        )}

        {/* ── Navigation ──────────────────────────────────────────────────── */}
        <div className={`flex pt-2 ${step === 0 ? "justify-end" : "justify-between"}`}>
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:border-gray-400 transition-colors"
            >
              <FiChevronLeft className="h-4 w-4" />
              {t("back")}
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 text-sm bg-primary text-white rounded-xl px-5 py-2 hover:bg-primary/90 transition-colors font-medium"
            >
              {t("next")} <FiChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={handleSubmit}
              className="flex items-center gap-2 text-sm bg-primary text-white rounded-xl px-6 py-2 hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              <FiCheck className="h-4 w-4" />
              {pending ? t("creating") : t("create")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
