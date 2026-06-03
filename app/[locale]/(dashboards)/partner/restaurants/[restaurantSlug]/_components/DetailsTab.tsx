"use client";

import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { FiAlertTriangle } from "react-icons/fi";
import { PhoneInput } from "@/components/shared/PhoneInput";
import { CounterInput } from "@/components/shared/CounterInput";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { updateRestaurant } from "@/lib/actions/partner-restaurants";
import { RESTAURANT_CUISINES, FOOD_TYPES, DIET_TYPES, RESTAURANT_ATTRIBUTES, ATTRIBUTE_GROUPS } from "@/lib/utils/restaurant-cuisines";

const MEAL_KEYS = ["Breakfast", "Lunch", "Dinner", "Brunch", "All day"] as const;

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
  destinationId:       string | null;
};

type Destination = { id: string; city: string; country: string; region?: string | null };

const inputCls    = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const inputErrCls = "w-full border border-red-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400";

export function DetailsTab({ restaurant, destinations = [] }: { restaurant: RestaurantDetails; destinations?: Destination[] }) {
  const t = useTranslations("PartnerDashboard.editRestaurant.details");
  const [pending, start]   = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const splitToArray = (val: string | null) =>
    val ? val.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const buildSnapshot = () => ({
    name:                restaurant.name,
    arabicName:          restaurant.arabicName          ?? "",
    description:         restaurant.description,
    arabicDescription:   restaurant.arabicDescription   ?? "",
    phone:               restaurant.phone               ?? "",
    type:                restaurant.type as "RESTAURANT" | "CAFEE_SHOP" | "BOTH",
    category:            splitToArray(restaurant.category),
    meals:               splitToArray(restaurant.meals),
    foodTypes:           [...restaurant.foodTypes],
    dietTypes:           [...restaurant.dietTypes],
    attributes:          [...restaurant.attributes],
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
    destinationId:       restaurant.destinationId       ?? "",
  });

  const [initial, setInitial] = useState(buildSnapshot);
  const [form,    setForm]    = useState(initial);

  const RESTAURANT_TYPES = [
    { value: "RESTAURANT" as const,  label: t("typeOptions.RESTAURANT") },
    { value: "CAFEE_SHOP" as const,  label: t("typeOptions.CAFEE_SHOP") },
    { value: "BOTH"       as const,  label: t("typeOptions.BOTH") },
  ];

  const isDirty = useMemo(() => (
    form.name                !== initial.name                ||
    form.arabicName          !== initial.arabicName          ||
    form.description         !== initial.description         ||
    form.arabicDescription   !== initial.arabicDescription   ||
    form.phone               !== initial.phone               ||
    form.type                !== initial.type                ||
    form.country             !== initial.country             ||
    form.city                !== initial.city                ||
    form.address             !== initial.address             ||
    form.location            !== initial.location            ||
    form.website             !== initial.website             ||
    form.instagram           !== initial.instagram           ||
    form.facebook            !== initial.facebook            ||
    form.reservationsEnabled !== initial.reservationsEnabled ||
    form.maxGuests           !== initial.maxGuests           ||
    form.tables              !== initial.tables              ||
    form.destinationId           !== initial.destinationId           ||
    JSON.stringify(form.category)   !== JSON.stringify(initial.category)   ||
    JSON.stringify(form.meals)      !== JSON.stringify(initial.meals)      ||
    JSON.stringify(form.foodTypes)  !== JSON.stringify(initial.foodTypes)  ||
    JSON.stringify(form.dietTypes)  !== JSON.stringify(initial.dietTypes)  ||
    JSON.stringify(form.attributes) !== JSON.stringify(initial.attributes)
  ), [form, initial]);

  function toggleArr(key: "category" | "meals" | "foodTypes" | "dietTypes" | "attributes", val: string) {
    setForm((p) => {
      const arr = p[key] as string[];
      return { ...p, [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
  }

  const clearErr = (key: string) =>
    setErrors((p) => { const next = { ...p }; delete next[key]; return next; });

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim())                  errs.name        = t("nameRequired");
    else if (form.name.trim().length < 2)   errs.name        = t("nameMin");
    if (!form.description.trim())           errs.description = t("descriptionRequired");
    else if (form.description.trim().length < 10) errs.description = t("descriptionMin");
    if (!form.country.trim())               errs.country     = t("countryRequired");
    if (!form.city.trim())                  errs.city        = t("cityRequired");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function doSave() {
    if (!validate()) return;
    start(async () => {
      const payload = {
        ...form,
        category:      form.category.join(",") || undefined,
        meals:         form.meals.join(",")    || undefined,
        foodTypes:     form.foodTypes,
        dietTypes:     form.dietTypes,
        attributes:    form.attributes,
        maxGuests:     form.maxGuests || null,
        tables:        form.tables    || null,
        destinationId: form.destinationId || null,
        featuredInHome: false,
      };
      const res = await updateRestaurant(restaurant.id, payload);
      if (res.success) {
        toast.success(t("updateSuccess"));
        setInitial({ ...form });
        setErrors({});
      } else {
        toast.error(res.error ?? t("updateFailed"));
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSave();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Unsaved changes banner */}
      {isDirty && (
        <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-amber-700">
            <FiAlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">{t("unsavedBanner")}</span>
          </div>
          <button
            type="button"
            onClick={doSave}
            disabled={pending}
            className="text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors disabled:opacity-50"
          >
            {t("saveNow")}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("nameLabel")}</label>
          <input
            value={form.name}
            onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); clearErr("name"); }}
            className={errors.name ? inputErrCls : inputCls}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("arabicNameLabel")}</label>
          <input value={form.arabicName} onChange={(e) => setForm((p) => ({ ...p, arabicName: e.target.value }))} dir="rtl" className={inputCls} />
        </div>

        {/* Description */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("descriptionLabel")}</label>
          <textarea
            value={form.description}
            onChange={(e) => { setForm((p) => ({ ...p, description: e.target.value })); clearErr("description"); }}
            rows={4}
            className={`${errors.description ? inputErrCls : inputCls} resize-none`}
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("arabicDescriptionLabel")}</label>
          <textarea value={form.arabicDescription} onChange={(e) => setForm((p) => ({ ...p, arabicDescription: e.target.value }))} rows={3} dir="rtl" className={`${inputCls} resize-none`} />
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("typeLabel")}</label>
          <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: (v ?? p.type) as typeof p.type }))}>
            <SelectTrigger>
              <span className={form.type ? "text-gray-800" : "text-gray-400"}>
                {RESTAURANT_TYPES.find((rt) => rt.value === form.type)?.label ?? ""}
              </span>
            </SelectTrigger>
            <SelectContent>
              {RESTAURANT_TYPES.map((rt) => (
                <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("phoneLabel")}</label>
          <PhoneInput
            value={form.phone}
            onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
          />
        </div>

        {/* Categories — only for RESTAURANT / BOTH */}
        {form.type !== "CAFEE_SHOP" && (
          <>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700">{t("cuisineLabel")}</label>
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
              <label className="text-sm font-medium text-gray-700">{t("mealsLabel")}</label>
              <div className="flex flex-wrap gap-2">
                {MEAL_KEYS.map((m) => (
                  <button key={m} type="button" onClick={() => toggleArr("meals", m)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      form.meals.includes(m)
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}>
                    {form.meals.includes(m) && "✓ "}{t(`meals.${m}` as any)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Food Types */}
        <div className="sm:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-700">{t("foodTypesLabel")}</label>
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
          <label className="text-sm font-medium text-gray-700">{t("dietaryLabel")}</label>
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
          <label className="text-sm font-medium text-gray-700">{t("attributesLabel")}</label>
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

        {/* Destination */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("destinationLabel")}</label>
          <Select
            value={form.destinationId}
            onValueChange={(id) => {
              const safeId = id ?? "";
              const dest   = destinations.find((d) => d.id === safeId);
              setForm((p) => ({
                ...p,
                destinationId: safeId,
                country:       dest?.country ?? p.country,
                city:          dest?.city    ?? p.city,
              }));
            }}
          >
            <SelectTrigger>
              {(() => {
                const dest = destinations.find((d) => d.id === form.destinationId);
                return (
                  <span className={dest ? "text-gray-800" : "text-gray-400"}>
                    {dest ? `${dest.city}, ${dest.country}` : t("destinationPlaceholder")}
                  </span>
                );
              })()}
            </SelectTrigger>
            <SelectContent>
              {destinations.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.city}, {d.country}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {form.destinationId && (
            <div className="flex flex-wrap items-center gap-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100 mt-2">
              <span className="text-xs text-gray-400 font-medium w-full mb-0.5">{t("locationDetails")}</span>
              {[
                { label: t("countryLabel"), value: form.country },
                { label: t("cityLabel"),    value: form.city    },
              ].filter((f) => f.value).map((f) => (
                <span key={f.label} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700">
                  <span className="text-gray-400">{f.label}:</span> {f.value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Location — only shown when no destination is linked */}
        {!form.destinationId && (
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("countryLabel")}</label>
              <input
                value={form.country}
                onChange={(e) => { setForm((p) => ({ ...p, country: e.target.value })); clearErr("country"); }}
                className={errors.country ? inputErrCls : inputCls}
              />
              {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{t("cityLabel")}</label>
              <input
                value={form.city}
                onChange={(e) => { setForm((p) => ({ ...p, city: e.target.value })); clearErr("city"); }}
                className={errors.city ? inputErrCls : inputCls}
              />
              {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
            </div>
          </>
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("addressLabel")}</label>
          <input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("mapsLabel")}</label>
          <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className={inputCls} />
        </div>

        {/* Social */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("websiteLabel")}</label>
          <input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("instagramLabel")}</label>
          <input value={form.instagram} onChange={(e) => setForm((p) => ({ ...p, instagram: e.target.value }))} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("facebookLabel")}</label>
          <input value={form.facebook} onChange={(e) => setForm((p) => ({ ...p, facebook: e.target.value }))} className={inputCls} />
        </div>

        {/* Capacity */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("maxGuestsLabel")}</label>
          <CounterInput value={form.maxGuests} onChange={(v) => setForm((p) => ({ ...p, maxGuests: v }))} min={1} max={500} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">{t("tablesLabel")}</label>
          <CounterInput value={form.tables} onChange={(v) => setForm((p) => ({ ...p, tables: v }))} min={1} max={500} />
        </div>

        {/* Reservations toggle */}
        <div className="sm:col-span-2">
          <div className="flex items-start justify-between gap-4 p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-700">{t("reservationsLabel")}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t("reservationsHint")}</p>
            </div>
            <Switch
              checked={form.reservationsEnabled}
              onCheckedChange={(v) => setForm((p) => ({ ...p, reservationsEnabled: v }))}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending || !isDirty}
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? t("saving") : t("saveChanges")}
        </button>
      </div>
    </form>
  );
}
