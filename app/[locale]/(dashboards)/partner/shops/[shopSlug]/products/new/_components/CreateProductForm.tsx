"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiCheck, FiX, FiArrowRight } from "react-icons/fi";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls    = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const inputErrCls = "w-full border border-red-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400";

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateProductForm({
  shopId,
  shopSlug,
  locale,
}: {
  shopId:   string;
  shopSlug: string;
  locale:   string;
}) {
  const t      = useTranslations("PartnerDashboard.newProduct");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tagInput, setTagInput]           = useState("");
  const [createdProductId, setCreatedId]  = useState<string | null>(null);
  const [errors, setErrors]               = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name:              "",
    arabicName:        "",
    description:       "",
    arabicDescription: "",
    price:             "",
    comparePrice:      "",
    category:          PRODUCT_CATEGORIES[0].id,
    material:          "",
    origin:            "",
    weight:            "",
    stock:             "0",
    isHandmade:        false,
    isLocalOnly:       false,
    featured:          false,
    tags:              [] as string[],
  });

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (!form.tags.includes(tag)) setForm((p) => ({ ...p, tags: [...p.tags, tag] }));
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())                   e.name        = t("errors.nameRequired");
    if (form.description.trim().length < 20) e.description = t("errors.descriptionRequired");
    if (!form.price || Number(form.price) <= 0) e.price    = t("errors.priceRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
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
      } else {
        toast.error(res.error ?? t("createFailed"));
      }
    });
  }

  function handleDone() {
    router.push(`/${locale}/partner/shops/${shopSlug}?tab=products`);
  }

  // ── Phase 2: Image upload ──────────────────────────────────────────────────
  if (createdProductId) {
    return (
      <div className="space-y-5">
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

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleDone}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            {t("doneButton")} <FiArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Phase 1: Product details form ─────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("nameLabel")} *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className={errors.name ? inputErrCls : inputCls}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        {/* Arabic name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("arabicNameLabel")}</label>
          <input
            value={form.arabicName}
            onChange={(e) => setForm((p) => ({ ...p, arabicName: e.target.value }))}
            dir="rtl"
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("descriptionLabel")} *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={4}
            className={`${errors.description ? inputErrCls : inputCls} resize-none`}
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
        </div>

        {/* Arabic description */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("arabicDescriptionLabel")}</label>
          <textarea
            value={form.arabicDescription}
            onChange={(e) => setForm((p) => ({ ...p, arabicDescription: e.target.value }))}
            rows={3}
            dir="rtl"
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("categoryLabel")} *</label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((p) => ({ ...p, category: v ?? p.category }))}
          >
            <SelectTrigger>
              <span className={form.category ? "text-gray-800" : "text-gray-400"}>
                {PRODUCT_CATEGORIES.find((c) => c.id === form.category)
                  ? `${PRODUCT_CATEGORIES.find((c) => c.id === form.category)!.icon} ${PRODUCT_CATEGORIES.find((c) => c.id === form.category)!.label.en}`
                  : t("categoryPlaceholder")}
              </span>
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icon} {c.label.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            {t("priceLabel", { currency: PLATFORM_CURRENCY })} *
          </label>
          <input
            type="number" min={1}
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            className={errors.price ? inputErrCls : inputCls}
          />
          {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
        </div>

        {/* Compare price */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            {t("comparePriceLabel", { currency: PLATFORM_CURRENCY })}
          </label>
          <input
            type="number" min={1}
            value={form.comparePrice}
            onChange={(e) => setForm((p) => ({ ...p, comparePrice: e.target.value }))}
            placeholder={t("comparePricePlaceholder")}
            className={inputCls}
          />
        </div>

        {/* Stock */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("stockLabel")} *</label>
          <input
            type="number" min={0}
            value={form.stock}
            onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
            className={inputCls}
          />
        </div>

        {/* Material */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("materialLabel")}</label>
          <input
            value={form.material}
            onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))}
            placeholder={t("materialPlaceholder")}
            className={inputCls}
          />
        </div>

        {/* Origin */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("originLabel")}</label>
          <input
            value={form.origin}
            onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))}
            placeholder={t("originPlaceholder")}
            className={inputCls}
          />
        </div>

        {/* Weight */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("weightLabel")}</label>
          <input
            type="number" min={1}
            value={form.weight}
            onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
            placeholder={t("weightPlaceholder")}
            className={inputCls}
          />
        </div>

        {/* Tags */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("tagsLabel")}</label>
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
                  <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-gray-700">
                    <FiX className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Toggles */}
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
                <p className="text-sm font-medium text-gray-700">
                  {t(labelKey as Parameters<typeof t>[0])}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t(hintKey as Parameters<typeof t>[0])}
                </p>
              </div>
              <Switch
                checked={form[key] as boolean}
                onCheckedChange={(v) => setForm((p) => ({ ...p, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:border-gray-400 transition-colors"
        >
          {t("cancelButton")}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? t("creating") : <>{t("createButton")} <FiArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </form>
  );
}
