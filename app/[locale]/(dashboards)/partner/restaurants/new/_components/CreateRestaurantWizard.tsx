"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { FiCheck, FiChevronLeft, FiChevronRight, FiMapPin } from "react-icons/fi";
import { createRestaurant } from "@/lib/actions/partner-restaurants";
import { RESTAURANT_CUISINES, FOOD_TYPES, DIET_TYPES, RESTAURANT_ATTRIBUTES, ATTRIBUTE_GROUPS } from "@/lib/utils/restaurant-cuisines";

const STEPS = ["Type", "Details", "Location", "Capacity", "Review"] as const;
type Step = 0 | 1 | 2 | 3 | 4;

const RESTAURANT_TYPES = [
  { value: "RESTAURANT",  label: "Restaurant",          desc: "Full-service dining" },
  { value: "CAFEE_SHOP",  label: "Café / Coffee Shop",  desc: "Coffee, drinks & light food" },
  { value: "BOTH",        label: "Restaurant & Café",   desc: "Dining + coffee experience" },
] as const;

const MEALS = ["Breakfast", "Lunch", "Dinner", "Brunch", "All day"];

type Destination = { id: string; label: string; city: string; country: string; region: string };

type FormData = {
  type:                "RESTAURANT" | "CAFEE_SHOP" | "BOTH";
  name:                string;
  description:         string;
  phone:               string;
  category:            string[];
  meals:               string[];
  foodTypes:           string[];
  dietTypes:           string[];
  attributes:          string[];
  country:             string;
  city:                string;
  address:             string;
  location:            string;
  website:             string;
  instagram:           string;
  facebook:            string;
  reservationsEnabled: boolean;
  maxGuests:           number;
  tables:              number;
  destinationId:       string;
};

const DEFAULTS: FormData = {
  type:                "RESTAURANT",
  name:                "",
  description:         "",
  phone:               "",
  category:            [],
  meals:               [],
  foodTypes:           [],
  dietTypes:           [],
  attributes:          [],
  country:             "",
  city:                "",
  address:             "",
  location:            "",
  website:             "",
  instagram:           "",
  facebook:            "",
  reservationsEnabled: false,
  maxGuests:           20,
  tables:              5,
  destinationId:       "",
};

