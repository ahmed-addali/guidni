"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPass } from "@/lib/actions/passes";

type Props = {
  destinations: { id: string; label: string }[];
  locale: string;
};

export function CreatePassForm({ destinations, locale }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [form, setForm] = useState({
    passKey:           "",
    name:              "",
    arabicName:        "",
    description:       "",
    arabicDescription: "",
    price:             0,
    discount:          0,
    popular:           false,
    optionalCount:     1,
    destinationId:     "",
  });

  const set = (key: string, value: string | number | boolean) =>
    setForm((p) => ({ ...p, [key]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await createPass({
        ...form,
        arabicName:        form.arabicName || undefined,
        description:       form.description || undefined,
        arabicDescription: form.arabicDescription || undefined,
        destinationId:     form.destinationId || undefined,
      });
      if (res.success) {
        toast.success("Pass created");
        router.push(`/${locale}/admin/passes/${res.data.passKey}`);
      } else {
        toast.error(res.error ?? "Failed to create pass");
      }
    });
  }

  const fieldCls =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Basic Info</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pass Key *</label>
            <input
              required
              value={form.passKey}
              onChange={(e) => set("passKey", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="djerba-explorer"
              className={fieldCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <select
              value={form.destinationId}
              onChange={(e) => set("destinationId", e.target.value)}
              className={`${fieldCls} bg-white`}
            >
              <option value="">All destinations</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name (EN) *</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={fieldCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name (AR)</label>
            <input value={form.arabicName} onChange={(e) => set("arabicName", e.target.value)} dir="rtl" className={fieldCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
            <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className={`${fieldCls} resize-none`} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (AR)</label>
            <textarea rows={3} value={form.arabicDescription} onChange={(e) => set("arabicDescription", e.target.value)} dir="rtl" className={`${fieldCls} resize-none`} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Pricing & Options</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (TND) *</label>
            <input type="number" min={0} required value={form.price} onChange={(e) => set("price", Number(e.target.value))} className={fieldCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
            <input type="number" min={0} max={100} value={form.discount} onChange={(e) => set("discount", Number(e.target.value))} className={fieldCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Optional picks</label>
            <input type="number" min={0} value={form.optionalCount} onChange={(e) => set("optionalCount", Number(e.target.value))} className={fieldCls} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.popular}
                onChange={(e) => set("popular", e.target.checked)}
                className="accent-primary"
              />
              Popular
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create Pass"}
        </button>
      </div>
    </form>
  );
}
