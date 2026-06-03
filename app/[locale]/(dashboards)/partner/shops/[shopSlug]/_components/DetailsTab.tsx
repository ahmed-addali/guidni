"use client";

import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { PhoneInput } from "@/components/shared/PhoneInput";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ImageUploader, type UploadedImage } from "@/components/upload/ImageUploader";
import { updateShop } from "@/lib/actions/partner-shops";
import { SHOP_CATEGORIES } from "@/lib/utils/shop-categories";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShopDetails = {
  id:                string;
  name:              string;
  arabicName:        string | null;
  description:       string;
  arabicDescription: string | null;
  category:          string;
  phone:             string | null;
  country:           string;
  region:            string;
  city:              string | null;
  address:           string | null;
  location:          string | null;
  coverPhoto:        string | null;
  logo:              string | null;
  website:           string | null;
  instagram:         string | null;
  facebook:          string | null;
  deliveryMethods:   string[];
  deliveryFee:       number | null;
  freeShippingAbove: number | null;
  minOrderAmount:    number | null;
  isOpen:            boolean;
  destinationId:     string | null;
};

type Destination = { id: string; city: string; country: string; region?: string | null };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls    = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const inputErrCls = "w-full border border-red-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400";

function sectionHeading(label: string) {
  return (
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
      {label}
    </h3>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DetailsTab({
  shop,
  destinations = [],
}: {
  shop:         ShopDetails;
  destinations?: Destination[];
}) {
  const t = useTranslations("PartnerDashboard.editShop.details");
  const [pending, start]    = useTransition();
  const [errors,  setErrors] = useState<Record<string, string>>({});

  const buildSnapshot = () => ({
    name:              shop.name,
    arabicName:        shop.arabicName        ?? "",
    description:       shop.description,
    arabicDescription: shop.arabicDescription ?? "",
    category:          shop.category,
    phone:             shop.phone             ?? "",
    country:           shop.country,
    region:            shop.region,
    city:              shop.city              ?? "",
    address:           shop.address           ?? "",
    location:          shop.location          ?? "",
    coverPhoto:        shop.coverPhoto        ?? "",
    logo:              shop.logo              ?? "",
    website:           shop.website           ?? "",
    instagram:         shop.instagram         ?? "",
    facebook:          shop.facebook          ?? "",
    deliveryMethods:   [...shop.deliveryMethods] as ("PICKUP" | "DELIVERY")[],
    deliveryFee:       shop.deliveryFee       ?? 0,
    freeShippingAbove: shop.freeShippingAbove ?? null as number | null,
    minOrderAmount:    shop.minOrderAmount    ?? null as number | null,
    isOpen:            shop.isOpen,
    destinationId:     shop.destinationId     ?? "",
  });

  const [initial, setInitial] = useState(buildSnapshot);
  const [form,    setForm]    = useState(buildSnapshot);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial]
  );

  // ─── Image adapters (ImageUploader works with UploadedImage[]) ────────────
  const coverImages: UploadedImage[] = form.coverPhoto
    ? [{ id: "cover", url: form.coverPhoto }]
    : [];
  const logoImages: UploadedImage[] = form.logo
    ? [{ id: "logo", url: form.logo }]
    : [];

  // ─── Delivery toggle ──────────────────────────────────────────────────────
  const hasDelivery = form.deliveryMethods.includes("DELIVERY");

  function toggleDelivery(method: "PICKUP" | "DELIVERY") {
    setForm((p) => {
      const has     = p.deliveryMethods.includes(method);
      const updated = has
        ? p.deliveryMethods.filter((m) => m !== method)
        : [...p.deliveryMethods, method];
      return { ...p, deliveryMethods: updated };
    });
  }

  // ─── Validation ───────────────────────────────────────────────────────────
  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())                         e.name        = t("errors.nameRequired");
    if (form.description.trim().length < 20)       e.description = t("errors.descriptionRequired");
    if (!form.category)                            e.category    = t("errors.categoryRequired");
    if (form.deliveryMethods.length === 0)         e.delivery    = t("errors.deliveryRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ─── Save ─────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    start(async () => {
      const res = await updateShop(shop.id, {
        name:              form.name,
        arabicName:        form.arabicName        || undefined,
        description:       form.description,
        arabicDescription: form.arabicDescription || undefined,
        category:          form.category,
        phone:             form.phone             || undefined,
        country:           form.country,
        region:            form.region,
        city:              form.city              || undefined,
        address:           form.address           || undefined,
        location:          form.location          || undefined,
        coverPhoto:        form.coverPhoto        || undefined,
        logo:              form.logo              || undefined,
        website:           form.website           || undefined,
        instagram:         form.instagram         || undefined,
        facebook:          form.facebook          || undefined,
        deliveryMethods:   form.deliveryMethods,
        deliveryFee:       hasDelivery ? (form.deliveryFee || 0) : null,
        freeShippingAbove: form.freeShippingAbove || null,
        minOrderAmount:    form.minOrderAmount    || null,
        isOpen:            form.isOpen,
        destinationId:     form.destinationId     || null,
      });
      if (res.success) {
        toast.success(t("saveSuccess"));
        setInitial(form);
        setErrors({});
      } else {
        toast.error(res.error ?? t("saveError"));
      }
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Unsaved banner */}
      {isDirty && (
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
      )}

      {/* ── Basic info ─────────────────────────────────────────────────────── */}
      <div>
        {sectionHeading(t("sectionBasic"))}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("nameLabel")} *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t("namePlaceholder")}
              className={errors.name ? inputErrCls : inputCls}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("arabicNameLabel")}</label>
            <input
              value={form.arabicName}
              onChange={(e) => setForm((p) => ({ ...p, arabicName: e.target.value }))}
              placeholder={t("arabicNamePlaceholder")}
              dir="rtl"
              className={inputCls}
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("descriptionLabel")} *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder={t("descriptionPlaceholder")}
              rows={4}
              className={`${errors.description ? inputErrCls : inputCls} resize-none`}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("arabicDescriptionLabel")}</label>
            <textarea
              value={form.arabicDescription}
              onChange={(e) => setForm((p) => ({ ...p, arabicDescription: e.target.value }))}
              placeholder={t("arabicDescriptionPlaceholder")}
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
              <SelectTrigger className={errors.category ? "border-red-300" : ""}>
                <span className={form.category ? "text-gray-800" : "text-gray-400"}>
                  {SHOP_CATEGORIES.find((c) => c.id === form.category)
                    ? `${SHOP_CATEGORIES.find((c) => c.id === form.category)!.icon} ${SHOP_CATEGORIES.find((c) => c.id === form.category)!.label.en}`
                    : t("categoryPlaceholder")}
                </span>
              </SelectTrigger>
              <SelectContent>
                {SHOP_CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.label.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("phoneLabel")}</label>
            <PhoneInput
              value={form.phone}
              onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
            />
          </div>
        </div>
      </div>

      {/* ── Location ───────────────────────────────────────────────────────── */}
      <div>
        {sectionHeading(t("sectionLocation"))}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Destination selector */}
          {destinations.length > 0 && (
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("destinationLabel")}</label>
              <Select
                value={form.destinationId}
                onValueChange={(id) => {
                  const safeId = id ?? "";
                  const dest   = destinations.find((d) => d.id === safeId);
                  setForm((p) => ({
                    ...p,
                    destinationId: safeId,
                    country: dest?.country ?? p.country,
                    city:    dest?.city    ?? p.city,
                    region:  dest?.region  ?? p.region,
                  }));
                }}
              >
                <SelectTrigger>
                  {(() => {
                    const dest = destinations.find((d) => d.id === form.destinationId);
                    return (
                      <span className={dest ? "text-gray-800" : "text-gray-400"}>
                        {dest ? `${dest.city}, ${dest.country}` : t("destinationPlaceholder")}
                      </span>
                    );
                  })()}
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.city}, {d.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Location chips */}
              {form.destinationId && (
                <div className="flex flex-wrap items-center gap-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100 mt-2">
                  <span className="text-xs text-gray-400 font-medium w-full mb-0.5">
                    {t("locationDetails")}
                  </span>
                  {[
                    { label: t("countryLabel"), value: form.country },
                    { label: t("cityLabel"),    value: form.city    },
                  ]
                    .filter((f) => f.value)
                    .map((f) => (
                      <span
                        key={f.label}
                        className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700"
                      >
                        <span className="text-gray-400">{f.label}:</span> {f.value}
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Country / Region / City / Address — only shown when no destination linked */}
          {!form.destinationId && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("countryLabel")} *</label>
                <input
                  value={form.country}
                  onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                  required
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("cityLabel")}</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("regionLabel")}</label>
            <input
              value={form.region}
              onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}
              placeholder={t("regionPlaceholder")}
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("addressLabel")}</label>
            <input
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              placeholder={t("addressPlaceholder")}
              className={inputCls}
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("mapsLabel")}</label>
            <input
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              placeholder={t("mapsPlaceholder")}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ── Cover photo & Logo ─────────────────────────────────────────────── */}
      <div>
        {sectionHeading(t("sectionMedia"))}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t("coverPhotoLabel")}</label>
            <ImageUploader
              entity="shop"
              entityId={`${shop.id}-cover`}
              images={coverImages}
              maxImages={1}
              onChange={(imgs) =>
                setForm((p) => ({ ...p, coverPhoto: imgs[0]?.url ?? "" }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t("logoLabel")}</label>
            <ImageUploader
              entity="shop"
              entityId={`${shop.id}-logo`}
              images={logoImages}
              maxImages={1}
              onChange={(imgs) =>
                setForm((p) => ({ ...p, logo: imgs[0]?.url ?? "" }))
              }
            />
          </div>
        </div>
      </div>

      {/* ── Social & web ───────────────────────────────────────────────────── */}
      <div>
        {sectionHeading(t("sectionSocial"))}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("websiteLabel")}</label>
            <input
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              placeholder={t("websitePlaceholder")}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("instagramLabel")}</label>
            <input
              value={form.instagram}
              onChange={(e) => setForm((p) => ({ ...p, instagram: e.target.value }))}
              placeholder={t("instagramPlaceholder")}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("facebookLabel")}</label>
            <input
              value={form.facebook}
              onChange={(e) => setForm((p) => ({ ...p, facebook: e.target.value }))}
              placeholder={t("facebookPlaceholder")}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ── Delivery options ────────────────────────────────────────────────── */}
      <div>
        {sectionHeading(t("sectionDelivery"))}
        {errors.delivery && (
          <p className="text-xs text-red-500 mb-3">{errors.delivery}</p>
        )}
        <div className="space-y-3">
          {/* PICKUP */}
          <div className="flex items-start justify-between gap-4 p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-700">{t("pickupLabel")}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t("pickupHint")}</p>
            </div>
            <Switch
              checked={form.deliveryMethods.includes("PICKUP")}
              onCheckedChange={() => toggleDelivery("PICKUP")}
            />
          </div>

          {/* DELIVERY */}
          <div className="flex items-start justify-between gap-4 p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-700">{t("deliveryMethodLabel")}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t("deliveryMethodHint")}</p>
            </div>
            <Switch
              checked={hasDelivery}
              onCheckedChange={() => toggleDelivery("DELIVERY")}
            />
          </div>

          {/* Delivery fee — only when DELIVERY is enabled */}
          {hasDelivery && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("deliveryFeeLabel")}</label>
                <input
                  type="number"
                  min={0}
                  value={form.deliveryFee ?? 0}
                  onChange={(e) => setForm((p) => ({ ...p, deliveryFee: Number(e.target.value) }))}
                  className={inputCls}
                />
                <p className="text-xs text-gray-400">{t("deliveryFeeHint")}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("freeShippingLabel")}</label>
                <input
                  type="number"
                  min={1}
                  value={form.freeShippingAbove ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, freeShippingAbove: e.target.value ? Number(e.target.value) : null }))
                  }
                  placeholder="e.g. 150"
                  className={inputCls}
                />
                <p className="text-xs text-gray-400">{t("freeShippingHint")}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("minOrderLabel")}</label>
                <input
                  type="number"
                  min={1}
                  value={form.minOrderAmount ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, minOrderAmount: e.target.value ? Number(e.target.value) : null }))
                  }
                  placeholder="e.g. 30"
                  className={inputCls}
                />
                <p className="text-xs text-gray-400">{t("minOrderHint")}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Shop status ─────────────────────────────────────────────────────── */}
      <div>
        {sectionHeading(t("sectionStatus"))}
        <div className="flex items-start justify-between gap-4 p-4 border border-gray-200 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-700">{t("isOpenLabel")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t("isOpenHint")}</p>
          </div>
          <Switch
            checked={form.isOpen}
            onCheckedChange={(v) => setForm((p) => ({ ...p, isOpen: v }))}
          />
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending || !isDirty}
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? t("saving") : t("saveButton")}
        </button>
      </div>
    </form>
  );
}
