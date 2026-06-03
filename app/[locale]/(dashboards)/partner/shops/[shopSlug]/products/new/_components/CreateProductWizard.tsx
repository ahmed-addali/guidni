"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiCheck, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { createProduct } from "@/lib/actions/partner-shops";
import { PRODUCT_CATEGORIES } from "@/lib/utils/shop-categories";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3 | 4;

type FormData = {
  category:          string;
  name:              string;
  arabicName:        string;
  description:       string;
  arabicDescription: string;
  price:             string;
  comparePrice:      string;
  stock:             string;
  material:          string;
  origin:            string;
  weight:            string;
  isHandmade:        boolean;
  isLocalOnly:       boolean;
  featured:          boolean;
  tags:              string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls    = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const inputErrCls = "w-full border border-red-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400";

function FieldGroup({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && " *"}
      </label>
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
              <span className={`text-xs mt-1 font-medium whitespace-nowrap ${
                active ? "text-primary" : done ? "text-gray-600" : "text-gray-400"
              }`}>
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

export function CreateProductWizard({
  shopId,
  shopSlug,
}: {
  shopId:   string;
  shopSlug: string;
}) {
  const t      = useTranslations("PartnerDashboard.newProduct");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [step, setStep]     = useState<Step>(0);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [pending, start]    = useTransition();
  const [tagInput, setTagInput]          = useState("");
  const [createdProductId, setCreatedId] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    category:          "",
    name:              "",
    arabicName:        "",
    description:       "",
    arabicDescription: "",
    price:             "",
    comparePrice:      "",
    stock:             "0",
    material:          "",
    origin:            "",
    weight:            "",
    isHandmade:        false,
    isLocalOnly:       false,
    featured:          false,
    tags:              [],
  });

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (!form.tags.includes(tag)) set("tags", [...form.tags, tag]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    set("tags", form.tags.filter((t) => t !== tag));
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateStep(s: Step): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (s === 0 && !form.category)                          e.category    = t("errors.categoryRequired");
    if (s === 1 && !form.name.trim())                       e.name        = t("errors.nameRequired");
    if (s === 1 && form.description.trim().length < 20)     e.description = t("errors.descriptionRequired");
    if (s === 2 && (!form.price || Number(form.price) <= 0)) e.price      = t("errors.priceRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => (s + 1) as Step);
  }

  function goBack() {
    setErrors({});
    setStep((s) => (s - 1) as Step);
  }

  function handleCreate() {
    start(async () => {
      const res = await createProduct(shopId, {
        ...form,
        arabicName:        form.arabicName        || undefined,
        arabicDescription: form.arabicDescription || undefined,
        material:          form.material          || undefined,
        origin:            form.origin            || undefined,
        price:             Number(form.price),
        comparePrice:      form.comparePrice ? Number(form.comparePrice) : null,
        weight:            form.weight       ? Number(form.weight)       : null,
        stock:             Number(form.stock),
      });
      if (res.success && res.data) {
        toast.success(t("createSuccess"));
        setCreatedId(res.data.id);
        setStep(4);
      } else {
        toast.error(res.error ?? t("createFailed"));
      }
    });
  }

  const stepLabels = [
    t("stepCategory"),
    t("stepDetails"),
    t("stepPricing"),
    t("stepAttributes"),
    t("stepPhotos"),
  ];

  // ── Phase 4: Photos ──────────────────────────────────────────────────────────
  if (step === 4 && createdProductId) {
    return (
      <div className="space-y-6">
        <StepProgress current={4} labels={stepLabels} />

        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <FiCheck className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">{t("createdTitle")}</p>
            <p className="text-xs text-green-600 mt-0.5">{t("createdHint")}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">{t("imagesHeading")}</h3>
          <p className="text-xs text-gray-400 mb-4">{t("imagesHint")}</p>
          <ImageUploader entity="product" entityId={createdProductId} images={[]} maxImages={6} />
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/partner/shops/${shopSlug}`)}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            {t("doneButton")} <FiChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <StepProgress current={step} labels={stepLabels} />

      {/* ── Step 0: Category ──────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t("step0Title")}</h2>
            <p className="text-sm text-gray-400 mt-1">{t("step0Subtitle")}</p>
          </div>

          {errors.category && (
            <p className="text-xs text-red-500">{errors.category}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRODUCT_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => set("category", c.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-colors ${
                  form.category === c.id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                <span className="text-xs font-medium leading-tight">{c.label.en}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 1: Details ───────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t("step1Title")}</h2>
            <p className="text-sm text-gray-400 mt-1">{t("step1Subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label={t("nameLabel")} error={errors.name} required>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={errors.name ? inputErrCls : inputCls}
                placeholder={t("namePlaceholder")}
              />
            </FieldGroup>

            <FieldGroup label={t("arabicNameLabel")}>
              <input
                value={form.arabicName}
                onChange={(e) => set("arabicName", e.target.value)}
                dir="rtl"
                className={inputCls}
                placeholder={t("arabicNamePlaceholder")}
              />
            </FieldGroup>

            <div className="sm:col-span-2">
              <FieldGroup label={t("descriptionLabel")} error={errors.description} required>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={4}
                  className={`${errors.description ? inputErrCls : inputCls} resize-none`}
                  placeholder={t("descriptionPlaceholder")}
                />
              </FieldGroup>
            </div>

            <div className="sm:col-span-2">
              <FieldGroup label={t("arabicDescriptionLabel")}>
                <textarea
                  value={form.arabicDescription}
                  onChange={(e) => set("arabicDescription", e.target.value)}
                  rows={3}
                  dir="rtl"
                  className={`${inputCls} resize-none`}
                />
              </FieldGroup>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Pricing & Stock ───────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t("step2Title")}</h2>
            <p className="text-sm text-gray-400 mt-1">{t("step2Subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label={t("priceLabel", { currency: PLATFORM_CURRENCY })} error={errors.price} required>
              <input
                type="number"
                min={1}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                className={errors.price ? inputErrCls : inputCls}
                placeholder="e.g. 45"
              />
            </FieldGroup>

            <FieldGroup label={t("comparePriceLabel", { currency: PLATFORM_CURRENCY })}>
              <input
                type="number"
                min={1}
                value={form.comparePrice}
                onChange={(e) => set("comparePrice", e.target.value)}
                placeholder={t("comparePricePlaceholder")}
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label={t("stockLabel")}>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                className={inputCls}
              />
              <p className="text-xs text-gray-400">{t("stockHint")}</p>
            </FieldGroup>
          </div>
        </div>
      )}

      {/* ── Step 3: Attributes ───────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t("step3Title")}</h2>
            <p className="text-sm text-gray-400 mt-1">{t("step3Subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label={t("materialLabel")}>
              <input
                value={form.material}
                onChange={(e) => set("material", e.target.value)}
                placeholder={t("materialPlaceholder")}
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label={t("originLabel")}>
              <input
                value={form.origin}
                onChange={(e) => set("origin", e.target.value)}
                placeholder={t("originPlaceholder")}
                className={inputCls}
              />
            </FieldGroup>

            <FieldGroup label={t("weightLabel")}>
              <input
                type="number"
                min={1}
                value={form.weight}
                onChange={(e) => set("weight", e.target.value)}
                placeholder={t("weightPlaceholder")}
                className={inputCls}
              />
            </FieldGroup>

            <div className="sm:col-span-2">
              <FieldGroup label={t("tagsLabel")}>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder={t("tagsPlaceholder")}
                  className={inputCls}
                />
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.tags.map((tag) => (
                      <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>
                          <FiX className="h-3 w-3 text-gray-400 hover:text-gray-700" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </FieldGroup>
            </div>

            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  { key: "isHandmade",  labelKey: "isHandmadeLabel",  hintKey: "isHandmadeHint"  },
                  { key: "isLocalOnly", labelKey: "isLocalOnlyLabel", hintKey: "isLocalOnlyHint" },
                  { key: "featured",    labelKey: "featuredLabel",    hintKey: "featuredHint"    },
                ] as const
              ).map(({ key, labelKey, hintKey }) => (
                <div key={key} className="flex items-start justify-between gap-4 p-3 border border-gray-200 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t(labelKey)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t(hintKey)}</p>
                  </div>
                  <Switch
                    checked={form[key]}
                    onCheckedChange={(v) => set(key, v)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Review summary before create */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("reviewSummaryLabel")}</p>
            {(
              [
                { label: t("reviewCategory"), value: PRODUCT_CATEGORIES.find((c) => c.id === form.category)?.label.en ?? "—" },
                { label: t("reviewName"),     value: form.name || "—" },
                { label: t("reviewPrice"),    value: form.price ? `${form.price} ${PLATFORM_CURRENCY}` : "—" },
                { label: t("reviewStock"),    value: form.stock ?? "0" },
              ] as { label: string; value: string }[]
            ).map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800 text-right">{value}</span>
              </div>
            ))}
            <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200">{t("reviewHint")}</p>
          </div>
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:border-gray-400 transition-colors"
          >
            <FiChevronLeft className="h-4 w-4" />
            {t("back")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t("cancelButton")}
          </button>
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-1.5 text-sm font-semibold bg-primary text-white rounded-xl px-5 py-2.5 hover:bg-primary/90 transition-colors"
          >
            {t("next")}
            <FiChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreate}
            disabled={pending}
            className="flex items-center gap-2 text-sm font-semibold bg-primary text-white rounded-xl px-6 py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {pending ? t("creating") : (
              <>
                {t("createButton")}
                <FiCheck className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
