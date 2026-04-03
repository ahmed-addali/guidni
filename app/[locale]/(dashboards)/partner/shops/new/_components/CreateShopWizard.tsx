"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { FiCheck, FiChevronLeft, FiChevronRight, FiMapPin } from "react-icons/fi";
import { createShop } from "@/lib/actions/partner-shops";
import { SHOP_CATEGORIES } from "@/lib/utils/shop-categories";
import type { DeliveryMethod } from "@prisma/client";

const STEPS = ["Category", "Details", "Location", "Delivery", "Review"] as const;
type Step = 0 | 1 | 2 | 3 | 4;

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string; desc: string }[] = [
  { value: "PICKUP",         label: "In-store pickup",        desc: "Customer collects from your shop" },
  { value: "LOCAL_DELIVERY", label: "Local delivery",         desc: "Deliver within your city" },
  { value: "NATIONWIDE",     label: "Nationwide shipping",    desc: "Domestic shipping across the country" },
  { value: "INTERNATIONAL",  label: "International shipping", desc: "Shipping anywhere in the world" },
];

type Destination = { id: string; label: string; city: string; country: string; region: string };

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
  freeShippingAbove: string;
  minOrderAmount:    string;
};

const DEFAULTS: FormData = {
  category:          "",
  name:              "",
  arabicName:        "",
  description:       "",
  arabicDescription: "",
  phone:             "",
  website:           "",
  instagram:         "",
  facebook:          "",
  destinationId:     "",
  country:           "",
  region:            "",
  city:              "",
  address:           "",
  location:          "",
  deliveryMethods:   ["PICKUP"],
  freeShippingAbove: "",
  minOrderAmount:    "",
};