function StepProgress({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${done   ? "bg-primary text-white"
                : active ? "bg-primary text-white ring-4 ring-primary/20"
                         : "bg-gray-100 text-gray-400"}`}>
                {done ? <FiCheck className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs mt-1 font-medium whitespace-nowrap ${active ? "text-primary" : done ? "text-gray-600" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 ${done ? "bg-primary" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

export function CreateRestaurantWizard({
  profileCountry,
  profileCity,
  profilePhone,
  destinations,
}: {
  profileCountry?: string;
  profileCity?:    string;
  profilePhone?:   string;
  destinations:    Destination[];
}) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [step, setStep]   = useState<Step>(0);
  const [form, setForm]   = useState<FormData>({
    ...DEFAULTS,
    country: profileCountry ?? "",
    city:    profileCity    ?? "",
    phone:   profilePhone   ?? "",
  });
  const [errors, setErrors]  = useState<Partial<Record<keyof FormData, string>>>({});
  const [pending, start]     = useTransition();

  const set = (key: keyof FormData, value: string | number | boolean | string[]) =>
    setForm((p) => ({ ...p, [key]: value }));

  function toggleArrayItem(key: "category" | "meals" | "foodTypes" | "dietTypes" | "attributes", val: string) {
    setForm((p) => {
      const arr = p[key] as string[];
      return { ...p, [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 0 && !form.type) e.type = "Select a type";
    if (step === 1) {
      if (!form.name.trim())        e.name        = "Name is required";
      if (form.name.trim().length < 2) e.name    = "At least 2 characters";
      if (!form.description.trim()) e.description = "Description is required";
      if (form.description.trim().length < 10) e.description = "At least 10 characters";
    }
    if (step === 2) {
      if (!form.destinationId)  e.destinationId = "Select a destination";
      if (!form.country.trim()) e.country = "Country is required";
      if (!form.city.trim())    e.city    = "City is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (validate()) setStep((s) => (s + 1) as Step);
  }

  function handleBack() {
    setStep((s) => (s - 1) as Step);
  }

  const selectedDestLabel = destinations.find((d) => d.id === form.destinationId)?.label ?? "";

  function handleSubmit() {
    start(async () => {
      const payload = {
        ...form,
        category:      form.category.join(","),
        meals:         form.meals.join(","),
        foodTypes:     form.foodTypes,
        dietTypes:     form.dietTypes,
        attributes:    form.attributes,
        maxGuests:     form.maxGuests || null,
        tables:        form.tables    || null,
        destinationId: form.destinationId || undefined,
      };
      const res = await createRestaurant(payload);
      if (res.success) {
        toast.success("Restaurant created!");
        router.push(`/${locale}/partner/restaurants`);
      } else {
        toast.error(res.error ?? "Failed to create restaurant");
      }
    });
  }

  const typeLabel: Record<string, string> = {
    RESTAURANT: "Restaurant",
    CAFEE_SHOP: "Café / Coffee Shop",
    BOTH:       "Restaurant & Café",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <StepProgress current={step} />

      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-6">

        {/* Step 0 — Type */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Type of establishment</h2>
              <p className="text-sm text-gray-400 mt-1">What kind of place are you listing?</p>
            </div>
            <div className="space-y-3">
              {RESTAURANT_TYPES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("type", value)}
                  className={`w-full text-left px-5 py-4 rounded-xl border font-medium transition-all ${
                    form.type === value
                      ? "bg-primary/10 text-primary border-primary/30 ring-2 ring-primary/20"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {form.type === value && <FiCheck className="h-4 w-4 shrink-0" />}
                    <div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {errors.type && <p className="text-xs text-red-500">{errors.type}</p>}
          </div>
        )}

        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Restaurant details</h2>
              <p className="text-sm text-gray-400 mt-1">Tell guests about your establishment.</p>
            </div>
            <FieldGroup label="Name *" error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. La Sirène de Djerba"
                className={inputCls}
              />
            </FieldGroup>
            <FieldGroup label="Description *" error={errors.description}>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                placeholder="Describe the ambiance, cuisine, and what makes your place special..."
                className={`${inputCls} resize-none`}
              />
            </FieldGroup>
            <FieldGroup label="Phone">
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+216..."
                className={inputCls}
              />
            </FieldGroup>
            {form.type !== "CAFEE_SHOP" && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Cuisine</label>
                  <div className="flex flex-wrap gap-2">
                    {RESTAURANT_CUISINES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => toggleArrayItem("category", c.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                          form.category.includes(c.value)
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {form.category.includes(c.value) && "✓ "}{c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Meals served</label>
                  <div className="flex flex-wrap gap-2">
                    {MEALS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleArrayItem("meals", m)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                          form.meals.includes(m)
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {form.meals.includes(m) && "✓ "}{m}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Food types</label>
              <div className="flex flex-wrap gap-2">
                {FOOD_TYPES.map((ft) => (
                  <button
                    key={ft.value}
                    type="button"
                    onClick={() => toggleArrayItem("foodTypes", ft.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      form.foodTypes.includes(ft.value)
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {form.foodTypes.includes(ft.value) && "✓ "}{ft.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Dietary options</label>
              <div className="flex flex-wrap gap-2">
                {DIET_TYPES.map((dt) => (
                  <button
                    key={dt.value}
                    type="button"
                    onClick={() => toggleArrayItem("dietTypes", dt.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      form.dietTypes.includes(dt.value)
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {form.dietTypes.includes(dt.value) && "✓ "}{dt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Ambiance & features</label>
              {ATTRIBUTE_GROUPS.map((group) => {
                const groupItems = RESTAURANT_ATTRIBUTES.filter((a) =>
                  (group.values as readonly string[]).includes(a.value)
                );
                return (
                  <div key={group.label}>
                    <p className="text-xs text-gray-400 mb-1.5">{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {groupItems.map((a) => (
                        <button
                          key={a.value}
                          type="button"
                          onClick={() => toggleArrayItem("attributes", a.value)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                            form.attributes.includes(a.value)
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          {form.attributes.includes(a.value) && "✓ "}{a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2 — Location */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Location</h2>
              <p className="text-sm text-gray-400 mt-1">Where is your restaurant located?</p>
            </div>

            {/* Destination selector */}
            <FieldGroup label="Destination *" error={errors.destinationId}>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <select
                  value={form.destinationId}
                  onChange={(e) => {
                    const dest = destinations.find((d) => d.id === e.target.value);
                    setForm((p) => ({
                      ...p,
                      destinationId: e.target.value,
                      ...(dest ? { country: dest.country, city: dest.city } : {}),
                    }));
                  }}
                  className={`${inputCls} pl-9 appearance-none bg-white`}
                >
                  <option value="">Select a destination…</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                This determines where your restaurant appears in listings.
              </p>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Country *" error={errors.country}>
                <input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} />
              </FieldGroup>
              <FieldGroup label="City *" error={errors.city}>
                <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
              </FieldGroup>
            </div>
            <FieldGroup label="Address">
              <input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Street address"
                className={inputCls}
              />
            </FieldGroup>
            <FieldGroup label="Google Maps link">
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="https://maps.google.com/..."
                className={inputCls}
              />
            </FieldGroup>
            <div className="pt-1 space-y-3">
              <label className="block text-sm font-medium text-gray-700">Social & web links (optional)</label>
              <input value={form.website}   onChange={(e) => set("website", e.target.value)}   placeholder="Website"   className={inputCls} />
              <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="Instagram" className={inputCls} />
              <input value={form.facebook}  onChange={(e) => set("facebook", e.target.value)}  placeholder="Facebook"  className={inputCls} />
            </div>
          </div>
        )}

        {/* Step 3 — Capacity */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Capacity & reservations</h2>
              <p className="text-sm text-gray-400 mt-1">Configure seating and reservation settings.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Max guests">
                <input
                  type="number"
                  min={1}
                  value={form.maxGuests}
                  onChange={(e) => set("maxGuests", parseInt(e.target.value) || 1)}
                  className={inputCls}
                />
              </FieldGroup>
              <FieldGroup label="Number of tables">
                <input
                  type="number"
                  min={1}
                  value={form.tables}
                  onChange={(e) => set("tables", parseInt(e.target.value) || 1)}
                  className={inputCls}
                />
              </FieldGroup>
            </div>
            <label className="flex items-start gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
              <input
                type="checkbox"
                checked={form.reservationsEnabled}
                onChange={(e) => set("reservationsEnabled", e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Enable reservations</p>
                <p className="text-xs text-gray-400 mt-0.5">Allow guests to book a table through Guidni.</p>
              </div>
            </label>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Review & publish</h2>
              <p className="text-sm text-gray-400 mt-1">Check everything before creating your restaurant.</p>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
              {[
                ["Destination",  selectedDestLabel || "—"],
                ["Type",         typeLabel[form.type]],
                ["Name",         form.name],
                ["Description",  form.description.slice(0, 100) + (form.description.length > 100 ? "…" : "")],
                ["Country",      form.country],
                ["City",         form.city],
                ["Address",      form.address || "—"],
                ["Categories",   form.category.join(", ") || "—"],
                ["Meals",        form.meals.join(", ") || "—"],
                ["Food types",   form.foodTypes.join(", ") || "—"],
                ["Diet options", form.dietTypes.join(", ") || "—"],
                ["Features",     form.attributes.join(", ") || "—"],
                ["Max guests",   String(form.maxGuests)],
                ["Tables",       String(form.tables)],
                ["Reservations", form.reservationsEnabled ? "Enabled" : "Disabled"],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 px-4 py-3">
                  <span className="text-xs font-semibold text-gray-500 w-28 shrink-0">{label}</span>
                  <span className="text-sm text-gray-800 break-words">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              You can add photos and menu items from the edit page after creating.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className={`flex pt-2 ${step === 0 ? "justify-end" : "justify-between"}`}>
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:border-gray-400 transition-colors"
            >
              <FiChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 text-sm bg-primary text-white rounded-xl px-5 py-2 hover:bg-primary/90 transition-colors font-medium"
            >
              Next <FiChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={handleSubmit}
              className="flex items-center gap-2 text-sm bg-primary text-white rounded-xl px-6 py-2 hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              <FiCheck className="h-4 w-4" />
              {pending ? "Creating…" : "Create restaurant"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
