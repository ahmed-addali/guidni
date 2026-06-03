"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { FiCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { PhoneInput } from "@/components/shared/PhoneInput";
import { CounterInput } from "@/components/shared/CounterInput";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { createRestaurant } from "@/lib/actions/partner-restaurants";
import { RESTAURANT_CUISINES, FOOD_TYPES, DIET_TYPES, RESTAURANT_ATTRIBUTES, ATTRIBUTE_GROUPS } from "@/lib/utils/restaurant-cuisines";

const MEAL_KEYS = ["Breakfast", "Lunch", "Dinner", "Brunch", "All day"] as const;

type Step = 0 | 1 | 2 | 3 | 4;

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

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

function StepProgress({ current, steps }: { current: Step; steps: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
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
            {i < steps.length - 1 && (
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
  const t = useTranslations("PartnerDashboard.newRestaurant.wizard");
  const tDetails = useTranslations("PartnerDashboard.editRestaurant.details");

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

  const STEPS = [
    t("steps.type"),
    t("steps.details"),
    t("steps.location"),
    t("steps.capacity"),
    t("steps.review"),
  ];

  const TYPE_OPTIONS = [
    { value: "RESTAURANT" as const, label: t("step0.typeOptions.RESTAURANT.label"), desc: t("step0.typeOptions.RESTAURANT.desc") },
    { value: "CAFEE_SHOP" as const, label: t("step0.typeOptions.CAFEE_SHOP.label"), desc: t("step0.typeOptions.CAFEE_SHOP.desc") },
    { value: "BOTH"       as const, label: t("step0.typeOptions.BOTH.label"),       desc: t("step0.typeOptions.BOTH.desc") },
  ];

  const typeLabel: Record<string, string> = {
    RESTAURANT: t("step0.typeOptions.RESTAURANT.label"),
    CAFEE_SHOP: t("step0.typeOptions.CAFEE_SHOP.label"),
    BOTH:       t("step0.typeOptions.BOTH.label"),
  };

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
    if (step === 0 && !form.type) e.type = t("step0.errorRequired");
    if (step === 1) {
      if (!form.name.trim())               e.name        = t("step1.nameRequired");
      if (form.name.trim().length < 2)     e.name        = t("step1.nameMin");
      if (!form.description.trim())        e.description = t("step1.descriptionRequired");
      if (form.description.trim().length < 10) e.description = t("step1.descriptionMin");
    }
    if (step === 2) {
      if (!form.destinationId) e.destinationId = t("step2.destinationRequired");
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

  const selectedDestLabel = destinations.find((d) => d.id === form.destinationId)?.label ?? "—";

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
        toast.success(t("createSuccess"));
        router.push(`/${locale}/partner/restaurants`);
      } else {
        toast.error(res.error ?? t("createFailed"));
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepProgress current={step} steps={STEPS} />

      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-6">

        {/* Step 0 — Type */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("step0.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("step0.subheading")}</p>
            </div>
            <div className="space-y-3">
              {TYPE_OPTIONS.map(({ value, label, desc }) => (
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
              <h2 className="text-lg font-bold text-gray-900">{t("step1.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("step1.subheading")}</p>
            </div>
            <FieldGroup label={t("step1.nameLabel")} error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={t("step1.namePlaceholder")}
                className={inputCls}
              />
            </FieldGroup>
            <FieldGroup label={t("step1.descriptionLabel")} error={errors.description}>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                placeholder={t("step1.descriptionPlaceholder")}
                className={`${inputCls} resize-none`}
              />
            </FieldGroup>
            <FieldGroup label={t("step1.phoneLabel")}>
              <PhoneInput
                value={form.phone}
                onChange={(v) => set("phone", v)}
              />
            </FieldGroup>
            {form.type !== "CAFEE_SHOP" && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t("step1.cuisineLabel")}</label>
                  <div className="flex flex-wrap gap-2">
                    {RESTAURANT_CUISINES.map((c) => (
                      <button key={c.value} type="button" onClick={() => toggleArrayItem("category", c.value)}
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t("step1.mealsLabel")}</label>
                  <div className="flex flex-wrap gap-2">
                    {MEAL_KEYS.map((m) => (
                      <button key={m} type="button" onClick={() => toggleArrayItem("meals", m)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                          form.meals.includes(m)
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                        }`}>
                        {form.meals.includes(m) && "✓ "}{tDetails(`meals.${m}` as any)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t("step1.foodTypesLabel")}</label>
              <div className="flex flex-wrap gap-2">
                {FOOD_TYPES.map((ft) => (
                  <button key={ft.value} type="button" onClick={() => toggleArrayItem("foodTypes", ft.value)}
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t("step1.dietaryLabel")}</label>
              <div className="flex flex-wrap gap-2">
                {DIET_TYPES.map((dt) => (
                  <button key={dt.value} type="button" onClick={() => toggleArrayItem("dietTypes", dt.value)}
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
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">{t("step1.attributesLabel")}</label>
              {ATTRIBUTE_GROUPS.map((group) => {
                const groupItems = RESTAURANT_ATTRIBUTES.filter((a) =>
                  (group.values as readonly string[]).includes(a.value)
                );
                return (
                  <div key={group.label}>
                    <p className="text-xs text-gray-400 mb-1.5">{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {groupItems.map((a) => (
                        <button key={a.value} type="button" onClick={() => toggleArrayItem("attributes", a.value)}
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
          </div>
        )}

        {/* Step 2 — Location */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("step2.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("step2.subheading")}</p>
            </div>

            <FieldGroup label={t("step2.destinationLabel")} error={errors.destinationId}>
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
                <SelectTrigger className={errors.destinationId ? "border-red-400 ring-2 ring-red-200" : undefined}>
                  <span className={form.destinationId ? "text-gray-800" : "text-gray-400"}>
                    {destinations.find((d) => d.id === form.destinationId)?.label ?? t("step2.destinationPlaceholder")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">{t("step2.destinationHint")}</p>
            </FieldGroup>

            {form.destinationId && (
              <div className="flex flex-wrap items-center gap-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-400 font-medium w-full mb-0.5">{t("step2.locationDetails")}</span>
                {[
                  { label: t("step2.countryLabel"), value: form.country },
                  { label: t("step2.cityLabel"),    value: form.city    },
                ].filter((f) => f.value).map((f) => (
                  <span key={f.label} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700">
                    <span className="text-gray-400">{f.label}:</span> {f.value}
                  </span>
                ))}
              </div>
            )}
            <FieldGroup label={t("step2.addressLabel")}>
              <input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder={t("step2.addressPlaceholder")}
                className={inputCls}
              />
            </FieldGroup>
            <FieldGroup label={t("step2.mapsLabel")}>
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder={t("step2.mapsPlaceholder")}
                className={inputCls}
              />
            </FieldGroup>
            <div className="pt-1 space-y-3">
              <label className="block text-sm font-medium text-gray-700">{t("step2.socialLabel")}</label>
              <input value={form.website}   onChange={(e) => set("website", e.target.value)}   placeholder={t("step2.websitePlaceholder")}   className={inputCls} />
              <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder={t("step2.instagramPlaceholder")} className={inputCls} />
              <input value={form.facebook}  onChange={(e) => set("facebook", e.target.value)}  placeholder={t("step2.facebookPlaceholder")}  className={inputCls} />
            </div>
          </div>
        )}

        {/* Step 3 — Capacity */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("step3.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("step3.subheading")}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label={t("step3.maxGuestsLabel")}>
                <CounterInput
                  value={form.maxGuests}
                  onChange={(v) => set("maxGuests", v)}
                  min={1}
                  max={500}
                />
              </FieldGroup>
              <FieldGroup label={t("step3.tablesLabel")}>
                <CounterInput
                  value={form.tables}
                  onChange={(v) => set("tables", v)}
                  min={1}
                  max={500}
                />
              </FieldGroup>
            </div>
            <div className="flex items-start justify-between gap-4 p-4 border border-gray-200 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-700">{t("step3.reservationsLabel")}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t("step3.reservationsHint")}</p>
              </div>
              <Switch
                checked={form.reservationsEnabled}
                onCheckedChange={(v) => set("reservationsEnabled", v)}
              />
            </div>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("step4.heading")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("step4.subheading")}</p>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
              {[
                [t("step4.fieldDestination"),  selectedDestLabel],
                [t("step4.fieldType"),         typeLabel[form.type]],
                [t("step4.fieldName"),         form.name],
                [t("step4.fieldDescription"),  form.description.slice(0, 100) + (form.description.length > 100 ? "…" : "")],
                [t("step4.fieldCountry"),      form.country],
                [t("step4.fieldCity"),         form.city],
                [t("step4.fieldAddress"),      form.address || "—"],
                [t("step4.fieldCategories"),   form.category.join(", ") || "—"],
                [t("step4.fieldMeals"),        form.meals.join(", ") || "—"],
                [t("step4.fieldFoodTypes"),    form.foodTypes.join(", ") || "—"],
                [t("step4.fieldDiet"),         form.dietTypes.join(", ") || "—"],
                [t("step4.fieldFeatures"),     form.attributes.join(", ") || "—"],
                [t("step4.fieldMaxGuests"),    String(form.maxGuests)],
                [t("step4.fieldTables"),       String(form.tables)],
                [t("step4.fieldReservations"), form.reservationsEnabled ? t("step4.reservationsEnabled") : t("step4.reservationsDisabled")],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 px-4 py-3">
                  <span className="text-xs font-semibold text-gray-500 w-28 shrink-0">{label}</span>
                  <span className="text-sm text-gray-800 break-words">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              {t("step4.photosHint")}
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
              <FiChevronLeft className="h-4 w-4" /> {t("back")}
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 text-sm bg-primary text-white rounded-xl px-5 py-2 hover:bg-primary/90 transition-colors font-medium"
            >
              {t("next")} <FiChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={handleSubmit}
              className="flex items-center gap-2 text-sm bg-primary text-white rounded-xl px-6 py-2 hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              <FiCheck className="h-4 w-4" />
              {pending ? t("creating") : t("createRestaurant")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
