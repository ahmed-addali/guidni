import { IoRestaurant } from "react-icons/io5";
import { Utensils, Leaf, Tag } from "lucide-react";

type Props = {
  type: string;
  category: string | null;
  meals: string | null;
  foodTypes: string[];
  dietTypes: string[];
  attributes: string[];
  typeLabel: string;
};

export function RestaurantInfoStrip({
  typeLabel,
  category,
  meals,
  foodTypes,
  dietTypes,
  attributes,
}: Props) {
  const chips: { icon: React.ReactNode; label: string }[] = [];

  if (category) chips.push({ icon: <IoRestaurant className="h-3.5 w-3.5" />, label: category });
  if (meals) chips.push({ icon: <Utensils className="h-3.5 w-3.5" />, label: meals });
  foodTypes.forEach((f) => chips.push({ icon: <Tag className="h-3.5 w-3.5" />, label: f }));
  dietTypes.forEach((d) => chips.push({ icon: <Leaf className="h-3.5 w-3.5" />, label: d }));
  attributes.forEach((a) => chips.push({ icon: <Tag className="h-3.5 w-3.5" />, label: a }));

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
        <IoRestaurant className="h-3.5 w-3.5" />
        {typeLabel}
      </span>
      {chips.map((chip, i) => (
        <span
          key={i}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100"
        >
          {chip.icon}
          {chip.label}
        </span>
      ))}
    </div>
  );
}
