import { Check, Wifi, Car, Utensils, Waves, Star, Trees, Columns2 } from "lucide-react";

type StayData = {
  cancelationPolicy: string;
  hasPool: boolean;
  hasWifi: boolean;
  hasParking: boolean;
  hasKitchen: boolean;
  hasGarden: boolean;
  hasBalcony: boolean;
  averageRating?: number | null;
};

type Props = {
  stay: StayData;
  labels: {
    freeCancel: string;
    pool: string;
    wifi: string;
    parking: string;
    kitchen: string;
    garden: string;
    balcony: string;
    topRated: string;
  };
};

export function StayHighlights({ stay, labels }: Props) {
  type Highlight = { icon: React.ReactNode; label: string };
  const highlights: Highlight[] = [];

  if (stay.cancelationPolicy?.toLowerCase() === "flexible") {
    highlights.push({ icon: <Check className="h-4 w-4 text-green-600" />, label: labels.freeCancel });
  }
  if (stay.averageRating && stay.averageRating >= 4.5) {
    highlights.push({ icon: <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />, label: labels.topRated });
  }
  if (stay.hasPool) {
    highlights.push({ icon: <Waves className="h-4 w-4 text-primary" />, label: labels.pool });
  }
  if (stay.hasWifi) {
    highlights.push({ icon: <Wifi className="h-4 w-4 text-primary" />, label: labels.wifi });
  }
  if (stay.hasKitchen) {
    highlights.push({ icon: <Utensils className="h-4 w-4 text-primary" />, label: labels.kitchen });
  }
  if (stay.hasParking) {
    highlights.push({ icon: <Car className="h-4 w-4 text-primary" />, label: labels.parking });
  }
  if (stay.hasGarden) {
    highlights.push({ icon: <Trees className="h-4 w-4 text-primary" />, label: labels.garden });
  }
  if (stay.hasBalcony) {
    highlights.push({ icon: <Columns2 className="h-4 w-4 text-primary" />, label: labels.balcony });
  }

  if (highlights.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {highlights.map((h, i) => (
        <div
          key={i}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5"
        >
          {h.icon}
          {h.label}
        </div>
      ))}
    </div>
  );
}
