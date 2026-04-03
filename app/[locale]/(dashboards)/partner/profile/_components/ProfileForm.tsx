"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateBusinessProfile } from "@/lib/actions/partner";

type Profile = {
  name: string;
  description: string;
  country: string;
  region: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  languages: string | null;
  type: string;
  companyRN: string | null;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({
    name:        profile.name,
    description: profile.description,
    country:     profile.country,
    region:      profile.region,
    address:     profile.address     ?? "",
    phone:       profile.phone       ?? "",
    website:     profile.website     ?? "",
    instagram:   profile.instagram   ?? "",
    facebook:    profile.facebook    ?? "",
    languages:   profile.languages   ?? "",
    type:        profile.type        ?? "INDIVIDUAL",
    companyRN:   profile.companyRN   ?? "",
  });

  const [pending, start] = useTransition();

  const set = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updateBusinessProfile(form);
      if (res.success) toast.success("Profile updated");
      else toast.error(res.error ?? "Failed to update");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Business Info</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} required rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
              <option value="INDIVIDUAL">Individual</option>
              <option value="COMPANY">Company</option>
            </select>
          </div>

          {form.type === "COMPANY" && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Registration Number</label>
              <input value={form.companyRN} onChange={(e) => set("companyRN", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Location & Contact</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
            <input value={form.country} onChange={(e) => set("country", e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
            <input value={form.region} onChange={(e) => set("region", e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input type="url" value={form.website} onChange={(e) => set("website", e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
            <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)}
              placeholder="@username"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
            <input value={form.facebook} onChange={(e) => set("facebook", e.target.value)}
              placeholder="Page name or URL"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Languages spoken</label>
            <input value={form.languages} onChange={(e) => set("languages", e.target.value)}
              placeholder="English, French, Arabic"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
