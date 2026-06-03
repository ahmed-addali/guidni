"use client";

import { useState, useMemo, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiFileText, FiTag, FiSliders, FiImage, FiX } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { updateProduct, reorderProductImages } from "@/lib/actions/partner-shops";
import { PRODUCT_CATEGORIES } from "@/lib/utils/shop-categories";
import { PLATFORM_CURRENCY } from "@/lib/utils/constants";
import { ToggleTabs, ToggleTabsList, ToggleTabsTrigger, ToggleTabsContent } from "@/components/ui/toggle-tabs";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductData = {
  id:                string;
  name:              string;
  arabicName:        string | null;
  description:       string;
  arabicDescription: string | null;
  price:             number;
  comparePrice:      number | null;
  category:          string;
  material:          string | null;
  origin:            string | null;
  weight:            number | null;
  stock:             number | null;
  isHandmade:        boolean;
  isLocalOnly:       boolean;
  featured:          boolean;
  tags:              string[];
  images:            { id: string; url: string }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

function UnsavedBanner({
  t,
  pending,
}: {
  t: (key: string) => string;
  pending: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
      <span className="font-medium">{t("unsavedChanges")}</span>
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {pending ? t("saving") : t("saveButton")}
      </button>
    </div>
  );
}

// ─── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({ product }: { product: ProductData }) {
  const t = useTranslations("PartnerDashboard.editProduct");
  const [pending, start] = useTransition();

  const initial = useMemo(() => ({
    name:              product.name,
    arabicName:        product.arabicName        ?? "",
    description:       product.description,
    arabicDescription: product.arabicDescription ?? "",
    category:          product.category,
  }), [product]);

  const [form, setForm]       = useState(initial);
  const [snap, setSnap]       = useState(initial);
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(snap), [form, snap]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updateProduct(product.id, {
        name:              form.name,
        arabicName:        form.arabicName        || undefined,
        description:       form.description,
        arabicDescription: form.arabicDescription || undefined,
        category:          form.category,
        price:             product.price,
        comparePrice:      product.comparePrice,
        stock:             product.stock,
        material:          product.material        || undefined,
        origin:            product.origin          || undefined,
        weight:            product.weight,
        isHandmade:        product.isHandmade,
        isLocalOnly:       product.isLocalOnly,
        featured:          product.featured,
        tags:              product.tags,
      });
      if (res.success) {
        toast.success(t("saveSuccess"));
        setSnap(form);
      } else {
        toast.error(res.error ?? t("saveFailed"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isDirty && <UnsavedBanner t={t as (k: string) => string} pending={pending} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("nameLabel")} *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("arabicNameLabel")}</label>
          <input
            value={form.arabicName}
            onChange={(e) => setForm((p) => ({ ...p, arabicName: e.target.value }))}
            dir="rtl"
            className={inputCls}
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("descriptionLabel")} *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            required
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </div>

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

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("categoryLabel")} *</label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((p) => ({ ...p, category: v ?? p.category }))}
          >
            <SelectTrigger>
              <span className={form.category ? "text-gray-800" : "text-gray-400"}>
                {(() => {
                  const cat = PRODUCT_CATEGORIES.find((c) => c.id === form.category);
                  return cat ? `${cat.icon} ${cat.label.en}` : t("categoryPlaceholder");
                })()}
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
      </div>

      {!isDirty && (
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={pending || !isDirty}
            className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {pending ? t("saving") : t("saveButton")}
          </button>
        </div>
      )}
    </form>
  );
}

// ─── Pricing Tab ──────────────────────────────────────────────────────────────

