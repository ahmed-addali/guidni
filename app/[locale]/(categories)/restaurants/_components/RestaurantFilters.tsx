"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, X, Trash2, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiSelect } from "@/components/ui/multi-select";
import { RESTAURANT_CUISINES, FOOD_TYPES, DIET_TYPES, RESTAURANT_ATTRIBUTES } from "@/lib/utils/restaurant-cuisines";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function RestaurantFilterSheet() {
  const t            = useTranslations("RestaurantsPage");
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const MEAL_OPTIONS = [
    { value: "Breakfast", label: t("filter.mealBreakfast") },
    { value: "Brunch",    label: t("filter.mealBrunch") },
    { value: "Lunch",     label: t("filter.mealLunch") },
    { value: "Dinner",    label: t("filter.mealDinner") },
    { value: "Snacks",    label: t("filter.mealSnacks") },
  ];

  const TYPE_OPTIONS = [
    { value: "RESTAURANT", label: t("filter.typeRestaurants") },
    { value: "CAFEE_SHOP", label: t("filter.typeCafes") },
  ] as const;

  const translatedCuisines   = RESTAURANT_CUISINES.map((c)  => ({ value: c.value,  label: t(`cuisines.${c.value}`)   }));
  const translatedFoodTypes  = FOOD_TYPES.map((ft)          => ({ value: ft.value, label: t(`foodTypes.${ft.value}`) }));
  const translatedDietTypes  = DIET_TYPES.map((dt)          => ({ value: dt.value, label: t(`dietTypes.${dt.value}`) }));
  const translatedAttributes = RESTAURANT_ATTRIBUTES.map((a) => ({ value: a.value, label: t(`attributes.${a.value}`) }));

  const multiSelectI18n = {
    searchPlaceholder: t("filter.search"),
    noResultsText:     t("filter.noResults"),
    selectAllText:     t("filter.selectAll"),
    clearText:         t("filter.clear"),
    closeText:         t("filter.close"),
  };

  const cuisineParam      = searchParams.get("cuisine")     ?? "";
  const mealParam         = searchParams.get("meal")        ?? "";
  const typeParam         = searchParams.get("type")        ?? "";
  const foodTypeParam     = searchParams.get("foodType")    ?? "";
  const dietParam         = searchParams.get("diet")        ?? "";
  const attributeParam    = searchParams.get("attributes")  ?? "";
  const activeReservation = searchParams.get("reservation") === "true";

  const selectedCuisines   = cuisineParam   ? cuisineParam.split(",").filter(Boolean)   : [];
  const selectedMeals      = mealParam      ? mealParam.split(",").filter(Boolean)      : [];
  const selectedTypes      = typeParam      ? typeParam.split(",").filter(Boolean)      : [];
  const selectedFoodTypes  = foodTypeParam  ? foodTypeParam.split(",").filter(Boolean)  : [];
  const selectedDiets      = dietParam      ? dietParam.split(",").filter(Boolean)      : [];
  const selectedAttributes = attributeParam ? attributeParam.split(",").filter(Boolean) : [];

  const activeCount =
    selectedCuisines.length +
    selectedMeals.length +
    selectedTypes.length +
    selectedFoodTypes.length +
    selectedDiets.length +
    selectedAttributes.length +
    (activeReservation ? 1 : 0);

  function navigate(patches: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(patches)) {
      if (val) params.set(key, val);
      else params.delete(key);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleCuisineChange(values: string[])  { navigate({ cuisine:    values.join(",") }); }
  function handleMealChange(values: string[])      { navigate({ meal:       values.join(",") }); }
  function handleFoodTypeChange(values: string[])  { navigate({ foodType:   values.join(",") }); }
  function handleDietChange(values: string[])      { navigate({ diet:       values.join(",") }); }
  function handleAttributeChange(values: string[]) { navigate({ attributes: values.join(",") }); }

  function toggleType(value: string) {
    const next = selectedTypes.includes(value)
      ? selectedTypes.filter((v) => v !== value)
      : [...selectedTypes, value];
    navigate({ type: next.join(",") });
  }

  return (
    <Sheet>
      <SheetTrigger
        className={cn(
          "flex items-center gap-2 h-11 px-4 rounded-xl border text-sm font-medium transition-all shrink-0 cursor-pointer whitespace-nowrap",
          activeCount > 0
            ? "border-primary bg-primary/10 text-primary"
            : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 shadow-sm"
        )}
      >
        <SlidersHorizontal className="w-4 h-4" />
        {activeCount > 0
          ? `${t("filtersLabel")} · ${activeCount}`
          : t("filtersLabel")}
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-safe max-h-[85vh]">
        <SheetHeader className="px-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold text-gray-900">
              {t("filtersLabel")}
            </SheetTitle>
            {activeCount > 0 && (
              <button
                onClick={() => router.push(pathname)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                {t("filter.clearAll")}
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="overflow-y-auto p-5 pb-8 space-y-5">

          {/* Cuisine */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t("filter.cuisinePlaceholder")}
            </p>
            <MultiSelect
              options={translatedCuisines}
              defaultValue={selectedCuisines}
              onValueChange={handleCuisineChange}
              placeholder={t("filter.cuisinePlaceholder")}
              maxCount={3}
              {...multiSelectI18n}
            />
          </div>

          {/* Meal */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t("filter.mealPlaceholder")}
            </p>
            <div className="flex flex-wrap gap-2">
              {MEAL_OPTIONS.map((opt) => {
                const active = selectedMeals.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleMealChange(
                      active
                        ? selectedMeals.filter((v) => v !== opt.value)
                        : [...selectedMeals, opt.value]
                    )}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer",
                      active
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Food Type */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t("filter.foodTypePlaceholder")}
            </p>
            <MultiSelect
              options={translatedFoodTypes}
              defaultValue={selectedFoodTypes}
              onValueChange={handleFoodTypeChange}
              placeholder={t("filter.foodTypePlaceholder")}
              maxCount={3}
              {...multiSelectI18n}
            />
          </div>

          {/* Diet */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t("filter.dietPlaceholder")}
            </p>
            <MultiSelect
              options={translatedDietTypes}
              defaultValue={selectedDiets}
              onValueChange={handleDietChange}
              placeholder={t("filter.dietPlaceholder")}
              maxCount={3}
              {...multiSelectI18n}
            />
          </div>

          {/* Attributes */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t("filter.attributesPlaceholder")}
            </p>
            <MultiSelect
              options={translatedAttributes}
              defaultValue={selectedAttributes}
              onValueChange={handleAttributeChange}
              placeholder={t("filter.attributesPlaceholder")}
              maxCount={3}
              {...multiSelectI18n}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t("filter.typePlaceholder")}
            </p>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const active = selectedTypes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleType(opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer",
                      active
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reservation */}
          <div>
            <button
              onClick={() => navigate({ reservation: activeReservation ? "" : "true" })}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer",
                activeReservation
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              {activeReservation && <Check className="w-3.5 h-3.5 shrink-0" />}
              {t("filter.reservation")}
            </button>
          </div>

          {/* Active chips */}
          {activeCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {selectedCuisines.map((c) => {
                const label = translatedCuisines.find((x) => x.value.toLowerCase() === c.toLowerCase())?.label ?? c;
                return <ActiveChip key={c} label={label} onRemove={() => handleCuisineChange(selectedCuisines.filter((v) => v !== c))} />;
              })}
              {selectedMeals.map((m) => (
                <ActiveChip key={m} label={m} onRemove={() => handleMealChange(selectedMeals.filter((v) => v !== m))} />
              ))}
              {selectedFoodTypes.map((ft) => {
                const label = translatedFoodTypes.find((x) => x.value === ft)?.label ?? ft;
                return <ActiveChip key={ft} label={label} onRemove={() => handleFoodTypeChange(selectedFoodTypes.filter((v) => v !== ft))} />;
              })}
              {selectedDiets.map((d) => {
                const label = translatedDietTypes.find((x) => x.value === d)?.label ?? d;
                return <ActiveChip key={d} label={label} onRemove={() => handleDietChange(selectedDiets.filter((v) => v !== d))} />;
              })}
              {selectedAttributes.map((a) => {
                const label = translatedAttributes.find((x) => x.value === a)?.label ?? a;
                return <ActiveChip key={a} label={label} onRemove={() => handleAttributeChange(selectedAttributes.filter((v) => v !== a))} />;
              })}
              {selectedTypes.map((tv) => (
                <ActiveChip
                  key={tv}
                  label={tv === "CAFEE_SHOP" ? t("filter.typeCafes") : t("filter.typeRestaurants")}
                  onRemove={() => toggleType(tv)}
                />
              ))}
              {activeReservation && (
                <ActiveChip label={t("filter.reservation")} onRemove={() => navigate({ reservation: "" })} />
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors cursor-pointer"
    >
      {label}
      <X className="w-3 h-3" />
    </button>
  );
}
