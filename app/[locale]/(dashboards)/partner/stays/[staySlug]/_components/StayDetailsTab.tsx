"use client";

import { useState, useTransition, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiAlertTriangle } from "react-icons/fi";
import { updateStay } from "@/lib/actions/partner";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/shared/PhoneInput";
import { CounterInput } from "@/components/shared/CounterInput";
import { TimePickerInput } from "@/components/shared/TimePickerInput";
import {
  PROPERTY_TYPES,
  SPACE_CATEGORIES,
  AMENITY_KEYS,
  AMENITY_ICONS,
} from "@/lib/utils/stay-constants";

type Destination = { id: string; label: string; city: string; country: string; region: string };

type Stay = {
  id: string;
  title: string;
  arabicTitle: string | null;
  description: string;
  arabicDescription: string | null;
  propertyType: string;
  category: string;
  price: number;
  cleaningFee: number | null;
  guestCount: number;
  bedroomCount: number;
  bedCount: number;
  bathroomCount: number;
  country: string;
  region: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  checkInTime: string;
  checkOutTime: string;
  minStayNights: number;
  hasWifi: boolean;
  hasPool: boolean;
  hasParking: boolean;
  hasKitchen: boolean;
  hasAirConditioning: boolean;
  isPetFriendly: boolean;
  hasHeating: boolean;
  hasGarden: boolean;
  hasBalcony: boolean;
  hasSecurity: boolean;
  hasConcierge: boolean;
  isSmokeFree: boolean;
  wheelchairAccessible: boolean;
  elevatorAvailable: boolean;
  destinationId: string | null;
};


const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const inputErrCls = "w-full border border-red-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400";

