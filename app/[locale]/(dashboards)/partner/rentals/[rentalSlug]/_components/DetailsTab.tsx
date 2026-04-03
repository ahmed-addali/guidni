"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FiCheck, FiMapPin } from "react-icons/fi";
import { updateRental } from "@/lib/actions/partner-rentals";

type RentalTypeValue = "CAR" | "BIKE" | "SCOOTER" | "BOAT" | "OTHER";
type Destination = { id: string; label: string; city: string; country: string; region: string };

const TRANSMISSIONS = ["Automatic", "Manual"];
const FUEL_TYPES    = ["Petrol", "Diesel", "Electric", "Hybrid"];

interface Rental {
  id: string; title: string; description: string; type: RentalTypeValue;
  brand?: string | null; model?: string | null; year?: number | null; color?: string | null;
  transmission?: string | null; fuelType?: string | null; capacity: number;
  hasAC: boolean; hasGPS: boolean; hasInsurance: boolean; requiresLicense: boolean;
  country: string; region: string; city?: string | null; address?: string | null; phone?: string | null;
  pricePerDay: number; pricePerHour?: number | null; minDays: number;
  destinationId?: string | null;
}

const inputCls  = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const selectCls = `${inputCls} bg-white`;

export function DetailsTab({ rental, destinations }: { rental: Rental; destinations: Destination[] }) {
  const [form, setForm] = useState({
    title:           rental.title,
    description:     rental.description,
    type:            rental.type,
    brand:           rental.brand ?? "",
    model:           rental.model ?? "",
    year:            rental.year?.toString() ?? "",
    color:           rental.color ?? "",
    transmission:    rental.transmission ?? "",
    fuelType:        rental.fuelType ?? "",
    capacity:        rental.capacity,
    hasAC:           rental.hasAC,
    hasGPS:          rental.hasGPS,
    hasInsurance:    rental.hasInsurance,
    requiresLicense: rental.requiresLicense,
    country:         rental.country,
    region:          rental.region,
    city:            rental.city ?? "",
    address:         rental.address ?? "",
    phone:           rental.phone ?? "",
    pricePerDay:     rental.pricePerDay,
    pricePerHour:    rental.pricePerHour ?? 0,
    minDays:         rental.minDays,
    destinationId:   rental.destinationId ?? "",
  });
  const [pending, start] = useTransition();

  const set  = (key: string, value: string | number | boolean) => setForm((p) => ({ ...p, [key]: value }));

  function handleSave() {
    start(async () => {
      const res = await updateRental(rental.id, {
        ...form,
        type:         form.type as RentalTypeValue,
        year:         form.year ? parseInt(form.year) : undefined,
        pricePerHour: form.pricePerHour || undefined,
        destinationId: form.destinationId || undefined,
      });
      if (res.success) toast.success("Saved!");
      else toast.error(res.error);
    });
  }

  const sectionCls = "bg-white border border-gray-100 rounded-2xl p-6 space-y-4";
  const headingCls = "font-semibold text-gray-800 border-b border-gray-100 pb-3";

  return (
    <div className="space-y-5">
      {/* Basics */}
      <div className={sectionCls}>
        <p className={headingCls}>Basic info</p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Title</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className={`${inputCls} resize-none`} />
        </div>
      </div>

      {/* Vehicle specs */}
      <div className={sectionCls}>
        <p className={headingCls}>Vehicle details</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Brand</label>
            <input value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Model</label>
            <input value={form.model} onChange={(e) => set("model", e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Year</label>
            <input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Color</label>
            <input value={form.color} onChange={(e) => set("color", e.target.value)} className={inputCls} />
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Fuel type</label>
            <select value={form.fuelType} onChange={(e) => set("fuelType", e.target.value)} className={selectCls}>
              <option value="">Select…</option>
              {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          {([
            ["hasAC", "Air conditioning"],
            ["hasGPS", "GPS"],
            ["hasInsurance", "Insurance included"],
            ["requiresLicense", "License required"],
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
        <p className={headingCls}>Location</p>
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
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <label className="text-sm font-medium text-gray-700">Pickup address</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className={sectionCls}>
        <p className={headingCls}>Pricing</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Price/day (TND)</label>
            <input type="number" min={0} value={form.pricePerDay} onChange={(e) => set("pricePerDay", parseInt(e.target.value) || 0)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Price/hour (TND)</label>
            <input type="number" min={0} value={form.pricePerHour} onChange={(e) => set("pricePerHour", parseInt(e.target.value) || 0)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Min days</label>
            <input type="number" min={1} value={form.minDays} onChange={(e) => set("minDays", parseInt(e.target.value) || 1)} className={inputCls} />
          </div>
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
