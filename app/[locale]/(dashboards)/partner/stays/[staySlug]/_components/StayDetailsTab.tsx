"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateStay } from "@/lib/actions/partner";

const PROPERTY_TYPES = ["Apartment", "Villa", "House", "Riad", "Bungalow", "Hotel Room", "Other"];
const CATEGORIES     = ["Entire place", "Private room", "Shared room"];
const AMENITIES      = [
  { key: "hasWifi",            label: "WiFi" },
  { key: "hasPool",            label: "Pool" },
  { key: "hasParking",         label: "Parking" },
  { key: "hasKitchen",         label: "Kitchen" },
  { key: "hasAirConditioning", label: "Air conditioning" },
  { key: "isPetFriendly",      label: "Pet friendly" },
] as const;

type Stay = {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  category: string;
  price: number;
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
};

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

export function StayDetailsTab({ stay }: { stay: Stay }) {
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    title:              stay.title,
    description:        stay.description,
    propertyType:       stay.propertyType,
    category:           stay.category,
    price:              stay.price,
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
    hasWifi:            stay.hasWifi,
    hasPool:            stay.hasPool,
    hasParking:         stay.hasParking,
    hasKitchen:         stay.hasKitchen,
    hasAirConditioning: stay.hasAirConditioning,
    isPetFriendly:      stay.isPetFriendly,
  });

  const set  = (key: string, value: string | number) => setForm((p) => ({ ...p, [key]: value }));
  const setB = (key: string, value: boolean)          => setForm((p) => ({ ...p, [key]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updateStay(stay.id, form);
      if (res.success) toast.success("Stay updated");
      else toast.error(res.error ?? "Failed to update");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Title *</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} required className={inputCls} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Description *</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} required rows={5} className={`${inputCls} resize-none`} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Property type</label>
          <select value={form.propertyType} onChange={(e) => set("propertyType", e.target.value)} className={`${inputCls} bg-white`}>
            {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className={`${inputCls} bg-white`}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Price/night (TND) *</label>
          <input type="number" min={0} value={form.price} onChange={(e) => set("price", parseInt(e.target.value))} required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Max guests *</label>
          <input type="number" min={1} value={form.guestCount} onChange={(e) => set("guestCount", parseInt(e.target.value))} required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Bedrooms</label>
          <input type="number" min={1} value={form.bedroomCount} onChange={(e) => set("bedroomCount", parseInt(e.target.value))} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Beds</label>
          <input type="number" min={1} value={form.bedCount} onChange={(e) => set("bedCount", parseInt(e.target.value))} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Bathrooms</label>
          <input type="number" min={1} value={form.bathroomCount} onChange={(e) => set("bathroomCount", parseInt(e.target.value))} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Min stay (nights)</label>
          <input type="number" min={1} value={form.minStayNights} onChange={(e) => set("minStayNights", parseInt(e.target.value))} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Country *</label>
          <input value={form.country} onChange={(e) => set("country", e.target.value)} required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Region *</label>
          <input value={form.region} onChange={(e) => set("region", e.target.value)} required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">City</label>
          <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Check-in time</label>
          <input type="time" value={form.checkInTime} onChange={(e) => set("checkInTime", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Check-out time</label>
          <input type="time" value={form.checkOutTime} onChange={(e) => set("checkOutTime", e.target.value)} className={inputCls} />
        </div>

        {/* Amenities */}
        <div className="sm:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-700">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setB(key, !form[key])}
                className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  form[key] ? "bg-primary/10 text-primary border-primary/30" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={pending}
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
