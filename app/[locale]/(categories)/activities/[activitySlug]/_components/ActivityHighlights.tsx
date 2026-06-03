import { CheckCircle, CreditCard, Users, MapPin, Star } from "lucide-react";

type ActivityForHighlights = {
  cancelation?: boolean | null;
  paynow?: boolean | null;
  capacity: number;
  guide?: string | null;
  note?: string | null;
};

type Props = {
  activity: ActivityForHighlights;
  labels: {
    freeCancel: string;
    payLater: string;
    smallGroup: string;
    guided: string;
    topRated: string;
  };
};

export function ActivityHighlights({ activity, labels }: Props) {
  const chips: { icon: React.ReactNode; text: string }[] = [];

  if (activity.cancelation) {
    chips.push({ icon: <CheckCircle className="h-4 w-4 text-primary" />, text: labels.freeCancel });
  }
  if (activity.paynow === false) {
    chips.push({ icon: <CreditCard className="h-4 w-4 text-primary" />, text: labels.payLater });
  }
  if (activity.capacity <= 8) {
    chips.push({ icon: <Users className="h-4 w-4 text-primary" />, text: labels.smallGroup });
  }
  if (activity.guide) {
    chips.push({ icon: <MapPin className="h-4 w-4 text-primary" />, text: labels.guided });
  }
  if (activity.note && parseFloat(activity.note) >= 4.5) {
    chips.push({ icon: <Star className="h-4 w-4 text-primary" />, text: labels.topRated });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {chips.slice(0, 4).map((chip, i) => (
        <div
          key={i}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5"
        >
          {chip.icon}
          {chip.text}
        </div>
      ))}
    </div>
  );
}