export function StayDetailsTab({
  stay,
  destinations,
}: {
  stay: Stay;
  destinations: Destination[];
}) {
  const t = useTranslations("PartnerDashboard.editStay.details");
  const [pending, start] = useTransition();
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const buildSnapshot = () => ({
    title:              stay.title,
    arabicTitle:        stay.arabicTitle        ?? "",
    description:        stay.description,
    arabicDescription:  stay.arabicDescription  ?? "",
    propertyType:       stay.propertyType,
    category:           stay.category,
    price:              stay.price,
    cleaningFee:        stay.cleaningFee ?? 0,
    guestCount:         stay.guestCount,
    bedroomCount:       stay.bedroomCount,
    bedCount:           stay.bedCount,
    bathroomCount:      stay.bathroomCount,
    country:            stay.country,
    region:             stay.region,
    city:               stay.city               ?? "",
    address:            stay.address            ?? "",
    phone:              stay.phone              ?? "",
    checkInTime:        stay.checkInTime,
    checkOutTime:       stay.checkOutTime,
    minStayNights:      stay.minStayNights,
    hasWifi:              stay.hasWifi,
    hasPool:              stay.hasPool,
    hasParking:           stay.hasParking,
    hasKitchen:           stay.hasKitchen,
    hasAirConditioning:   stay.hasAirConditioning,
    isPetFriendly:        stay.isPetFriendly,
    hasHeating:           stay.hasHeating,
    hasGarden:            stay.hasGarden,
    hasBalcony:           stay.hasBalcony,
    hasSecurity:          stay.hasSecurity,
    hasConcierge:         stay.hasConcierge,
    isSmokeFree:          stay.isSmokeFree,
    wheelchairAccessible: stay.wheelchairAccessible,
    elevatorAvailable:    stay.elevatorAvailable,
    destinationId:        stay.destinationId      ?? "",
  });

  const [initial, setInitial] = useState(buildSnapshot);
  const [form,    setForm]    = useState(initial);

  const [showArabic, setShowArabic] = useState(
    Boolean(stay.arabicTitle || stay.arabicDescription)
  );

  const isDirty = useMemo(() => (
    form.title             !== initial.title             ||
    form.arabicTitle       !== initial.arabicTitle       ||
    form.description       !== initial.description       ||
    form.arabicDescription !== initial.arabicDescription ||
    form.propertyType      !== initial.propertyType      ||
    form.category          !== initial.category          ||
    form.price             !== initial.price             ||
    form.cleaningFee       !== initial.cleaningFee       ||
    form.guestCount        !== initial.guestCount        ||
    form.bedroomCount      !== initial.bedroomCount      ||
    form.bedCount          !== initial.bedCount          ||
    form.bathroomCount     !== initial.bathroomCount     ||
    form.country           !== initial.country           ||
    form.region            !== initial.region            ||
    form.city              !== initial.city              ||
    form.address           !== initial.address           ||
    form.phone             !== initial.phone             ||
    form.checkInTime       !== initial.checkInTime       ||
    form.checkOutTime      !== initial.checkOutTime      ||
    form.minStayNights     !== initial.minStayNights     ||
    form.hasWifi              !== initial.hasWifi              ||
    form.hasPool              !== initial.hasPool              ||
    form.hasParking           !== initial.hasParking           ||
    form.hasKitchen           !== initial.hasKitchen           ||
    form.hasAirConditioning   !== initial.hasAirConditioning   ||
    form.isPetFriendly        !== initial.isPetFriendly        ||
    form.hasHeating           !== initial.hasHeating           ||
    form.hasGarden            !== initial.hasGarden            ||
    form.hasBalcony           !== initial.hasBalcony           ||
    form.hasSecurity          !== initial.hasSecurity          ||
    form.hasConcierge         !== initial.hasConcierge         ||
    form.isSmokeFree          !== initial.isSmokeFree          ||
    form.wheelchairAccessible !== initial.wheelchairAccessible ||
    form.elevatorAvailable    !== initial.elevatorAvailable    ||
    form.destinationId        !== initial.destinationId
  ), [form, initial]);

  const set  = (key: string, value: string | number) => setForm((p) => ({ ...p, [key]: value }));
  const setB = (key: string, value: boolean)          => setForm((p) => ({ ...p, [key]: value }));
  const clearErr = (key: string) => setErrors((p) => { const next = { ...p }; delete next[key]; return next; });

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.title.trim())                  errs.title       = t("titleRequired");
    else if (form.title.trim().length < 3)   errs.title       = t("titleMin");
    if (!form.description.trim())            errs.description = t("descriptionRequired");
    else if (form.description.trim().length < 20) errs.description = t("descriptionMin");
    if (!form.country.trim())                errs.country     = t("countryLabel");
    if (!form.region.trim())                 errs.region      = t("regionLabel");
    if (!form.price || form.price <= 0)      errs.price       = t("priceRequired");
    if (!form.guestCount || form.guestCount < 1) errs.guestCount = t("guestCountMin");
    setErrors(errs);

    if (!form.phone.trim()) {
      setPhoneError(t("phoneRequired"));
      return false;
    }
    setPhoneError(undefined);

    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    doSave();
  }

  function doSave() {
    if (!validate()) return;
    start(async () => {
      const res = await updateStay(stay.id, {
        ...form,
        arabicTitle:       form.arabicTitle       || undefined,
        arabicDescription: form.arabicDescription || undefined,
        destinationId:     form.destinationId     || null,
      });
      if (res.success) {
        toast.success(t("updateSuccess"));
        setInitial(form);
      } else {
        toast.error(res.error ?? t("updateFailed"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Unsaved banner */}
      {isDirty && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <FiAlertTriangle className="h-4 w-4 shrink-0" />
            {t("unsavedBanner")}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="text-xs font-semibold text-amber-700 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors disabled:opacity-50 shrink-0"
          >
            {pending ? t("saving") : t("saveNow")}
          </button>
        </div>
      )}

      {/* ── Basics ───────────────────────────────────── */}
      <section className="space-y-5">
        <p className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">
          {t("sectionBasics")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Title */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("titleLabel")}</label>
            <input
              value={form.title}
              onChange={(e) => { set("title", e.target.value); clearErr("title"); }}
              className={errors.title ? inputErrCls : inputCls}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">{t("descriptionLabel")}</label>
              <span className="text-xs text-gray-400">{form.description.length} / 3000</span>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => { set("description", e.target.value); clearErr("description"); }}
              rows={5}
              maxLength={3000}
              className={`${errors.description ? inputErrCls : inputCls} resize-none`}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Arabic translation toggle */}
          <div
            className="sm:col-span-2 flex items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
            onClick={() => setShowArabic((v) => !v)}
          >
            <div>
              <p className="text-sm font-medium text-gray-700">{t("arabicToggleLabel")}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t("arabicToggleHint")}</p>
            </div>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
            <span onClick={(e) => e.stopPropagation()}>
              <Switch checked={showArabic} onCheckedChange={setShowArabic} />
            </span>
          </div>

          {showArabic && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("arabicTitleLabel")}</label>
                <p className="text-xs text-gray-400">{t("arabicTitleHint")}</p>
                <input
                  value={form.arabicTitle}
                  onChange={(e) => set("arabicTitle", e.target.value)}
                  placeholder={t("arabicTitlePlaceholder")}
                  dir="rtl"
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("arabicDescriptionLabel")}</label>
                <p className="text-xs text-gray-400">{t("arabicTitleHint")}</p>
                <textarea
                  value={form.arabicDescription}
                  onChange={(e) => set("arabicDescription", e.target.value)}
                  rows={4}
                  placeholder={t("arabicDescriptionPlaceholder")}
                  dir="rtl"
                  className={`${inputCls} resize-none`}
                />
              </div>
            </>
          )}

          {/* Property type + Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("propertyTypeLabel")}</label>
            <Select value={form.propertyType} onValueChange={(v) => set("propertyType", v ?? form.propertyType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((pt) => (
                  <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("categoryLabel")}</label>
            <Select value={form.category} onValueChange={(v) => set("category", v ?? form.category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPACE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ── Capacity + Pricing ────────────────────────── */}
      <section className="space-y-5">
        <p className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">
          {t("sectionPolicies")}
        </p>

        {/* Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("priceLabel")}</label>
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => { set("price", parseInt(e.target.value) || 0); clearErr("price"); }}
              className={errors.price ? inputErrCls : inputCls}
            />
            {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("cleaningFeeLabel")}</label>
            <input
              type="number"
              min={0}
              value={form.cleaningFee ?? 0}
              onChange={(e) => set("cleaningFee", parseInt(e.target.value) || 0)}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("checkInLabel")}</label>
              <div className={`${inputCls} flex items-center`}>
                <TimePickerInput
                  value={form.checkInTime}
                  onChange={(v) => set("checkInTime", v)}
                  placeholder="00:00"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("checkOutLabel")}</label>
              <div className={`${inputCls} flex items-center`}>
                <TimePickerInput
                  value={form.checkOutTime}
                  onChange={(v) => set("checkOutTime", v)}
                  placeholder="00:00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { key: "guestCount",    label: t("guestCountLabel"),    min: 1, max: 30,  err: errors.guestCount },
            { key: "bedroomCount",  label: t("bedroomCountLabel"),  min: 1, max: 20 },
            { key: "bedCount",      label: t("bedCountLabel"),      min: 1, max: 30 },
            { key: "bathroomCount", label: t("bathroomCountLabel"), min: 1, max: 15 },
            { key: "minStayNights", label: t("minStayLabel"),       min: 1, max: 365 },
          ].map(({ key, label, min, max, err }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <CounterInput
                value={form[key as keyof typeof form] as number}
                onChange={(v) => { set(key, v); if (err) clearErr(key); }}
                min={min}
                max={max}
              />
              {err && <p className="text-xs text-red-500">{err}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Location ─────────────────────────────────── */}
      <section className="space-y-5">
        <p className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">
          {t("sectionLocation")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Destination */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("destinationLabel")}</label>
            <p className="text-xs text-gray-400">{t("destinationHint")}</p>
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
              }}
            >
              <SelectTrigger>
                <span className={form.destinationId ? "text-gray-800" : "text-gray-400"}>
                  {destinations.find((d) => d.id === form.destinationId)?.label ?? t("destinationPlaceholder")}
                </span>
              </SelectTrigger>
              <SelectContent>
                {destinations.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {form.destinationId && (
              <div className="flex flex-wrap items-center gap-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100 mt-2">
                <span className="text-xs text-gray-400 font-medium w-full mb-0.5">{t("locationDetails")}</span>
                {[
                  { label: t("countryLabel"), value: form.country },
                  { label: t("regionLabel"),  value: form.region  },
                  { label: t("cityLabel"),    value: form.city     },
                ].filter((f) => f.value).map((f) => (
                  <span key={f.label} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700">
                    <span className="text-gray-400">{f.label}:</span> {f.value}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!form.destinationId && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("countryLabel")}</label>
                <input
                  value={form.country}
                  onChange={(e) => { set("country", e.target.value); clearErr("country"); }}
                  className={errors.country ? inputErrCls : inputCls}
                />
                {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("regionLabel")}</label>
                <input
                  value={form.region}
                  onChange={(e) => { set("region", e.target.value); clearErr("region"); }}
                  className={errors.region ? inputErrCls : inputCls}
                />
                {errors.region && <p className="text-xs text-red-500">{errors.region}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t("cityLabel")}</label>
                <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t("addressLabel")}</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t("phoneLabel")}</label>
            <PhoneInput
              value={form.phone}
              onChange={(v) => { set("phone", v); if (v.trim()) setPhoneError(undefined); }}
              error={phoneError}
            />
          </div>
        </div>
      </section>

      {/* ── Amenities ────────────────────────────────── */}
      <section className="space-y-4">
        <p className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">
          {t("sectionAmenities")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMENITY_KEYS.map((key) => {
            const Icon = AMENITY_ICONS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setB(key, !form[key])}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border font-medium text-sm transition-colors text-left ${
                  form[key]
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                {t(`amenities.${key}`)}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending || !isDirty}
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? t("saving") : t("saveChanges")}
        </button>
      </div>
    </form>
  );
}
