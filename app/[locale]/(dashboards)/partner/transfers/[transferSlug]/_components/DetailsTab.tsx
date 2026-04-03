"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FiCheck, FiMapPin } from "react-icons/fi";
import { updateTransfer } from "@/lib/actions/partner-transfers";

type TransferTypeValue = "AIRPORT_TRANSFER" | "TAXI" | "CHAUFFEUR" | "SHUTTLE";
type Destination = { id: string; label: string; city: string; country: string; region: string };

const TRANSFER_TYPES: { value: TransferTypeValue; label: string }[] = [
  { value: "AIRPORT_TRANSFER", label: "Airport Transfer" },
  { value: "TAXI",             label: "City Taxi" },
  { value: "CHAUFFEUR",        label: "Private Chauffeur" },
  { value: "SHUTTLE",          label: "Shuttle" },
];

interface Transfer {
  id:             string;
  title:          string;
  arabicTitle?:   string | null;
  description:    string;
  languages?:     string | null;
  type:           TransferTypeValue;
  pricePerTrip?:  number | null;
  pricePerHour?:  number | null;
  pricePerPerson?: number | null;
  capacity:       number;
  vehicleType?:   string | null;
  brand?:         string | null;
  model?:         string | null;
  year?:          number | null;
  isAC:           boolean;
  isMeetGreet:    boolean;
  isChildSeat:    boolean;
  phone?:         string | null;
  country:        string;
  region:         string;
  city?:          string | null;
  address?:       string | null;
  destinationId?: string | null;
}

const inputCls  = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const selectCls = `${inputCls} bg-white`;

export function DetailsTab({ transfer, destinations }: { transfer: Transfer; destinations: Destination[] }) {
  const [form, setForm] = useState({
    title:          transfer.title,
    arabicTitle:    transfer.arabicTitle ?? "",
    description:    transfer.description,
    languages:      transfer.languages ?? "",
    type:           transfer.type,
    pricePerTrip:   transfer.pricePerTrip?.toString() ?? "",
    pricePerHour:   transfer.pricePerHour?.toString() ?? "",
    pricePerPerson: transfer.pricePerPerson?.toString() ?? "",
    capacity:       transfer.capacity,
    vehicleType:    transfer.vehicleType ?? "",
    brand:          transfer.brand ?? "",
    model:          transfer.model ?? "",
    year:           transfer.year?.toString() ?? "",
    isAC:           transfer.isAC,
    isMeetGreet:    transfer.isMeetGreet,
    isChildSeat:    transfer.isChildSeat,
    phone:          transfer.phone ?? "",
    country:        transfer.country,
    region:         transfer.region,
    city:           transfer.city ?? "",
    address:        transfer.address ?? "",
    destinationId:  transfer.destinationId ?? "",
  });
  const [pending, start] = useTransition();

  const set = (key: string, value: string | number | boolean) =>
    setForm((p) => ({ ...p, [key]: value }));

  function handleSave() {
    start(async () => {
      const res = await updateTransfer(transfer.id, {
        ...form,
        type:           form.type as TransferTypeValue,
        year:           form.year ? Number(form.year) : null,
        pricePerTrip:   form.pricePerTrip   ? Number(form.pricePerTrip)   : null,
        pricePerHour:   form.pricePerHour   ? Number(form.pricePerHour)   : null,
        pricePerPerson: form.pricePerPerson ? Number(form.pricePerPerson) : null,
        destinationId:  form.destinationId || null,
        featuredInHome: false,
      });
      if (res.success) toast.success("Saved!");
      else toast.error(res.error);
    });
  }

  const sectionCls = "bg-white border border-gray-100 rounded-2xl p-6 space-y-4";
  const headingCls = "font-semibold text-gray-800 border-b border-gray-100 pb-3";

  return (
    <div className="space-y-5">
      {/* Service type */}
      <div className={sectionCls}>
        <p className={headingCls}>Service type</p>
        <div className="grid grid-cols-2 gap-3">
          {TRANSFER_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => set("type", value)}
              className={`text-left p-3 rounded-xl border-2 transition-colors text-sm font-medium ${
                form.type === value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              {form.type === value && <FiCheck className="h-3.5 w-3.5 inline mr-1.5 mb-0.5" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Basic info */}
      <div className={sectionCls}>
        <p className={headingCls}>Basic info</p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Service name</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Arabic name (optional)</label>
          <input value={form.arabicTitle} onChange={(e) => set("arabicTitle", e.target.value)} dir="rtl" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className={`${inputCls} resize-none`} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Languages spoken (optional)</label>
          <input value={form.languages} onChange={(e) => set("languages", e.target.value)} placeholder="e.g. Arabic, French, English" className={inputCls} />
        </div>
      </div>

      {/* Vehicle specs */}
      <div className={sectionCls}>
        <p className={headingCls}>Vehicle specs</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Vehicle type</label>
            <input value={form.vehicleType} onChange={(e) => set("vehicleType", e.target.value)} placeholder="e.g. Sedan, SUV, Van" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Capacity (passengers)</label>
            <input type="number" min={1} value={form.capacity} onChange={(e) => set("capacity", Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Brand</label>
            <input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Mercedes" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Model</label>
            <input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. E-Class" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Year</label>
            <input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          {([
            ["isAC",        "Air conditioning"],
            ["isMeetGreet", "Meet & Greet"],
            ["isChildSeat", "Child seat available"],
          ] as [string, string][]).map(([key, label]) => (
            <button key={key} type="button" onClick={() => set(key, !(form as never)[key])}
              className={`text-sm px-4 py-2.5 rounded-xl border font-medium transition-all ${
                (form as never)[key]
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
              }`}>
              {(form as never)[key] && <FiCheck className="h-3.5 w-3.5 inline mr-1.5 mb-0.5" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className={sectionCls}>
        <p className={headingCls}>Coverage area</p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Destination</label>
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
              <option value="">No destination</option>
              {destinations.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Country</label>
            <input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Region</label>
            <input value={form.region} onChange={(e) => set("region", e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">City</label>
            <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className={sectionCls}>
        <p className={headingCls}>Pricing</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {(form.type === "AIRPORT_TRANSFER" || form.type === "TAXI" || form.type === "SHUTTLE") && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Price per trip (TND)</label>
              <input type="number" min={0} value={form.pricePerTrip}
                onChange={(e) => set("pricePerTrip", e.target.value)} className={inputCls} />
            </div>
          )}
          {form.type === "CHAUFFEUR" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Price per hour (TND)</label>
              <input type="number" min={0} value={form.pricePerHour}
                onChange={(e) => set("pricePerHour", e.target.value)} className={inputCls} />
            </div>
          )}
          {form.type === "SHUTTLE" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Price per person (TND)</label>
              <input type="number" min={0} value={form.pricePerPerson}
                onChange={(e) => set("pricePerPerson", e.target.value)} className={inputCls} />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={pending}
          className="bg-primary text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
