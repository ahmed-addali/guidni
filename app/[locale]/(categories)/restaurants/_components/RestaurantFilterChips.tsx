"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { RESTAURANT_CUISINES, FOOD_TYPES, DIET_TYPES, RESTAURANT_ATTRIBUTES } from "@/lib/utils/restaurant-cuisines";
import { cn } from "@/lib/utils";

export function RestaurantFilterChips() {
  const t            = useTranslations("RestaurantsPage");
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const translatedCuisines   = RESTAURANT_CUISINES.map((c)  => ({ value: c.value,  label: t(`cuisines.${c.value}`)   }));
  const translatedFoodTypes  = FOOD_TYPES.map((ft)          => ({ value: ft.value, label: t(`foodTypes.${ft.value}`) }));
  const translatedDietTypes  = DIET_TYPES.map((dt)          => ({ value: dt.value, label: t(`dietTypes.${dt.value}`) }));
  const translatedAttributes = RESTAURANT_ATTRIBUTES.map((a) => ({ value: a.value, label: t(`attributes.${a.value}`) }));

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

  const totalCount =
    selectedCuisines.length + selectedMeals.length + selectedTypes.length +
    selectedFoodTypes.length + selectedDiets.length + selectedAttributes.length +
    (activeReservation ? 1 : 0);

  if (totalCount === 0) return null;

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedCuisines.map((c) => {
        const label = translatedCuisines.find((x) => x.value.toLowerCase() === c.toLowerCase())?.label ?? c;
        return (
          <Chip key={c} label={label} onRemove={() =>
            navigate({ cuisine: selectedCuisines.filter((v) => v !== c).join(",") })
          } />
        );
      })}
      {selectedMeals.map((m) => (
        <Chip key={m} label={m} onRemove={() =>
          navigate({ meal: selectedMeals.filter((v) => v !== m).join(",") })
        } />
      ))}
      {selectedFoodTypes.map((ft) => {
        const label = translatedFoodTypes.find((x) => x.value === ft)?.label ?? ft;
        return (
          <Chip key={ft} label={label} onRemove={() =>
            navigate({ foodType: selectedFoodTypes.filter((v) => v !== ft).join(",") })
          } />
        );
      })}
      {selectedDiets.map((d) => {
        const label = translatedDietTypes.find((x) => x.value === d)?.label ?? d;
        return (
          <Chip key={d} label={label} onRemove={() =>
            navigate({ diet: selectedDiets.filter((v) => v !== d).join(",") })
          } />
        );
      })}
      {selectedAttributes.map((a) => {
        const label = translatedAttributes.find((x) => x.value === a)?.label ?? a;
        return (
          <Chip key={a} label={label} onRemove={() =>
            navigate({ attributes: selectedAttributes.filter((v) => v !== a).join(",") })
          } />
        );
      })}
      {selectedTypes.map((tv) => (
        <Chip
          key={tv}
          label={tv === "CAFEE_SHOP" ? t("filter.typeCafes") : t("filter.typeRestaurants")}
          onRemove={() =>
            navigate({ type: selectedTypes.filter((v) => v !== tv).join(",") })
          }
        />
      ))}
      {activeReservation && (
        <Chip label={t("filter.reservation")} onRemove={() => navigate({ reservation: "" })} />
      )}
      {totalCount > 1 && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer underline-offset-2 hover:underline"
        >
          {t("filter.clearAll")}
        </button>
      )}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className={cn(
        "flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full text-xs font-medium",
        "bg-primary/10 text-primary border border-primary/20",
        "hover:bg-primary/15 transition-colors cursor-pointer"
      )}
    >
      {label}
      <X className="w-3 h-3 shrink-0" />
    </button>
  );
}
