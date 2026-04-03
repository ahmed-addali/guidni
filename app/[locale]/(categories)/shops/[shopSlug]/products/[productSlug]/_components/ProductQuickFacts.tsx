import type { ElementType } from "react";
import { Package, Globe, Weight } from "lucide-react";

interface Props {
  material?: string | null;
  origin?:   string | null;
  weight?:   number | null;
  labels: {
    material: string;
    origin:   string;
    weight:   string;
  };
}

export function ProductQuickFacts({ material, origin, weight, labels }: Props) {
  const facts = [
    material && { icon: Package, label: labels.material, value: material },
    origin   && { icon: Globe,   label: labels.origin,   value: origin   },
    weight   && { icon: Weight,  label: labels.weight,   value: `${weight}g` },
  ].filter(Boolean) as { icon: ElementType; label: string; value: string }[];

  if (facts.length === 0) return null;

  return (
    <div className="flex flex-wrap divide-x divide-gray-100">
      {facts.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3 px-6 first:pl-0 last:border-r-0 py-2">
          <Icon className="h-5 w-5 text-gray-400 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
