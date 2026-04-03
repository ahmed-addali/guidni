"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { TbRoute } from "react-icons/tb";
import { createTransfer } from "@/lib/actions/partner-transfers";

const STEPS = ["Type", "Details", "Coverage", "Specs", "Pricing", "Review"] as const;
type Step = 0 | 1 | 2 | 3 | 4 | 5;
type TransferTypeValue = "AIRPORT_TRANSFER" | "TAXI" | "CHAUFFEUR" | "SHUTTLE";
type Destination = { id: string; city: string; country: string; region: string };

const TRANSFER_TYPES: { value: TransferTypeValue; label: string; desc: string }[] = [
  { value: "AIRPORT_TRANSFER", label: "Airport Transfer", desc: "Point-to-point airport rides, flat rate per trip" },
  { value: "TAXI",             label: "City Taxi",        desc: "On-demand city taxi service, flat rate per trip" },
  { value: "CHAUFFEUR",        label: "Private Chauffeur",desc: "Private driver hired by the hour or full day" },
  { value: "SHUTTLE",          label: "Shuttle",          desc: "Group shared transport, per trip or per person" },
];

type FormData = {
  type:           TransferTypeValue;
  title:          string;
  arabicTitle:    string;
  description:    string;
  languages:      string;
  vehicleType:    string;
  brand:          string;
  model:          string;
  year:           string;
  capacity:       number;
  isAC:           boolean;
  isMeetGreet:    boolean;
  isChildSeat:    boolean;
  phone:          string;
  country:        string;
  region:         string;
  city:           string;
  address:        string;
  destinationId:  string;
  pricePerTrip:   string;
  pricePerHour:   string;
  pricePerPerson: string;
};

const DEFAULTS: FormData = {
  type: "AIRPORT_TRANSFER", title: "", arabicTitle: "", description: "",
  languages: "", vehicleType: "", brand: "", model: "", year: "",
  capacity: 4, isAC: true, isMeetGreet: false, isChildSeat: false, phone: "",
  country: "", region: "", city: "", address: "", destinationId: "",
  pricePerTrip: "", pricePerHour: "", pricePerPerson: "",
};

