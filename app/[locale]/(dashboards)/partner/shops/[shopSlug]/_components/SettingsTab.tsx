"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiAlertTriangle } from "react-icons/fi";
import { updateShop, deleteShop } from "@/lib/actions/partner-shops";
import type { DeliveryMethod } from "@prisma/client";

type ShopSettings = {
  id:                string;
  name:              string;
  isOpen:            boolean;
  deliveryMethods:   DeliveryMethod[];
  freeShippingAbove: number | null;
  minOrderAmount:    number | null;
  country:           string;
  region:            string;
  category:          string;
  description:       string;
};

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string; desc: string }[] = [
  { value: "PICKUP",         label: "In-store pickup",       desc: "Customer collects from your shop" },
  { value: "LOCAL_DELIVERY", label: "Local delivery",        desc: "Delivery within your city" },
  { value: "NATIONWIDE",     label: "Nationwide shipping",   desc: "Domestic shipping across the country" },
  { value: "INTERNATIONAL",  label: "International shipping", desc: "Shipping anywhere in the world" },
];

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

export function SettingsTab({ shop, locale }: { shop: ShopSettings; locale: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [delPending, delStart] = useTransition();

  const [form, setForm] = useState({
    isOpen:            shop.isOpen,
    deliveryMethods:   shop.deliveryMethods as DeliveryMethod[],
    freeShippingAbove: shop.freeShippingAbove ?? "",
    minOrderAmount:    shop.minOrderAmount ?? "",
  });

  function toggleMethod(method: DeliveryMethod) {
    setForm((p) => {
      const has = p.deliveryMethods.includes(method);
      const updated = has
        ? p.deliveryMethods.filter((m) => m !== method)
        : [...p.deliveryMethods, method];
      return { ...p, deliveryMethods: updated };
    });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.deliveryMethods.length === 0) {
      toast.error("Select at least one delivery method");
      return;
    }
    start(async () => {
      const res = await updateShop(shop.id, {
        name:              shop.name,
        description:       shop.description,
        category:          shop.category,
        country:           shop.country,
        region:            shop.region,
        isOpen:            form.isOpen,
        deliveryMethods:   form.deliveryMethods,
        freeShippingAbove: form.freeShippingAbove ? Number(form.freeShippingAbove) : null,
        minOrderAmount:    form.minOrderAmount    ? Number(form.minOrderAmount)    : null,
        featuredInHome:    false,
      });
      if (res.success) toast.success("Settings saved");
      else toast.error(res.error ?? "Failed to save");
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${shop.name}"? All products and orders will also be removed. This cannot be undone.`)) return;
    delStart(async () => {
      const res = await deleteShop(shop.id);
      if (res.success) {
        toast.success("Shop deleted");
        router.push(`/${locale}/partner/shops`);
      } else {
        toast.error(res.error ?? "Failed to delete");
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">

      {/* Open/Closed */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Shop status</h3>
        <label className="flex items-start gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
          <input
            type="checkbox"
            checked={form.isOpen}
            onChange={(e) => setForm((p) => ({ ...p, isOpen: e.target.checked }))}
            className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary/30"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Shop is open</p>
            <p className="text-xs text-gray-400 mt-0.5">Customers can browse and order from your shop.</p>
          </div>
        </label>
      </div>

      {/* Delivery methods */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Delivery methods</h3>
        <div className="space-y-2">
          {DELIVERY_OPTIONS.map(({ value, label, desc }) => (
            <label key={value} className="flex items-start gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
              <input
                type="checkbox"
                checked={form.deliveryMethods.includes(value)}
                onChange={() => toggleMethod(value)}
                className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Thresholds */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Pricing rules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Free shipping above (TND)</label>
            <input
              type="number"
              min={1}
              value={form.freeShippingAbove}
              onChange={(e) => setForm((p) => ({ ...p, freeShippingAbove: e.target.value }))}
              placeholder="e.g. 150"
              className={inputCls}
            />
            <p className="text-xs text-gray-400">Leave empty to always charge delivery.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Minimum order amount (TND)</label>
            <input
              type="number"
              min={1}
              value={form.minOrderAmount}
              onChange={(e) => setForm((p) => ({ ...p, minOrderAmount: e.target.value }))}
              placeholder="e.g. 30"
              className={inputCls}
            />
            <p className="text-xs text-gray-400">Leave empty for no minimum.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={pending}
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>

      {/* Danger zone */}
      <div className="border border-red-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-red-600">
          <FiAlertTriangle className="h-4 w-4" />
          <h3 className="font-semibold text-sm">Danger zone</h3>
        </div>
        <p className="text-sm text-gray-500">
          Permanently delete this shop and all its products, images, and orders. This action cannot be undone.
        </p>
        <button
          type="button"
          disabled={delPending}
          onClick={handleDelete}
          className="text-sm border border-red-200 text-red-600 rounded-xl px-4 py-2 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {delPending ? "Deleting…" : "Delete shop"}
        </button>
      </div>
    </form>
  );
}
