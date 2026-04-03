"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updatePass, deletePass } from "@/lib/actions/passes";

type Pass = {
  passKey:           string;
  name:              string;
  arabicName:        string | null;
  description:       string | null;
  arabicDescription: string | null;
  price:             number;
  discount:          number;
  popular:           boolean;
  optionalCount:     number;
  destinationId:     string | null;
};

type Props = {
  pass:         Pass;
  destinations: { id: string; label: string }[];
};

export function EditPassForm({ pass, destinations }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deleting, startDelete] = useTransition();

  const [form, setForm] = useState({
    name:              pass.name,
    arabicName:        pass.arabicName ?? "",
    description:       pass.description ?? "",
    arabicDescription: pass.arabicDescription ?? "",
    price:             pass.price,
    discount:          pass.discount,
    popular:           pass.popular,
    optionalCount:     pass.optionalCount,
    destinationId:     pass.destinationId ?? "",
  });

  const set = (key: string, value: string | number | boolean) =>
    setForm((p) => ({ ...p, [key]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updatePass(pass.passKey, {
        ...form,
        arabicName:        form.arabicName || undefined,
        description:       form.description || undefined,
        arabicDescription: form.arabicDescription || undefined,
        destinationId:     form.destinationId || undefined,
      });
      if (res.success) toast.success("Pass updated");
      else toast.error("Failed to update");
    });
  }

  function handleDelete() {
    if (!confirm("Delete this pass? This cannot be undone.")) return;
    startDelete(async () => {
      const res = await deletePass(pass.passKey);
      if (res.success) {
        toast.success("Pass deleted");
        router.push("../passes");
      } else {
        toast.error("Failed to delete");
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
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <select value={form.destinationId} onChange={(e) => set("destinationId", e.target.value)} className={`${fieldCls} bg-white`}>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (TND)</label>
            <input type="number" min={0} value={form.price} onChange={(e) => set("price", Number(e.target.value))} className={fieldCls} />
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
              <input type="checkbox" checked={form.popular} onChange={(e) => set("popular", e.target.checked)} className="accent-primary" />
              Popular
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2.5 text-red-600 border border-red-200 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete Pass"}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
