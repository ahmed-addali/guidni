import { Clock, Users, Globe, Tag } from "lucide-react";
import { getCategoryLabel } from "@/lib/utils/activity-categories";
import { cn } from "@/lib/utils";

type Props = {
  category: string;
  duration?: string | null;
  capacity: number;
  guide?: string | null;
  locale: string;
  labels: {
    maxGroup: string;
    languages: string;
    category: string;
    duration: string;
    groupSize: string;
  };
};

type StatBlock = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

export function ActivityQuickFacts({ category, duration, capacity, guide, locale, labels }: Props) {
  const categoryLabel = getCategoryLabel(category, locale);
  const langs = guide ? guide.split(",").map((l) => l.trim()).join(", ") : null;

  const blocks: StatBlock[] = [
    {
      icon:  <Tag className="h-5 w-5 text-primary" />,
      label: labels.category,
      value: categoryLabel,
    },
    ...(duration ? [{
      icon:  <Clock className="h-5 w-5 text-gray-400" />,
      label: labels.duration,
      value: duration,
    }] : []),
    {
      icon:  <Users className="h-5 w-5 text-gray-400" />,
      label: labels.groupSize,
      value: labels.maxGroup,
    },
    ...(langs ? [{
      icon:  <Globe className="h-5 w-5 text-gray-400" />,
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
            <p className="text-sm font-semibold text-gray-900 leading-none">
              {block.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
