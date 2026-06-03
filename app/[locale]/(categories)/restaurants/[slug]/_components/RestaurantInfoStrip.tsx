import { IoRestaurant } from "react-icons/io5";
import {
  Utensils, Leaf, Tag, Heart, Coffee, VolumeX, Music2, Waves, Mountain,
  Building2, Sun, Users, Baby, Tv, Wifi, Wind, Car, Lock, Gamepad2,
} from "lucide-react";

const ATTRIBUTE_ICONS: Record<string, React.ReactNode> = {
  romantic:       <Heart className="h-3.5 w-3.5" />,
  cosy:           <Coffee className="h-3.5 w-3.5" />,
  quiet:          <VolumeX className="h-3.5 w-3.5" />,
  live_music:     <Music2 className="h-3.5 w-3.5" />,
  sea_view:       <Waves className="h-3.5 w-3.5" />,
  panoramic_view: <Mountain className="h-3.5 w-3.5" />,
  rooftop:        <Building2 className="h-3.5 w-3.5" />,
  terrace:        <Sun className="h-3.5 w-3.5" />,
  family_friendly: <Users className="h-3.5 w-3.5" />,
  children_menu:  <Utensils className="h-3.5 w-3.5" />,
  baby_space:     <Baby className="h-3.5 w-3.5" />,
  board_games:    <Gamepad2 className="h-3.5 w-3.5" />,
  sports_screen:  <Tv className="h-3.5 w-3.5" />,
  wifi:           <Wifi className="h-3.5 w-3.5" />,
  air_conditioned: <Wind className="h-3.5 w-3.5" />,
  parking:        <Car className="h-3.5 w-3.5" />,
  pet_friendly:   <Heart className="h-3.5 w-3.5" />,
  private_dining: <Lock className="h-3.5 w-3.5" />,
};

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
  attributes.forEach((a) => chips.push({
    icon: ATTRIBUTE_ICONS[a] ?? <Tag className="h-3.5 w-3.5" />,
    label: a,
  }));

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
