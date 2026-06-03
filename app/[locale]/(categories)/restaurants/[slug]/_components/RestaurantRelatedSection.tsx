import { RestaurantCard, type RestaurantCardLabels } from "@/components/restaurants/RestaurantCard";
import type { RestaurantListItem } from "@/lib/actions/restaurants";

type Props = {
  restaurants: RestaurantListItem[];
  locale: string;
  label: string;
  cardLabels?: RestaurantCardLabels;
};

export function RestaurantRelatedSection({ restaurants, locale, label, cardLabels }: Props) {
  if (restaurants.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">{label}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.map((r) => (
          <RestaurantCard key={r.id} restaurant={r} locale={locale} cardLabels={cardLabels} />
        ))}
      </div>
    </div>
  );
}
