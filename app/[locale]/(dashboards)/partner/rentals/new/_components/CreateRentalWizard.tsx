"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { FiCheck, FiChevronLeft, FiChevronRight, FiMapPin } from "react-icons/fi";
import { createRental } from "@/lib/actions/partner-rentals";

const STEPS = ["Type", "Details", "Specs", "Location", "Pricing", "Review"] as const;
type Step = 0 | 1 | 2 | 3 | 4 | 5;

type RentalTypeValue = "CAR" | "BIKE" | "SCOOTER" | "BOAT" | "OTHER";
type Destination = { id: string; label: string; city: string; country: string; region: string };

const RENTAL_TYPES: { value: RentalTypeValue; label: string; desc: string }[] = [
  { value: "CAR",     label: "Car",     desc: "Sedans, SUVs, 4x4s" },
  { value: "BIKE",    label: "Bike",    desc: "Bicycles and e-bikes" },
  { value: "SCOOTER", label: "Scooter", desc: "Mopeds and scooters" },
  { value: "BOAT",    label: "Boat",    desc: "Sea and river boats" },
  { value: "OTHER",   label: "Other",   desc: "Any other vehicle" },
];

const TRANSMISSIONS = ["Automatic", "Manual"];
const FUEL_TYPES    = ["Petrol", "Diesel", "Electric", "Hybrid"];

type FormData = {
  type:            RentalTypeValue;
  title:           string;
  description:     string;
  brand:           string;
  model:           string;
  year:            string;
  color:           string;
  transmission:    string;
  fuelType:        string;
  capacity:        number;
  hasAC:           boolean;
  hasGPS:          boolean;
  hasInsurance:    boolean;
  requiresLicense: boolean;
  country:         string;
  region:          string;
  city:            string;
  address:         string;
  phone:           string;
  destinationId:   string;
  pricePerDay:     number;
  pricePerHour:    number;
  minDays:         number;
};

