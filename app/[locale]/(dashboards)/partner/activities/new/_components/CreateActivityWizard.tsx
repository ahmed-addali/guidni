"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  FiCheck, FiChevronLeft, FiChevronRight, FiCamera,
} from "react-icons/fi";
import { createActivity } from "@/lib/actions/partner";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { TimeSlotPicker } from "@/components/partner/TimeSlotPicker";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { CategoryMultiSelect } from "@/components/partner/CategoryMultiSelect";
import { DurationPicker } from "@/components/partner/DurationPicker";
import { Switch } from "@/components/ui/switch";
import { PhoneInput } from "@/components/shared/PhoneInput";

// ─── Steps ────────────────────────────────────────────────────────────────────
type Step = 0 | 1 | 2;

// ─── Types ────────────────────────────────────────────────────────────────────
type Destination = { id: string; label: string; city: string; country: string; region: string };

type FormData = {
  categories:        string[];
  title:             string;
  arabicTitle:       string;
  description:       string;
  arabicDescription: string;
  phone:             string;
  duration:          string;
  durationMinutes:   number;
  availableTimes:    string[];
  price:             number;
  capacity:          number;
  cancelation:       boolean;
  paynow:            boolean;
  country:           string;
  region:            string;
  city:              string;
  address:           string;
  destinationId:     string;
};

const DEFAULTS: FormData = {
  categories:        [],
  title:             "",
  arabicTitle:       "",
  description:       "",
  arabicDescription: "",
  phone:             "",
  duration:          "",
  durationMinutes:   0,
  availableTimes:    [],
  price:             0,
  capacity:          1,
  cancelation:       true,
  paynow:            false,
  country:           "",
  region:            "",
  city:              "",
  address:           "",
  destinationId:     "",
};