function PricingTab({ product }: { product: ProductData }) {
  const t = useTranslations("PartnerDashboard.editProduct");
  const [pending, start] = useTransition();

  const initial = useMemo(() => ({
    price:        String(product.price),
    comparePrice: product.comparePrice ? String(product.comparePrice) : "",
    stock:        product.stock !== null ? String(product.stock) : "",
  }), [product]);

  const [form, setForm] = useState(initial);
  const [snap, setSnap] = useState(initial);
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(snap), [form, snap]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updateProduct(product.id, {
        name:              product.name,
        arabicName:        product.arabicName        || undefined,
        description:       product.description,
        arabicDescription: product.arabicDescription || undefined,
        category:          product.category,
        price:             Number(form.price),
        comparePrice:      form.comparePrice ? Number(form.comparePrice) : null,
        stock:             form.stock !== "" ? Number(form.stock) : null,
        material:          product.material   || undefined,
        origin:            product.origin     || undefined,
        weight:            product.weight,
        isHandmade:        product.isHandmade,
        isLocalOnly:       product.isLocalOnly,
        featured:          product.featured,
        tags:              product.tags,
      });
      if (res.success) {
        toast.success(t("saveSuccess"));
        setSnap(form);
      } else {
        toast.error(res.error ?? t("saveFailed"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isDirty && <UnsavedBanner t={t as (k: string) => string} pending={pending} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            {t("priceLabel", { currency: PLATFORM_CURRENCY })} *
          </label>
          <input
            type="number"
            min={1}
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            required
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            {t("comparePriceLabel", { currency: PLATFORM_CURRENCY })}
          </label>
          <input
            type="number"
            min={1}
            value={form.comparePrice}
            onChange={(e) => setForm((p) => ({ ...p, comparePrice: e.target.value }))}
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("stockLabel")}</label>
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
            className={inputCls}
          />
          <p className="text-xs text-gray-400">{t("stockHint")}</p>
        </div>
      </div>

      {!isDirty && (
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={pending || !isDirty}
            className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {pending ? t("saving") : t("saveButton")}
          </button>
        </div>
      )}
    </form>
  );
}

// ─── Attributes Tab ───────────────────────────────────────────────────────────

function AttributesTab({ product }: { product: ProductData }) {
  const t = useTranslations("PartnerDashboard.editProduct");
  const [pending, start] = useTransition();
  const [tagInput, setTagInput] = useState("");

  const initial = useMemo(() => ({
    material:   product.material   ?? "",
    origin:     product.origin     ?? "",
    weight:     product.weight     ? String(product.weight) : "",
    isHandmade: product.isHandmade,
    isLocalOnly: product.isLocalOnly,
    featured:   product.featured,
    tags:       product.tags,
  }), [product]);

  const [form, setForm] = useState(initial);
  const [snap, setSnap] = useState(initial);
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(snap), [form, snap]);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updateProduct(product.id, {
        name:              product.name,
        arabicName:        product.arabicName        || undefined,
        description:       product.description,
        arabicDescription: product.arabicDescription || undefined,
        category:          product.category,
        price:             product.price,
        comparePrice:      product.comparePrice,
        stock:             product.stock,
        material:          form.material  || undefined,
        origin:            form.origin    || undefined,
        weight:            form.weight    ? Number(form.weight) : null,
        isHandmade:        form.isHandmade,
        isLocalOnly:       form.isLocalOnly,
        featured:          form.featured,
        tags:              form.tags,
      });
      if (res.success) {
        toast.success(t("saveSuccess"));
        setSnap(form);
      } else {
        toast.error(res.error ?? t("saveFailed"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isDirty && <UnsavedBanner t={t as (k: string) => string} pending={pending} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("materialLabel")}</label>
          <input
            value={form.material}
            onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))}
            placeholder={t("materialPlaceholder")}
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("originLabel")}</label>
          <input
            value={form.origin}
            onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))}
            placeholder={t("originPlaceholder")}
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("weightLabel")}</label>
          <input
            type="number"
            min={1}
            value={form.weight}
            onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
            className={inputCls}
          />
        </div>

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
                  <button type="button" onClick={() => removeTag(tag)}>
                    <FiX className="h-3 w-3 text-gray-400 hover:text-gray-700" />
                  </button>
                </span>
              ))}
            </div>
          )}
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
                checked={form[key] as boolean}
                onCheckedChange={(v) => setForm((p) => ({ ...p, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </div>

      {!isDirty && (
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={pending || !isDirty}
            className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {pending ? t("saving") : t("saveButton")}
          </button>
        </div>
      )}
    </form>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function EditProductForm({
  product,
}: {
  product:  ProductData;
  shopSlug: string;
  locale:   string;
}) {
  const t = useTranslations("PartnerDashboard.editProduct");
  const [images, setImages] = useState(product.images);

  return (
    <ToggleTabs defaultValue="details">
      <ToggleTabsList className="flex-wrap mb-6">
        <ToggleTabsTrigger value="details">
          <FiFileText />
          {t("tabs.details")}
        </ToggleTabsTrigger>

        <ToggleTabsTrigger value="pricing">
          <FiTag />
          {t("tabs.pricing")}
        </ToggleTabsTrigger>

        <ToggleTabsTrigger value="attributes">
          <FiSliders />
          {t("tabs.attributes")}
        </ToggleTabsTrigger>

        <ToggleTabsTrigger value="images">
          <FiImage />
          {t("tabs.images", { count: images.length })}
          {images.length > 0 && (
            <span className="ml-0.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium data-active:bg-gray-200">
              {images.length}
            </span>
          )}
        </ToggleTabsTrigger>
      </ToggleTabsList>

      <ToggleTabsContent value="details" keepMounted>
        <DetailsTab product={product} />
      </ToggleTabsContent>

      <ToggleTabsContent value="pricing" keepMounted>
        <PricingTab product={product} />
      </ToggleTabsContent>

      <ToggleTabsContent value="attributes">
        <AttributesTab product={product} />
      </ToggleTabsContent>

      <ToggleTabsContent value="images">
        <div className="space-y-2">
          <p className="text-xs text-gray-400">{t("imagesHint")}</p>
          <ImageUploader
            key={images[0]?.id ?? "empty"}
            entity="product"
            entityId={product.id}
            images={images}
            maxImages={6}
            onChange={setImages}
            onReorder={(orderedIds) => reorderProductImages(product.id, orderedIds)}
          />
        </div>
      </ToggleTabsContent>
    </ToggleTabs>
  );
}
