"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { FiCheck, FiChevronLeft, FiChevronRight, FiMapPin } from "react-icons/fi";
import { createActivity } from "@/lib/actions/partner";

const STEPS = ["Category", "Details", "Location", "Pricing", "Review"] as const;
type Step = 0 | 1 | 2 | 3 | 4;

const CATEGORIES = [
  "Water Sports", "Desert", "Culture & History", "Food & Drink",
  "Adventure", "Wellness & Spa", "Nature & Wildlife", "Night Life", "Other",
];

type Destination = { id: string; label: string; city: string; country: string; region: string };

type FormData = {
  category:        string;
  title:           string;
  description:     string;
  phone:           string;
  duration:        string;
  availableTimes:  string;
  price:           number;
  capacity:        number;
  cancelation:     boolean;
  paynow:          boolean;
  country:         string;
  region:          string;
  city:            string;
  address:         string;
  destinationId:   string;
};

const DEFAULTS: FormData = {
  category:       "",
  title:          "",
  description:    "",
  phone:          "",
  duration:       "",
  availableTimes: "",
  price:          0,
  capacity:       1,
  cancelation:    true,
  paynow:         false,
  country:        "",
  region:         "",
  city:           "",
  address:        "",
  destinationId:  "",
};

function StepProgress({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
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
  const router   = useRouter();
  const params   = useParams();
  const locale   = params.locale as string;
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormData>({
    ...DEFAULTS,
    country: profileCountry ?? "",
    region:  profileRegion  ?? "",
    phone:   profilePhone   ?? "",
  });
  const [errors, setErrors]  = useState<Partial<Record<keyof FormData, string>>>({});
  const [pending, start]     = useTransition();

  const set = (key: keyof FormData, value: string | number | boolean) =>
    setForm((p) => ({ ...p, [key]: value }));

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 0 && !form.category)                e.category        = "Select a category";
    if (step === 1) {
      if (!form.title.trim())                        e.title           = "Title is required";
      if (form.title.trim().length < 3)              e.title           = "At least 3 characters";
      if (!form.description.trim())                  e.description     = "Description is required";
      if (form.description.trim().length < 20)       e.description     = "At least 20 characters";
    }
    if (step === 2) {
      if (!form.destinationId)                       e.destinationId   = "Select a destination";
      if (!form.country.trim())                      e.country         = "Country is required";
      if (!form.region.trim())                       e.region          = "Region is required";
    }
    if (step === 3) {
      if (!form.price || form.price <= 0)            e.price           = "Price must be positive";
      if (!form.capacity || form.capacity < 1)       e.capacity        = "Capacity must be at least 1";
      if (!form.availableTimes.trim())               e.availableTimes  = "Add at least one time slot";
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

  function handleSubmit() {
    start(async () => {
      const res = await createActivity({
        ...form,
        destinationId: form.destinationId || undefined,
      });
      if (res.success) {
        toast.success("Activity created!");
        router.push(`/${locale}/partner/activities`);
      } else {
        toast.error(res.error ?? "Failed to create activity");
      }
    });
  }

  const selectedDestLabel = destinations.find((d) => d.id === form.destinationId)?.label ?? "";

  return (
    <div className="max-w-2xl mx-auto">
      <StepProgress current={step} />

      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-6">

        {/* Step 0 — Category */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Choose a category</h2>
              <p className="text-sm text-gray-400 mt-1">Select the type that best describes your activity.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => set("category", cat)}
                  className={`text-sm px-4 py-3 rounded-xl border font-medium text-left transition-all ${
                    form.category === cat
                      ? "bg-primary/10 text-primary border-primary/30 ring-2 ring-primary/20"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {form.category === cat && <FiCheck className="h-3.5 w-3.5 inline mr-1.5 mb-0.5" />}
                  {cat}
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
              <h2 className="text-lg font-bold text-gray-900">Activity details</h2>
              <p className="text-sm text-gray-400 mt-1">Give travelers the information they need to book.</p>
            </div>
            <FieldGroup label="Title *" error={errors.title}>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Sunrise Camel Trek in the Sahara"
                className={inputCls}
              />
            </FieldGroup>
            <FieldGroup label="Description *" error={errors.description}>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={5}
                placeholder="Describe the experience, what's included, meeting point..."
                className={`${inputCls} resize-none`}
              />
            </FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Duration" error={errors.duration}>
                <input
                  value={form.duration}
                  onChange={(e) => set("duration", e.target.value)}
                  placeholder="e.g. 3 hours"
                  className={inputCls}
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
            </div>
          </div>
        )}

        {/* Step 2 — Location */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Location</h2>
              <p className="text-sm text-gray-400 mt-1">Where does this activity take place?</p>
            </div>

            {/* Destination selector */}
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
                      ...(dest ? { country: dest.country, city: dest.city, region: dest.region } : {}),
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
              <p className="text-xs text-gray-400 mt-1">
                This determines where your activity appears in listings.
              </p>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Country *" error={errors.country}>
                <input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} />
              </FieldGroup>
              <FieldGroup label="Region *" error={errors.region}>
                <input value={form.region} onChange={(e) => set("region", e.target.value)} className={inputCls} />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="City">
                <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
              </FieldGroup>
              <FieldGroup label="Address">
                <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
              </FieldGroup>
            </div>
          </div>
        )}

        {/* Step 3 — Pricing */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pricing & availability</h2>
              <p className="text-sm text-gray-400 mt-1">Set your price and available time slots.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Price per person (TND) *" error={errors.price}>
                <input
                  type="number" min={0}
                  value={form.price}
                  onChange={(e) => set("price", parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
              </FieldGroup>
              <FieldGroup label="Max capacity *" error={errors.capacity}>
                <input
                  type="number" min={1}
                  value={form.capacity}
                  onChange={(e) => set("capacity", parseInt(e.target.value) || 1)}
                  className={inputCls}
                />
              </FieldGroup>
            </div>
            <FieldGroup label="Available times * (comma-separated, e.g. 08:00,10:00,14:00)" error={errors.availableTimes}>
              <input
                value={form.availableTimes}
                onChange={(e) => set("availableTimes", e.target.value)}
                placeholder="08:00,10:00,14:00"
                className={inputCls}
              />
            </FieldGroup>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.cancelation}
                  onChange={(e) => set("cancelation", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                />
                <span className="text-sm font-medium text-gray-700">Free cancellation</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.paynow}
                  onChange={(e) => set("paynow", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                />
                <span className="text-sm font-medium text-gray-700">Require payment upfront</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Review & publish</h2>
              <p className="text-sm text-gray-400 mt-1">Check everything before creating your activity.</p>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
              {[
                ["Destination",    selectedDestLabel || "—"],
                ["Category",       form.category],
                ["Title",          form.title],
                ["Description",    form.description.slice(0, 100) + (form.description.length > 100 ? "…" : "")],
                ["Duration",       form.duration || "—"],
                ["Country",        form.country],
                ["Region",         form.region],
                ["City",           form.city || "—"],
                ["Price",          `${form.price} TND/person`],
                ["Capacity",       `${form.capacity} people`],
                ["Available times",form.availableTimes],
                ["Cancellation",   form.cancelation ? "Free" : "Non-refundable"],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 px-4 py-3">
                  <span className="text-xs font-semibold text-gray-500 w-32 shrink-0">{label}</span>
                  <span className="text-sm text-gray-800 break-words">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              You can add photos after creating the activity from the edit page.
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
              {pending ? "Creating…" : "Create activity"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
