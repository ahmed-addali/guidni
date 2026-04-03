"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { FiCheck, FiChevronLeft, FiChevronRight, FiMapPin } from "react-icons/fi";
import { createStay } from "@/lib/actions/partner";

const STEPS = ["Type", "Details", "Location", "Amenities", "Pricing", "Review"] as const;
type Step = 0 | 1 | 2 | 3 | 4 | 5;

type Destination = { id: string; label: string; city: string; country: string; region: string };

const PROPERTY_TYPES = ["Apartment", "Villa", "House", "Riad", "Bungalow", "Hotel Room", "Other"];
const CATEGORIES     = ["Entire place", "Private room", "Shared room"];

type FormData = {
  propertyType:       string;
  category:           string;
  title:              string;
  description:        string;
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
  hasWifi:            boolean;
  hasPool:            boolean;
  hasParking:         boolean;
  hasKitchen:         boolean;
  hasAirConditioning: boolean;
  isPetFriendly:      boolean;
  destinationId:      string;
};

const DEFAULTS: FormData = {
  propertyType:       PROPERTY_TYPES[0],
  category:           CATEGORIES[0],
  title:              "",
  description:        "",
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
  hasWifi:            false,
  hasPool:            false,
  hasParking:         false,
  hasKitchen:         false,
  hasAirConditioning: false,
  isPetFriendly:      false,
  destinationId:      "",
};

