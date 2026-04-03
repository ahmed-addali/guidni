"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateRestaurant } from "@/lib/actions/partner-restaurants";
import { RESTAURANT_CUISINES, FOOD_TYPES, DIET_TYPES, RESTAURANT_ATTRIBUTES, ATTRIBUTE_GROUPS } from "@/lib/utils/restaurant-cuisines";

const RESTAURANT_TYPES = [
  { value: "RESTAURANT",  label: "Restaurant" },
  { value: "CAFEE_SHOP",  label: "Café / Coffee Shop" },
  { value: "BOTH",        label: "Restaurant & Café" },
] as const;

const MEALS = ["Breakfast", "Lunch", "Dinner", "Brunch", "All day"];

type RestaurantDetails = {
  id:                  string;
  name:                string;
  arabicName:          string | null;
  description:         string;
  arabicDescription:   string | null;
  phone:               string | null;
  type:                string;
  category:            string | null;
  meals:               string | null;
  foodTypes:           string[];
  dietTypes:           string[];
  attributes:          string[];
  country:             string;
  city:                string;
  address:             string | null;
  location:            string | null;
  website:             string | null;
  instagram:           string | null;
  facebook:            string | null;
  reservationsEnabled: boolean;
  maxGuests:           number | null;
  tables:              number | null;
};

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

export function DetailsTab({ restaurant }: { restaurant: RestaurantDetails }) {
  const [pending, start] = useTransition();

  const splitToArray = (val: string | null) =>
    val ? val.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const [form, setForm] = useState({
    name:                restaurant.name,
    arabicName:          restaurant.arabicName          ?? "",
    description:         restaurant.description,
    arabicDescription:   restaurant.arabicDescription   ?? "",
    phone:               restaurant.phone               ?? "",
    type:                restaurant.type as "RESTAURANT" | "CAFEE_SHOP" | "BOTH",
    category:            splitToArray(restaurant.category),
    meals:               splitToArray(restaurant.meals),
    foodTypes:           restaurant.foodTypes,
    dietTypes:           restaurant.dietTypes,
    attributes:          restaurant.attributes,
    country:             restaurant.country,
    city:                restaurant.city,
    address:             restaurant.address             ?? "",
    location:            restaurant.location            ?? "",
    website:             restaurant.website             ?? "",
    instagram:           restaurant.instagram           ?? "",
    facebook:            restaurant.facebook            ?? "",
    reservationsEnabled: restaurant.reservationsEnabled,
    maxGuests:           restaurant.maxGuests           ?? 20,
    tables:              restaurant.tables              ?? 5,
  });

  function toggleArr(key: "category" | "meals" | "foodTypes" | "dietTypes" | "attributes", val: string) {
    setForm((p) => {
      const arr = p[key] as string[];
      return { ...p, [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const payload = {
        ...form,
        category:  form.category.join(",") || undefined,
        meals:     form.meals.join(",")    || undefined,
        foodTypes:  form.foodTypes,
        dietTypes:  form.dietTypes,
        attributes: form.attributes,
        maxGuests:  form.maxGuests || null,
        tables:    form.tables    || null,
        featuredInHome: false,
      };
      const res = await updateRestaurant(restaurant.id, payload);
      if (res.success) toast.success("Restaurant updated");
      else toast.error(res.error ?? "Failed to update");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Name *</label>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Arabic name</label>
          <input value={form.arabicName} onChange={(e) => setForm((p) => ({ ...p, arabicName: e.target.value }))} dir="rtl" className={inputCls} />
        </div>

        {/* Description */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Description *</label>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required rows={4} className={`${inputCls} resize-none`} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Arabic description</label>
          <textarea value={form.arabicDescription} onChange={(e) => setForm((p) => ({ ...p, arabicDescription: e.target.value }))} rows={3} dir="rtl" className={`${inputCls} resize-none`} />
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Type *</label>
          <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as any }))} className={`${inputCls} bg-white`}>
            {RESTAURANT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className={inputCls} />
        </div>

        {/* Categories — only for RESTAURANT / BOTH */}
        {form.type !== "CAFEE_SHOP" && (
          <>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700">Cuisine</label>
              <div className="flex flex-wrap gap-2">
                {RESTAURANT_CUISINES.map((c) => (
                  <button key={c.value} type="button" onClick={() => toggleArr("category", c.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      form.category.includes(c.value)
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}>
                    {form.category.includes(c.value) && "✓ "}{c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700">Meals served</label>
              <div className="flex flex-wrap gap-2">
                {MEALS.map((m) => (
                  <button key={m} type="button" onClick={() => toggleArr("meals", m)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      form.meals.includes(m)
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}>
                    {form.meals.includes(m) && "✓ "}{m}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Food Types */}
        <div className="sm:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-700">Food types</label>
          <div className="flex flex-wrap gap-2">
            {FOOD_TYPES.map((ft) => (
              <button key={ft.value} type="button" onClick={() => toggleArr("foodTypes", ft.value)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  form.foodTypes.includes(ft.value)
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                }`}>
                {form.foodTypes.includes(ft.value) && "✓ "}{ft.label}
              </button>
            ))}
          </div>
        </div>

        {/* Diet Types */}
        <div className="sm:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-700">Dietary options</label>
          <div className="flex flex-wrap gap-2">
            {DIET_TYPES.map((dt) => (
              <button key={dt.value} type="button" onClick={() => toggleArr("dietTypes", dt.value)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  form.dietTypes.includes(dt.value)
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                }`}>
                {form.dietTypes.includes(dt.value) && "✓ "}{dt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Attributes */}
        <div className="sm:col-span-2 space-y-3">
          <label className="text-sm font-medium text-gray-700">Ambiance & features</label>
          {ATTRIBUTE_GROUPS.map((group) => {
            const groupItems = RESTAURANT_ATTRIBUTES.filter((a) =>
              (group.values as readonly string[]).includes(a.value)
            );
            return (
              <div key={group.label}>
                <p className="text-xs text-gray-400 mb-1.5">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {groupItems.map((a) => (
                    <button key={a.value} type="button" onClick={() => toggleArr("attributes", a.value)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                        form.attributes.includes(a.value)
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}>
                      {form.attributes.includes(a.value) && "✓ "}{a.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Country *</label>
          <input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">City *</label>
          <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Address</label>
          <input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Google Maps link</label>
          <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className={inputCls} />
        </div>

        {/* Social */}
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

        {/* Capacity */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Max guests</label>
          <input type="number" min={1} value={form.maxGuests} onChange={(e) => setForm((p) => ({ ...p, maxGuests: parseInt(e.target.value) || 1 }))} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Tables</label>
          <input type="number" min={1} value={form.tables} onChange={(e) => setForm((p) => ({ ...p, tables: parseInt(e.target.value) || 1 }))} className={inputCls} />
        </div>

        {/* Reservations toggle */}
        <div className="sm:col-span-2">
          <label className="flex items-start gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
            <input
              type="checkbox"
              checked={form.reservationsEnabled}
              onChange={(e) => setForm((p) => ({ ...p, reservationsEnabled: e.target.checked }))}
              className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary/30"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">Enable reservations</p>
              <p className="text-xs text-gray-400 mt-0.5">Allow guests to book a table through Guidni.</p>
            </div>
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