// ─── Step Progress Bar ────────────────────────────────────────────────────────
function StepProgress({ current, steps }: { current: Step; steps: string[] }) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
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
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 ${done ? "bg-primary" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Field Group ──────────────────────────────────────────────────────────────
function FieldGroup({
  label, hint, error, children,
}: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Policy Toggle Row ─────────────────────────────────────────────────────────
function PolicyToggle({
  label, hint, checked, onCheckedChange,
}: { label: string; hint: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div
      className="flex items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
      onClick={() => onCheckedChange(!checked)}
    >
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

const inputCls    = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const inputErrCls = "w-full border border-red-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400";

// ─── Wizard ───────────────────────────────────────────────────────────────────
export function CreateActivityWizard({
  profileCountry,
  profileRegion,
  profilePhone,
  destinations,
}: {
  profileCountry?:  string;
  profileRegion?:   string;
  profilePhone?:    string;
  destinations:     Destination[];
}) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t      = useTranslations("PartnerDashboard.newActivity.wizard");

  const stepLabels = [t("steps.basics"), t("steps.location"), t("steps.pricing")];

  const [step, setStep]       = useState<Step>(0);
  const [form, setForm]       = useState<FormData>({
    ...DEFAULTS,
    country: profileCountry ?? "",
    region:  profileRegion  ?? "",
    phone:   profilePhone   ?? "",
  });
  const [errors, setErrors]   = useState<Partial<Record<keyof FormData, string>>>({});
  const [pending, start]      = useTransition();
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Arabic section visibility (Basics step)
  const [showArabic, setShowArabic] = useState(false);

  const set = (key: keyof FormData, value: string | number | boolean | string[]) =>
    setForm((p) => ({ ...p, [key]: value }));

  function clearError(key: keyof FormData) {
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function blurValidate(key: keyof FormData) {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (key === "title") {
      if (!form.title.trim())                e.title       = t("validation.titleRequired");
      else if (form.title.trim().length < 3) e.title       = t("validation.titleMin");
    }
    if (key === "description") {
      if (!form.description.trim())                 e.description = t("validation.descriptionRequired");
      else if (form.description.trim().length < 20) e.description = t("validation.descriptionMin");
    }
    if (key === "price")    { if (!form.price || form.price <= 0)      e.price    = t("validation.priceRequired"); }
    if (key === "capacity") { if (!form.capacity || form.capacity < 1) e.capacity = t("validation.capacityRequired"); }
    if (Object.keys(e).length) setErrors((prev) => ({ ...prev, ...e }));
    else clearError(key);
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 0) {
      if (form.categories.length === 0) e.categories  = t("validation.categoriesRequired");
      if (!form.title.trim())           e.title        = t("validation.titleRequired");
      if (form.title.trim().length < 3) e.title        = t("validation.titleMin");
      if (!form.description.trim())     e.description  = t("validation.descriptionRequired");
      if (form.description.trim().length < 20) e.description = t("validation.descriptionMin");
      if (!form.phone.trim())           e.phone        = t("validation.phoneRequired");
    }
    if (step === 1) {
      if (!form.destinationId)  e.destinationId = t("validation.destinationRequired");
    }
    if (step === 2) {
      if (!form.price || form.price <= 0)           e.price          = t("validation.priceRequired");
      if (!form.capacity || form.capacity < 1)      e.capacity       = t("validation.capacityRequired");
      if (form.availableTimes.length === 0)         e.availableTimes = t("validation.timesRequired");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (validate()) setStep((s) => (s + 1) as Step);
  }

  function handleBack() {
    setStep((s) => (s - 1) as Step);
  }

  function handleCreate() {
    if (!validate()) return;
    start(async () => {
      const res = await createActivity({
        ...form,
        arabicTitle:       form.arabicTitle       || undefined,
        arabicDescription: form.arabicDescription || undefined,
        availableTimes:    form.availableTimes,
        destinationId:     form.destinationId     || undefined,
      });
      if (res.success) {
        toast.success(t("photos.heading"));
        setCreatedId(res.data.id);
      } else {
        toast.error(res.error ?? t("createFailed"));
      }
    });
  }

  // ─── Post-creation photos screen ──────────────────────────────────────────
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
              <p className="text-sm text-gray-400 mt-0.5">
                {t("photos.subheading")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <FiCamera className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700">
              {t("photos.hint")}
            </p>
          </div>

          <ImageUploader entity="activity" entityId={createdId} images={[]} />

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/partner/activities`)}
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

  const selectedDest = destinations.find((d) => d.id === form.destinationId);

  return (
    <div className="max-w-2xl mx-auto">
      <StepProgress current={step} steps={stepLabels} />

      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-6">

        {/* ── Step 0 — Basics ─────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("basics.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("basics.subheading")}</p>
            </div>

            {/* Categories */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("basics.categoriesLabel")}</label>
              <CategoryMultiSelect
                value={form.categories}
                onChange={(cats) => { setForm((p) => ({ ...p, categories: cats })); clearError("categories"); }}
                error={errors.categories}
              />
            </div>

            <div className="border-t border-gray-100 pt-5 space-y-5">
              {/* Title */}
              <FieldGroup label={t("basics.titleLabel")} error={errors.title}>
                <input
                  value={form.title}
                  onChange={(e) => { set("title", e.target.value); clearError("title"); }}
                  onBlur={() => blurValidate("title")}
                  placeholder={t("basics.titlePlaceholder")}
                  className={errors.title ? inputErrCls : inputCls}
                />
              </FieldGroup>

              {/* Description */}
              <FieldGroup label={t("basics.descriptionLabel")} error={errors.description}>
                <textarea
                  value={form.description}
                  onChange={(e) => { set("description", e.target.value); clearError("description"); }}
                  onBlur={() => blurValidate("description")}
                  rows={4}
                  placeholder={t("basics.descriptionPlaceholder")}
                  className={`${errors.description ? inputErrCls : inputCls} resize-none`}
                />
              </FieldGroup>

              {/* Arabic toggle */}
              <div>
                <div
                  className="flex items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
                  onClick={() => setShowArabic((v) => !v)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t("basics.arabicToggleLabel")}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t("basics.arabicToggleHint")}</p>
                  </div>
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                  <span onClick={(e) => e.stopPropagation()}>
                    <Switch checked={showArabic} onCheckedChange={setShowArabic} />
                  </span>
                </div>

                {showArabic && (
                  <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                    <FieldGroup label={t("basics.arabicTitleLabel")} hint={t("basics.arabicTitleHint")}>
                      <input
                        value={form.arabicTitle}
                        onChange={(e) => set("arabicTitle", e.target.value)}
                        placeholder="e.g. رحلة الجمال عند الشروق"
                        dir="rtl"
                        className={inputCls}
                      />
                    </FieldGroup>
                    <FieldGroup label={t("basics.arabicDescriptionLabel")} hint={t("basics.arabicTitleHint")}>
                      <textarea
                        value={form.arabicDescription}
                        onChange={(e) => set("arabicDescription", e.target.value)}
                        rows={4}
                        placeholder="وصف التجربة، ما هو مشمول، نقطة الالتقاء..."
                        dir="rtl"
                        className={`${inputCls} resize-none`}
                      />
                    </FieldGroup>
                  </div>
                )}
              </div>

              {/* Phone + Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("basics.phoneLabel")} *
                  </label>
                  <PhoneInput
                    value={form.phone}
                    onChange={(v) => set("phone", v)}
                    error={errors.phone}
                  />
                </div>
                <FieldGroup label={t("basics.durationLabel")}>
                  <DurationPicker
                    value={form.duration}
                    onChange={(v, mins) => setForm((p) => ({ ...p, duration: v, durationMinutes: mins }))}
                  />
                </FieldGroup>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1 — Location ───────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("location.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("location.subheading")}</p>
            </div>

            <FieldGroup label={t("location.destinationLabel")} error={errors.destinationId}
              hint={t("location.destinationHint")}>
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
                  clearError("destinationId");
                }}
              >
                <SelectTrigger className={errors.destinationId ? "border-red-300 ring-2 ring-red-200" : ""}>
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
            </FieldGroup>

            {/* Derived location info — read-only when destination is set */}
            {selectedDest && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-400 font-medium w-full mb-0.5">{t("location.locationDetails")}</span>
                  {[
                    { label: "Country", value: form.country },
                    { label: "Region",  value: form.region  },
                    { label: "City",    value: form.city    },
                  ].filter((f) => f.value).map((f) => (
                    <span key={f.label} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700">
                      <span className="text-gray-400">{f.label}:</span> {f.value}
                    </span>
                  ))}
                </div>
                <FieldGroup label={t("location.addressLabel")}>
                  <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder={t("location.addressPlaceholder")} className={inputCls} />
                </FieldGroup>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2 — Pricing & Availability ─────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("pricing.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("pricing.subheading")}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label={t("pricing.priceLabel")} error={errors.price}>
                <input
                  type="number" min={0}
                  value={form.price}
                  onChange={(e) => { set("price", parseInt(e.target.value) || 0); clearError("price"); }}
                  onBlur={() => blurValidate("price")}
                  className={errors.price ? inputErrCls : inputCls}
                />
              </FieldGroup>
              <FieldGroup label={t("pricing.capacityLabel")} hint={t("pricing.capacityHint")} error={errors.capacity}>
                <input
                  type="number" min={1}
                  value={form.capacity}
                  onChange={(e) => { set("capacity", parseInt(e.target.value) || 1); clearError("capacity"); }}
                  onBlur={() => blurValidate("capacity")}
                  className={errors.capacity ? inputErrCls : inputCls}
                />
              </FieldGroup>
            </div>

            <FieldGroup label={t("pricing.timesLabel")} error={errors.availableTimes}>
              <TimeSlotPicker
                value={form.availableTimes}
                onChange={(slots) => { set("availableTimes", slots); clearError("availableTimes"); }}
              />
            </FieldGroup>

            <div className="space-y-3 pt-1">
              <PolicyToggle
                label={t("pricing.freeCancellationLabel")}
                hint={t("pricing.freeCancellationHint")}
                checked={form.cancelation}
                onCheckedChange={(v) => set("cancelation", v)}
              />
              <PolicyToggle
                label={t("pricing.payNowLabel")}
                hint={t("pricing.payNowHint")}
                checked={form.paynow}
                onCheckedChange={(v) => set("paynow", v)}
              />
            </div>
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
              <FiChevronLeft className="h-4 w-4" /> {t("nav.back")}
            </button>
          )}
          {step < 2 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 text-sm bg-primary text-white rounded-xl px-5 py-2 hover:bg-primary/90 transition-colors font-medium"
            >
              {t("nav.next")} <FiChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={handleCreate}
              className="flex items-center gap-2 text-sm bg-primary text-white rounded-xl px-6 py-2 hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              <FiCheck className="h-4 w-4" />
              {pending ? t("nav.creating") : t("nav.create")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