function StepProgress({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
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
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 ${done ? "bg-primary" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

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
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [step, setStep]      = useState<Step>(0);
  const [form, setForm]      = useState<FormData>({
    ...DEFAULTS,
    country: profileCountry ?? "",
    region:  profileRegion  ?? "",
    phone:   profilePhone   ?? "",
  });
  const [errors, setErrors]  = useState<Partial<Record<keyof FormData, string>>>({});
  const [pending, start]     = useTransition();

  const set = (key: keyof FormData, value: string | string[] | boolean) =>
    setForm((p) => ({ ...p, [key]: value }));

  function toggleDelivery(method: DeliveryMethod) {
    setForm((p) => {
      const has = p.deliveryMethods.includes(method);
      const updated = has ? p.deliveryMethods.filter((m) => m !== method) : [...p.deliveryMethods, method];
      return { ...p, deliveryMethods: updated };
    });
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 0 && !form.category)                 e.category    = "Select a category";
    if (step === 1) {
      if (!form.name.trim())                           e.name        = "Name is required";
      if (form.name.trim().length < 2)                 e.name        = "At least 2 characters";
      if (!form.description.trim())                    e.description = "Description is required";
      if (form.description.trim().length < 20)         e.description = "At least 20 characters";
    }
    if (step === 2) {
      if (!form.destinationId)                         e.destinationId = "Select a destination";
      if (!form.country.trim())                        e.country     = "Country is required";
      if (!form.region.trim())                         e.region      = "Region is required";
    }
    if (step === 3 && form.deliveryMethods.length === 0) e.deliveryMethods = "Select at least one delivery method";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (validate()) setStep((s) => (s + 1) as Step);
  }

  function handleBack() {
    setStep((s) => (s - 1) as Step);
  }

  const selectedDestLabel = destinations.find((d) => d.id === form.destinationId)?.label ?? "";
  const selectedCatLabel  = SHOP_CATEGORIES.find((c) => c.id === form.category)?.label.en ?? "";

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
        freeShippingAbove: form.freeShippingAbove ? Number(form.freeShippingAbove) : null,
        minOrderAmount:    form.minOrderAmount    ? Number(form.minOrderAmount)    : null,
        destinationId:     form.destinationId     || undefined,
        isOpen:            true,
        featuredInHome:    false,
      });
      if (res.success) {
        toast.success("Shop created!");
        router.push(`/${locale}/partner/shops`);
      } else {
        toast.error(res.error ?? "Failed to create shop");
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepProgress current={step} />

      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-6">

        {/* Step 0 — Category */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Shop category</h2>
              <p className="text-sm text-gray-400 mt-1">What does your shop primarily sell?</p>
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

        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Shop details</h2>
              <p className="text-sm text-gray-400 mt-1">Tell customers about your shop.</p>
            </div>
            <FieldGroup label="Shop name *" error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Artisanat Djerba"
                className={inputCls}
              />
            </FieldGroup>
            <FieldGroup label="Arabic name">
              <input
                value={form.arabicName}
                onChange={(e) => set("arabicName", e.target.value)}
                dir="rtl"
                placeholder="الاسم بالعربية"
                className={inputCls}
              />
            </FieldGroup>
            <FieldGroup label="Description *" error={errors.description}>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                placeholder="Describe your shop, what makes it unique, and what customers can expect..."
                className={`${inputCls} resize-none`}
              />
            </FieldGroup>
            <FieldGroup label="Arabic description">
              <textarea
                value={form.arabicDescription}
                onChange={(e) => set("arabicDescription", e.target.value)}
                rows={3}
                dir="rtl"
                placeholder="الوصف بالعربية"
                className={`${inputCls} resize-none`}
              />
            </FieldGroup>
            <FieldGroup label="Phone">
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+216..."
                className={inputCls}
              />
            </FieldGroup>
            <div className="pt-1 space-y-3">
              <label className="block text-sm font-medium text-gray-700">Social & web links (optional)</label>
              <input value={form.website}   onChange={(e) => set("website", e.target.value)}   placeholder="Website"   className={inputCls} />
              <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="Instagram" className={inputCls} />
              <input value={form.facebook}  onChange={(e) => set("facebook", e.target.value)}  placeholder="Facebook"  className={inputCls} />
            </div>
          </div>
        )}

        {/* Step 2 — Location */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Location</h2>
              <p className="text-sm text-gray-400 mt-1">Where is your shop located?</p>
            </div>

            <FieldGroup label="Destination *" error={errors.destinationId}>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <select
                  value={form.destinationId}
                  onChange={(e) => {
                    const dest = destinations.find((d) => d.id === e.target.value);
                    setForm((p) => ({
                      ...p,
                      destinationId: e.target.value,
                      ...(dest ? { country: dest.country, region: dest.region || p.region, city: dest.city } : {}),
                    }));
                  }}
                  className={`${inputCls} pl-9 appearance-none bg-white`}
                >
                  <option value="">Select a destination…</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Country *" error={errors.country}>
                <input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} />
              </FieldGroup>
              <FieldGroup label="Region *" error={errors.region}>
                <input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="e.g. Medenine" className={inputCls} />
              </FieldGroup>
            </div>
            <FieldGroup label="City">
              <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Houmt Souk" className={inputCls} />
            </FieldGroup>
            <FieldGroup label="Address">
              <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street address" className={inputCls} />
            </FieldGroup>
            <FieldGroup label="Google Maps link">
              <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="https://maps.google.com/..." className={inputCls} />
            </FieldGroup>
          </div>
        )}

        {/* Step 3 — Delivery */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Delivery options</h2>
              <p className="text-sm text-gray-400 mt-1">How will customers receive their orders?</p>
            </div>
            <div className="space-y-2">
              {DELIVERY_OPTIONS.map(({ value, label, desc }) => (
                <label key={value} className="flex items-start gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.deliveryMethods.includes(value)}
                    onChange={() => toggleDelivery(value)}
                    className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary/30"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.deliveryMethods && <p className="text-xs text-red-500">{errors.deliveryMethods}</p>}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Free shipping above (TND)</label>
                <input
                  type="number"
                  min={1}
                  value={form.freeShippingAbove}
                  onChange={(e) => set("freeShippingAbove", e.target.value)}
                  placeholder="e.g. 150"
                  className={inputCls}
                />
                <p className="text-xs text-gray-400">Optional.</p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Minimum order (TND)</label>
                <input
                  type="number"
                  min={1}
                  value={form.minOrderAmount}
                  onChange={(e) => set("minOrderAmount", e.target.value)}
                  placeholder="e.g. 30"
                  className={inputCls}
                />
                <p className="text-xs text-gray-400">Optional.</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Review & publish</h2>
              <p className="text-sm text-gray-400 mt-1">Check everything before creating your shop.</p>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
              {[
                ["Category",       selectedCatLabel || "—"],
                ["Destination",    selectedDestLabel || "—"],
                ["Name",           form.name],
                ["Description",    form.description.slice(0, 100) + (form.description.length > 100 ? "…" : "")],
                ["Country",        form.country],
                ["Region",         form.region],
                ["City",           form.city || "—"],
                ["Delivery",       form.deliveryMethods.join(", ") || "—"],
                ["Free shipping",  form.freeShippingAbove ? `Above TND ${form.freeShippingAbove}` : "—"],
                ["Min order",      form.minOrderAmount    ? `TND ${form.minOrderAmount}`           : "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 px-4 py-3">
                  <span className="text-xs font-semibold text-gray-500 w-28 shrink-0">{label}</span>
                  <span className="text-sm text-gray-800 break-words">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              You can add photos and products from the edit page after creating your shop.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className={`flex pt-2 ${step === 0 ? "justify-end" : "justify-between"}`}>
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:border-gray-400 transition-colors"
            >
              <FiChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 text-sm bg-primary text-white rounded-xl px-5 py-2 hover:bg-primary/90 transition-colors font-medium"
            >
              Next <FiChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={handleSubmit}
              className="flex items-center gap-2 text-sm bg-primary text-white rounded-xl px-6 py-2 hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              <FiCheck className="h-4 w-4" />
              {pending ? "Creating…" : "Create shop"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
