import { MdPeople, MdBathtub, MdOutlineBedroomParent } from "react-icons/md";
import { FaBed } from "react-icons/fa6";

interface StayDetailsGridProps {
  guestCount: number;
  bedroomCount: number;
  bedCount: number;
  bathroomCount: number;
  labels: {
    guests: string;
    bedrooms: string;
    beds: string;
    bathrooms: string;
  };
}

const ITEMS = [
  { icon: MdPeople,               key: "guestCount",    labelKey: "guests"   },
  { icon: MdOutlineBedroomParent, key: "bedroomCount",  labelKey: "bedrooms" },
  { icon: FaBed,                  key: "bedCount",      labelKey: "beds"     },
  { icon: MdBathtub,              key: "bathroomCount", labelKey: "bathrooms"},
] as const;

export function StayDetailsGrid({
  guestCount,
  bedroomCount,
  bedCount,
  bathroomCount,
  labels,
}: StayDetailsGridProps) {
  const values = { guestCount, bedroomCount, bedCount, bathroomCount };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ITEMS.map(({ icon: Icon, key, labelKey }) => (
        <div
          key={key}
          className="flex flex-col items-center text-center bg-gray-50 border border-gray-100 rounded-2xl p-4"
        >
          <Icon className="h-6 w-6 text-primary mb-2" />
          <span className="text-xl font-bold text-gray-900">{values[key]}</span>
          <span className="text-xs text-gray-500 mt-0.5">{labels[labelKey]}</span>
        </div>
      ))}
    </div>
  );
}
