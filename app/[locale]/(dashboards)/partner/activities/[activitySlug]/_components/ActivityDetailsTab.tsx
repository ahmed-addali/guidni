"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateActivity } from "@/lib/actions/partner";

const CATEGORIES = [
  "Water Sports", "Desert", "Culture & History", "Food & Drink",
  "Adventure", "Wellness & Spa", "Nature & Wildlife", "Night Life", "Other",
];

type Activity = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  capacity: number;
  availableTimes: string;
  duration: string | null;
  country: string;
  region: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  cancelation: boolean | null;
  paynow: boolean | null;
};

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

export function ActivityDetailsTab({ activity }: { activity: Activity }) {
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    title:          activity.title,
    description:    activity.description,
    category:       activity.category,
    price:          activity.price,
    capacity:       activity.capacity,
    availableTimes: activity.availableTimes,
    duration:       activity.duration    ?? "",
    country:        activity.country,
    region:         activity.region,
    city:           activity.city        ?? "",
    address:        activity.address     ?? "",
    phone:          activity.phone       ?? "",
    cancelation:    activity.cancelation ?? true,
    paynow:         activity.paynow      ?? false,
  });

  const set  = (key: string, value: string | number)  => setForm((p) => ({ ...p, [key]: value }));
  const setB = (key: string, value: boolean)           => setForm((p) => ({ ...p, [key]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updateActivity(activity.id, form);
      if (res.success) toast.success("Activity updated");
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
          <label className="text-sm font-medium text-gray-700">Category</label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className={`${inputCls} bg-white`}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Duration</label>
          <input value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 3 hours" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Price (TND) *</label>
          <input type="number" min={0} value={form.price} onChange={(e) => set("price", parseInt(e.target.value))} required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Capacity *</label>
          <input type="number" min={1} value={form.capacity} onChange={(e) => set("capacity", parseInt(e.target.value))} required className={inputCls} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Available times (comma-separated)</label>
          <input value={form.availableTimes} onChange={(e) => set("availableTimes", e.target.value)} placeholder="08:00,10:00,14:00" required className={inputCls} />
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
        <div className="sm:col-span-2 flex items-center gap-6 pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.cancelation} onChange={(e) => setB("cancelation", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300" />
            <span className="text-sm font-medium text-gray-700">Free cancellation</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.paynow} onChange={(e) => setB("paynow", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300" />
            <span className="text-sm font-medium text-gray-700">Require payment upfront</span>
          </label>
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
