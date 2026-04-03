import { TbRoute } from "react-icons/tb";
import { FiUsers, FiGlobe } from "react-icons/fi";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  type: string;
  capacity: number;
  vehicleType?: string | null;
  languages?: string | null;
  labels: {
    type: string;
    capacity: string;
    vehicleType: string;
    languages: string;
    typeLabels: Record<string, string>;
  };
};

export function TransferQuickFacts({ type, capacity, vehicleType, languages, labels }: Props) {
  const langs = languages ? languages.split(",").map((l) => l.trim()).join(", ") : null;

  const blocks: { icon: React.ReactNode; label: string; value: string }[] = [
    {
      icon:  <TbRoute className="h-5 w-5 text-primary" />,
      label: labels.type,
      value: labels.typeLabels[type] ?? type,
    },
    {
      icon:  <FiUsers className="h-5 w-5 text-gray-400" />,
      label: labels.capacity,
      value: String(capacity),
    },
    ...(vehicleType ? [{
      icon:  <Car className="h-5 w-5 text-gray-400" />,
      label: labels.vehicleType,
      value: vehicleType,
    }] : []),
    ...(langs ? [{
      icon:  <FiGlobe className="h-5 w-5 text-gray-400" />,
      label: labels.languages,
      value: langs,
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
