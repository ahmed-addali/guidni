import { TbCar } from "react-icons/tb";
import { FiUsers } from "react-icons/fi";
import { Tag, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  type: string;
  capacity: number;
  brand?: string | null;
  model?: string | null;
  transmission?: string | null;
  labels: {
    type: string;
    seats: string;
    vehicle: string;
    transmission: string;
    typeLabels: Record<string, string>;
  };
};

export function RentalQuickFacts({ type, capacity, brand, model, transmission, labels }: Props) {
  const vehicleLabel = [brand, model].filter(Boolean).join(" ");

  const blocks: { icon: React.ReactNode; label: string; value: string }[] = [
    {
      icon:  <Tag className="h-5 w-5 text-primary" />,
      label: labels.type,
      value: labels.typeLabels[type] ?? type,
    },
    {
      icon:  <FiUsers className="h-5 w-5 text-gray-400" />,
      label: labels.seats,
      value: String(capacity),
    },
    ...(vehicleLabel ? [{
      icon:  <TbCar className="h-5 w-5 text-gray-400" />,
      label: labels.vehicle,
      value: vehicleLabel,
    }] : []),
    ...(transmission ? [{
      icon:  <Settings2 className="h-5 w-5 text-gray-400" />,
      label: labels.transmission,
      value: transmission,
    }] : []),
  ];

  return (
    <div className="flex flex-wrap gap-0">
      {blocks.map((block, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-3 pr-6 mr-6 py-1",
            i < blocks.length - 1 && "border-r border-gray-200"
          )}
        >
          {block.icon}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-1">
              {block.label}
            </p>
            <p className="text-sm font-semibold text-gray-900 leading-none">{block.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