export function CreateTransferWizard({ destinations }: { destinations: Destination[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormData>(DEFAULTS);
  const [pending, start] = useTransition();

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function handleDestination(id: string) {
    set("destinationId", id);
    const dest = destinations.find((d) => d.id === id);
    if (dest) { set("country", dest.country); set("region", dest.region); set("city", dest.city); }
  }

  function handleSubmit() {
    start(async () => {
      const res = await createTransfer({
        ...form,
        year:           form.year ? Number(form.year) : null,
        pricePerTrip:   form.pricePerTrip   ? Number(form.pricePerTrip)   : null,
        pricePerHour:   form.pricePerHour   ? Number(form.pricePerHour)   : null,
        pricePerPerson: form.pricePerPerson ? Number(form.pricePerPerson) : null,
        destinationId:  form.destinationId || null,
        featuredInHome: false,
      });
      if (res.success) {
        toast.success("Transfer created!");
        router.push("../transfers");
      } else {
        toast.error(res.error);
      }
    });
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";
  const sectionCls = "bg-white border border-gray-100 rounded-2xl p-6 space-y-5";

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border ${
              i < step ? "bg-primary border-primary text-white" :
              i === step ? "border-primary text-primary" :
              "border-gray-200 text-gray-400"
            }`}>
              {i < step ? <FiCheck className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? "text-gray-900 font-medium" : "text-gray-400"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="h-px w-4 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 0 — Type */}
      {step === 0 && (
        <div className={sectionCls}>
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">What type of service do you offer?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRANSFER_TYPES.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => set("type", value)}
                className={`text-left p-4 rounded-xl border-2 transition-colors ${
                  form.type === value
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className={`font-semibold text-sm ${form.type === value ? "text-primary" : "text-gray-900"}`}>{label}</p>
                <p className="text-xs text-gray-500 mt-1">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1 — Details */}
      {step === 1 && (
        <div className={sectionCls}>
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Service details</h2>
          <div>
            <label className={labelCls}>Service name *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)}
              placeholder='e.g. "Djerba Airport Transfer"' className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Arabic name (optional)</label>
            <input value={form.arabicTitle} onChange={(e) => set("arabicTitle", e.target.value)}
              dir="rtl" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={4} placeholder="Describe your service, pickup process, what's included..."
              className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Languages spoken (optional)</label>
            <input value={form.languages} onChange={(e) => set("languages", e.target.value)}
              placeholder="e.g. Arabic, French, English" className={inputCls} />
          </div>
        </div>
      )}

      {/* Step 2 — Coverage / Location */}
      {step === 2 && (
        <div className={sectionCls}>
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Coverage area</h2>
          {destinations.length > 0 && (
            <div>
              <label className={labelCls}>Destination</label>
              <select value={form.destinationId} onChange={(e) => handleDestination(e.target.value)} className={inputCls}>
                <option value="">Select destination</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>{d.city}, {d.country}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Country *</label>
              <input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Region *</label>
              <input value={form.region} onChange={(e) => set("region", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>City (optional)</label>
            <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Address (optional)</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Contact phone (optional)</label>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
          </div>
        </div>
      )}

      {/* Step 3 — Specs */}
      {step === 3 && (
        <div className={sectionCls}>
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Vehicle specs</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Vehicle type (optional)</label>
              <input value={form.vehicleType} onChange={(e) => set("vehicleType", e.target.value)}
                placeholder="e.g. Sedan, SUV, Van" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Capacity (passengers) *</label>
              <input type="number" min={1} value={form.capacity}
                onChange={(e) => set("capacity", Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Brand (optional)</label>
              <input value={form.brand} onChange={(e) => set("brand", e.target.value)}
                placeholder="e.g. Mercedes" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Model (optional)</label>
              <input value={form.model} onChange={(e) => set("model", e.target.value)}
                placeholder="e.g. E-Class" className={inputCls} />
            </div>
          </div>
          <div className="space-y-3 pt-1">
            {[
              { key: "isAC"        as const, label: "Air conditioning included" },
              { key: "isMeetGreet" as const, label: "Meet & Greet service" },
              { key: "isChildSeat" as const, label: "Child seat available" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 4 — Pricing */}
      {step === 4 && (
        <div className={sectionCls}>
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Pricing</h2>
          {(form.type === "AIRPORT_TRANSFER" || form.type === "TAXI") && (
            <div>
              <label className={labelCls}>Price per trip (TND) *</label>
              <input type="number" min={1} value={form.pricePerTrip}
                onChange={(e) => set("pricePerTrip", e.target.value)} className={inputCls} />
            </div>
          )}
          {form.type === "CHAUFFEUR" && (
            <div>
              <label className={labelCls}>Price per hour (TND) *</label>
              <input type="number" min={1} value={form.pricePerHour}
                onChange={(e) => set("pricePerHour", e.target.value)} className={inputCls} />
            </div>
          )}
          {form.type === "SHUTTLE" && (
            <>
              <div>
                <label className={labelCls}>Price per trip (TND)</label>
                <input type="number" min={1} value={form.pricePerTrip}
                  onChange={(e) => set("pricePerTrip", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Price per person (TND) — if per-head pricing preferred</label>
                <input type="number" min={1} value={form.pricePerPerson}
                  onChange={(e) => set("pricePerPerson", e.target.value)} className={inputCls} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 5 — Review */}
      {step === 5 && (
        <div className={sectionCls}>
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Review your listing</h2>
          <dl className="space-y-3 text-sm">
            {(
              [
                ["Type",     TRANSFER_TYPES.find((t) => t.value === form.type)?.label ?? "—"],
                ["Title",    form.title],
                ["Location", [form.city, form.country].filter(Boolean).join(", ")],
                ["Capacity", `${form.capacity} passengers`],
                ["Features", [form.isAC && "AC", form.isMeetGreet && "Meet & Greet", form.isChildSeat && "Child seat"].filter(Boolean).join(", ") || "—"],
                form.pricePerTrip   ? ["Price / trip",   `${form.pricePerTrip} TND`]   : null,
                form.pricePerHour   ? ["Price / hour",   `${form.pricePerHour} TND`]   : null,
                form.pricePerPerson ? ["Price / person", `${form.pricePerPerson} TND`] : null,
              ] as ([string, string] | null)[]
            ).filter((x): x is [string, string] => x !== null).map(([k, v]) => (
              <div key={k} className="flex gap-4">
                <dt className="text-gray-500 w-28 shrink-0">{k}</dt>
                <dd className="text-gray-900 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center gap-2 pt-2">
            <TbRoute className="h-5 w-5 text-primary" />
            <p className="text-sm text-gray-500">Your listing will be live after publishing.</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep((s) => (s - 1) as Step)}
          disabled={step === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-gray-400 disabled:opacity-40 transition-colors"
        >
          <FiChevronLeft className="h-4 w-4" /> Back
        </button>

        {step < 5 ? (
          <button
            onClick={() => setStep((s) => (s + 1) as Step)}
            className="flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Next <FiChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={pending || !form.title || !form.country}
            className="flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {pending ? "Creating…" : "Create transfer"}
          </button>
        )}
      </div>
    </div>
  );
}