function StepProgress({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
      {STEPS.map((label, i) => {
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
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 min-w-[16px] ${done ? "bg-primary" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const selectCls = `${inputCls} bg-white`;

const AMENITIES: { key: keyof FormData; label: string }[] = [
  { key: "hasWifi",            label: "WiFi" },
  { key: "hasPool",            label: "Pool" },
  { key: "hasParking",         label: "Parking" },
  { key: "hasKitchen",         label: "Kitchen" },
  { key: "hasAirConditioning", label: "Air conditioning" },
  { key: "isPetFriendly",      label: "Pet friendly" },
];

export function CreateStayWizard({ profileCountry, profileRegion, profilePhone, destinations }: {
  profileCountry?: string;
  profileRegion?:  string;
  profilePhone?:   string;
  destinations:    Destination[];
}) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [step, setStep]   = useState<Step>(0);
  const [form, setForm]   = useState<FormData>({
    ...DEFAULTS,
    country: profileCountry ?? "",
    region:  profileRegion  ?? "",
    phone:   profilePhone   ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [pending, start]    = useTransition();

  const set  = (key: keyof FormData, value: string | number) => setForm((p) => ({ ...p, [key]: value }));
  const setB = (key: keyof FormData, value: boolean)          => setForm((p) => ({ ...p, [key]: value }));

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 0) {
      if (!form.propertyType) e.propertyType = "Select a type";
      if (!form.category)     e.category     = "Select a category";
    }
    if (step === 1) {
      if (!form.title.trim())              e.title       = "Title is required";
      if (form.title.length < 3)           e.title       = "At least 3 characters";
      if (!form.description.trim())        e.description = "Description is required";
      if (form.description.length < 20)    e.description = "At least 20 characters";
    }
    if (step === 2) {
      if (!form.destinationId)             e.destinationId = "Select a destination";
      if (!form.country.trim())            e.country       = "Country is required";
      if (!form.region.trim())             e.region        = "Region is required";
    }
    if (step === 4) {
      if (!form.price || form.price <= 0)  e.price       = "Price must be positive";
      if (form.guestCount < 1)             e.guestCount  = "At least 1 guest";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() { if (validate()) setStep((s) => (s + 1) as Step); }
  function handleBack() { setStep((s) => (s - 1) as Step); }

  const selectedDestLabel = destinations.find((d) => d.id === form.destinationId)?.label ?? "";

  function handleSubmit() {
    start(async () => {
      const res = await createStay({
        ...form,
        destinationId: form.destinationId || undefined,
      });
      if (res.success) {
        toast.success("Stay created!");
        router.push(`/${locale}/partner/stays`);
      } else {
        toast.error(res.error ?? "Failed to create stay");
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepProgress current={step} />

      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-6">

        {/* Step 0 — Type */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">What type of property?</h2>
              <p className="text-sm text-gray-400 mt-1">Choose the property type that best matches your listing.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Property type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PROPERTY_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => set("propertyType", t)}
                    className={`text-sm px-4 py-3 rounded-xl border font-medium text-left transition-all ${
                      form.propertyType === t
                        ? "bg-primary/10 text-primary border-primary/30 ring-2 ring-primary/20"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}>
                    {form.propertyType === t && <FiCheck className="h-3.5 w-3.5 inline mr-1.5 mb-0.5" />}
                    {t}
                  </button>
                ))}
              </div>
              {errors.propertyType && <p className="text-xs text-red-500">{errors.propertyType}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Space category *</label>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" onClick={() => set("category", c)}
                    className={`text-sm px-4 py-2.5 rounded-xl border font-medium transition-all ${
                      form.category === c
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Listing details</h2>
              <p className="text-sm text-gray-400 mt-1">Help guests understand what you're offering.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Title *</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Charming riad with sea view" className={inputCls} />
              {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Description *</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5}
                placeholder="Describe your space, unique features, nearby attractions..." className={`${inputCls} resize-none`} />
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {([ ["guestCount","Max guests"], ["bedroomCount","Bedrooms"], ["bedCount","Beds"], ["bathroomCount","Bathrooms"] ] as [keyof FormData, string][]).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <input type="number" min={1} value={form[key] as number} onChange={(e) => set(key, parseInt(e.target.value) || 1)} className={inputCls} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Location */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Location</h2>
              <p className="text-sm text-gray-400 mt-1">Where is your property located?</p>
            </div>

            {/* Destination selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Destination *</label>
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
                  className={`${selectCls} pl-9`}
                >
                  <option value="">Select a destination…</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-400">This determines where your stay appears in listings.</p>
              {errors.destinationId && <p className="text-xs text-red-500">{errors.destinationId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Country *</label>
                <input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} />
                {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Region *</label>
                <input value={form.region} onChange={(e) => set("region", e.target.value)} className={inputCls} />
                {errors.region && <p className="text-xs text-red-500">{errors.region}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">City</label>
                <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+216..." className={inputCls} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
            </div>
          </div>
        )}

        {/* Step 3 — Amenities */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Amenities</h2>
              <p className="text-sm text-gray-400 mt-1">What does your property offer?</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {AMENITIES.map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setB(key, !(form[key] as boolean))}
                  className={`text-sm px-4 py-2.5 rounded-xl border font-medium transition-all ${
                    form[key]
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}>
                  {form[key] && <FiCheck className="h-3.5 w-3.5 inline mr-1.5 mb-0.5" />}
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Check-in time</label>
                <input type="time" value={form.checkInTime} onChange={(e) => set("checkInTime", e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Check-out time</label>
                <input type="time" value={form.checkOutTime} onChange={(e) => set("checkOutTime", e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Min stay (nights)</label>
                <input type="number" min={1} value={form.minStayNights} onChange={(e) => set("minStayNights", parseInt(e.target.value) || 1)} className={inputCls} />
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Pricing */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pricing</h2>
              <p className="text-sm text-gray-400 mt-1">Set your nightly rate.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Price per night (TND) *</label>
                <input type="number" min={0} value={form.price} onChange={(e) => set("price", parseInt(e.target.value) || 0)} className={inputCls} />
                {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Max guests *</label>
                <input type="number" min={1} value={form.guestCount} onChange={(e) => set("guestCount", parseInt(e.target.value) || 1)} className={inputCls} />
                {errors.guestCount && <p className="text-xs text-red-500">{errors.guestCount}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 5 — Review */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Review & publish</h2>
              <p className="text-sm text-gray-400 mt-1">Check your listing before creating it.</p>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
              {([
                ["Destination", selectedDestLabel || "—"],
                ["Type",       `${form.propertyType} · ${form.category}`],
                ["Title",      form.title],
                ["Description",form.description.slice(0, 100) + (form.description.length > 100 ? "…" : "")],
                ["Guests",     `${form.guestCount} max`],
                ["Bedrooms",   `${form.bedroomCount} rooms · ${form.bedCount} beds · ${form.bathroomCount} bathrooms`],
                ["Country",    form.country],
                ["Region",     form.region],
                ["Price",      `${form.price} TND/night`],
                ["Min stay",   `${form.minStayNights} night${form.minStayNights > 1 ? "s" : ""}`],
                ["Check-in",   `${form.checkInTime} · out ${form.checkOutTime}`],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex gap-4 px-4 py-3">
                  <span className="text-xs font-semibold text-gray-500 w-28 shrink-0">{label}</span>
                  <span className="text-sm text-gray-800 break-words">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              You can add photos after creating the stay from the edit page.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className={`flex pt-2 ${step === 0 ? "justify-end" : "justify-between"}`}>
          {step > 0 && (
            <button type="button" onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:border-gray-400 transition-colors">
              <FiChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          {step < 5 ? (
            <button type="button" onClick={handleNext}
              className="flex items-center gap-1.5 text-sm bg-primary text-white rounded-xl px-5 py-2 hover:bg-primary/90 transition-colors font-medium">
              Next <FiChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" disabled={pending} onClick={handleSubmit}
              className="flex items-center gap-2 text-sm bg-primary text-white rounded-xl px-6 py-2 hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
              <FiCheck className="h-4 w-4" />
              {pending ? "Creating…" : "Create stay"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
