"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateShop } from "@/lib/actions/partner-shops";
import { SHOP_CATEGORIES } from "@/lib/utils/shop-categories";

type ShopDetails = {
  id:                string;
  name:              string;
  arabicName:        string | null;
  description:       string;
  arabicDescription: string | null;
  category:          string;
  phone:             string | null;
  country:           string;
  region:            string;
  city:              string | null;
  address:           string | null;
  location:          string | null;
  coverPhoto:        string | null;
  logo:              string | null;
  website:           string | null;
  instagram:         string | null;
  facebook:          string | null;
  deliveryMethods:   string[];
  isOpen:            boolean;
  featuredInHome:    boolean;
};

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

export function DetailsTab({ shop }: { shop: ShopDetails }) {
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    name:              shop.name,
    arabicName:        shop.arabicName        ?? "",
    description:       shop.description,
    arabicDescription: shop.arabicDescription ?? "",
    category:          shop.category,
    phone:             shop.phone             ?? "",
    country:           shop.country,
    region:            shop.region,
    city:              shop.city              ?? "",
    address:           shop.address           ?? "",
    location:          shop.location          ?? "",
    coverPhoto:        shop.coverPhoto        ?? "",
    logo:              shop.logo              ?? "",
    website:           shop.website           ?? "",
    instagram:         shop.instagram         ?? "",
    facebook:          shop.facebook          ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updateShop(shop.id, {
        ...form,
        arabicName:        form.arabicName        || undefined,
        arabicDescription: form.arabicDescription || undefined,
        phone:             form.phone             || undefined,
        city:              form.city              || undefined,
        address:           form.address           || undefined,
        location:          form.location          || undefined,
        coverPhoto:        form.coverPhoto        || undefined,
        logo:              form.logo              || undefined,
        website:           form.website           || undefined,
        instagram:         form.instagram         || undefined,
        facebook:          form.facebook          || undefined,
        deliveryMethods:   shop.deliveryMethods,
        isOpen:            shop.isOpen,
        featuredInHome:    shop.featuredInHome,
      });
      if (res.success) toast.success("Shop updated");
      else toast.error(res.error ?? "Failed to update");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Name *</label>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Arabic name</label>
          <input value={form.arabicName} onChange={(e) => setForm((p) => ({ ...p, arabicName: e.target.value }))} dir="rtl" className={inputCls} />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Description *</label>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required rows={4} className={`${inputCls} resize-none`} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Arabic description</label>
          <textarea value={form.arabicDescription} onChange={(e) => setForm((p) => ({ ...p, arabicDescription: e.target.value }))} rows={3} dir="rtl" className={`${inputCls} resize-none`} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Category *</label>
          <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={`${inputCls} bg-white`}>
            {SHOP_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.label.en}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Country *</label>
          <input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Region *</label>
          <input value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">City</label>
          <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Address</label>
          <input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className={inputCls} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Google Maps link</label>
          <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="https://maps.google.com/..." className={inputCls} />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Cover photo URL</label>
          <input value={form.coverPhoto} onChange={(e) => setForm((p) => ({ ...p, coverPhoto: e.target.value }))} placeholder="https://..." className={inputCls} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Logo URL</label>
          <input value={form.logo} onChange={(e) => setForm((p) => ({ ...p, logo: e.target.value }))} placeholder="https://..." className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Website</label>
          <input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Instagram</label>
          <input value={form.instagram} onChange={(e) => setForm((p) => ({ ...p, instagram: e.target.value }))} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Facebook</label>
          <input value={form.facebook} onChange={(e) => setForm((p) => ({ ...p, facebook: e.target.value }))} className={inputCls} />
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