const DEFAULTS: FormData = {
  type:            "CAR",
  title:           "",
  description:     "",
  brand:           "",
  model:           "",
  year:            "",
  color:           "",
  transmission:    "",
  fuelType:        "",
  capacity:        4,
  hasAC:           false,
  hasGPS:          false,
  hasInsurance:    false,
  requiresLicense: true,
  country:         "",
  region:          "",
  city:            "",
  address:         "",
  phone:           "",
  destinationId:   "",
  pricePerDay:     0,
  pricePerHour:    0,
  minDays:         1,
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
                ${done ? "bg-primary text-white" : active ? "bg-primary text-white ring-4 ring-primary/20" : "bg-gray-100 text-gray-400"}`}>
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

const inputCls  = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const selectCls = `${inputCls} bg-white`;

export function CreateRentalWizard({
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

  const [step, setStep]   = useState<Step>(0);
  const [form, setForm]   = useState<FormData>({
    ...DEFAULTS,
    country: profileCountry ?? "",
    region:  profileRegion  ?? "",
    phone:   profilePhone   ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [pending, start]    = useTransition();

  const set  = (key: keyof FormData, value: string | number | boolean) =>
    setForm((p) => ({ ...p, [key]: value }));

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 0 && !form.type)                    e.type         = "Select a type";
    if (step === 1) {
      if (!form.title.trim())                        e.title        = "Title is required";
      if (form.title.length < 3)                     e.title        = "At least 3 characters";
      if (!form.description.trim())                  e.description  = "Description is required";
      if (form.description.length < 20)              e.description  = "At least 20 characters";
    }
    if (step === 3) {
      if (!form.destinationId)                       e.destinationId = "Select a destination";
      if (!form.country.trim())                      e.country      = "Country is required";
      if (!form.region.trim())                       e.region       = "Region is required";
    }
    if (step === 4) {
      if (!form.pricePerDay || form.pricePerDay <= 0) e.pricePerDay = "Price must be positive";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() { if (validate()) setStep((s) => (s + 1) as Step); }
  function handleBack() { setStep((s) => (s - 1) as Step); }

  const selectedDestLabel = destinations.find((d) => d.id === form.destinationId)?.label ?? "";

  function handleSubmit() {
    start(async () => {
      const res = await createRental({
        type:            form.type,
        title:           form.title,
        description:     form.description,
        brand:           form.brand || undefined,
        model:           form.model || undefined,
        year:            form.year ? parseInt(form.year) : undefined,
        color:           form.color || undefined,
        transmission:    form.transmission || undefined,
        fuelType:        form.fuelType || undefined,
        capacity:        form.capacity,
        hasAC:           form.hasAC,
        hasGPS:          form.hasGPS,
        hasInsurance:    form.hasInsurance,
        requiresLicense: form.requiresLicense,
        country:         form.country,
        region:          form.region,
        city:            form.city || undefined,
        address:         form.address || undefined,
        phone:           form.phone || undefined,
        destinationId:   form.destinationId || undefined,
        pricePerDay:     form.pricePerDay,
        pricePerHour:    form.pricePerHour || undefined,
        minDays:         form.minDays,
      });
      if (res.success) {
        toast.success("Rental created!");
        router.push(`/${locale}/partner/rentals`);
      } else {
        toast.error(res.error ?? "Failed to create rental");
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepProgress current={step} />

      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-6">

        {/* Step 0 — Type */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">What type of vehicle?</h2>
              <p className="text-sm text-gray-400 mt-1">Select the category that best fits your listing.</p>
            </div>
            <div className="space-y-3">
              {RENTAL_TYPES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("type", value)}
                  className={`w-full text-left px-5 py-4 rounded-xl border font-medium transition-all ${
                    form.type === value
                      ? "bg-primary/10 text-primary border-primary/30 ring-2 ring-primary/20"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {form.type === value && <FiCheck className="h-4 w-4 shrink-0" />}
                    <div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {errors.type && <p className="text-xs text-red-500">{errors.type}</p>}
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
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Toyota Corolla 2022 — Automatic" className={inputCls} />
              {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Description *</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4}
                placeholder="Describe the vehicle condition, any restrictions, pickup instructions..." className={`${inputCls} resize-none`} />
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            </div>
          </div>
        )}

        {/* Step 2 — Specs */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Vehicle specs</h2>
              <p className="text-sm text-gray-400 mt-1">Technical details guests will want to know.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Brand</label>
                <input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Toyota" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Model</label>
                <input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. Corolla" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Year</label>
                <input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="e.g. 2022" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Color</label>
                <input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="e.g. White" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Seats</label>
                <input type="number" min={1} value={form.capacity} onChange={(e) => set("capacity", parseInt(e.target.value) || 1)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Transmission</label>
                <select value={form.transmission} onChange={(e) => set("transmission", e.target.value)} className={selectCls}>
                  <option value="">Select…</option>
                  {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium text-gray-700">Fuel type</label>
                <select value={form.fuelType} onChange={(e) => set("fuelType", e.target.value)} className={selectCls}>
                  <option value="">Select…</option>
                  {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <p className="text-sm font-medium text-gray-700">Features</p>
              <div className="flex flex-wrap gap-3">
                {([
                  ["hasAC",           "Air conditioning"],
                  ["hasGPS",          "GPS navigation"],
                  ["hasInsurance",    "Insurance included"],
                  ["requiresLicense", "License required"],
                ] as [keyof FormData, string][]).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => set(key, !form[key])}
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
            </div>
          </div>
        )}

        {/* Step 3 — Location */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Location</h2>
              <p className="text-sm text-gray-400 mt-1">Where is the vehicle available for pickup?</p>
            </div>
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
              <p className="text-xs text-gray-400">This determines where your rental appears in listings.</p>
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
              <label className="text-sm font-medium text-gray-700">Pickup address</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
            </div>
          </div>
        )}

        {/* Step 4 — Pricing */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pricing</h2>
              <p className="text-sm text-gray-400 mt-1">Set your rental rates.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Price per day (TND) *</label>
                <input type="number" min={0} value={form.pricePerDay} onChange={(e) => set("pricePerDay", parseInt(e.target.value) || 0)} className={inputCls} />
                {errors.pricePerDay && <p className="text-xs text-red-500">{errors.pricePerDay}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Price per hour (TND)</label>
                <input type="number" min={0} value={form.pricePerHour} onChange={(e) => set("pricePerHour", parseInt(e.target.value) || 0)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Minimum rental (days)</label>
                <input type="number" min={1} value={form.minDays} onChange={(e) => set("minDays", parseInt(e.target.value) || 1)} className={inputCls} />
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
                ["Type",        RENTAL_TYPES.find((t) => t.value === form.type)?.label ?? form.type],
                ["Title",       form.title],
                ["Description", form.description.slice(0, 100) + (form.description.length > 100 ? "…" : "")],
                ["Vehicle",     [form.brand, form.model, form.year].filter(Boolean).join(" ") || "—"],
                ["Seats",       `${form.capacity}`],
                ["Country",     form.country],
                ["Region",      form.region],
                ["Price/day",   `${form.pricePerDay} TND`],
                ["Min stay",    `${form.minDays} day${form.minDays > 1 ? "s" : ""}`],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex gap-4 px-4 py-3">
                  <span className="text-xs font-semibold text-gray-500 w-28 shrink-0">{label}</span>
                  <span className="text-sm text-gray-800 break-words">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              You can add photos after creating the rental from the edit page.
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
              {pending ? "Creating…" : "Create rental"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
