import { Wind, MapPin, ShieldCheck, Star } from "lucide-react";

type Props = {
  hasAC: boolean;
  hasGPS: boolean;
  hasInsurance: boolean;
  note: string | null;
  labels: {
    ac: string;
    gps: string;
    insurance: string;
    topRated: string;
  };
};

export function RentalHighlights({ hasAC, hasGPS, hasInsurance, note, labels }: Props) {
  const chips: { icon: React.ReactNode; text: string }[] = [];

  if (hasAC)       chips.push({ icon: <Wind className="h-4 w-4 text-primary" />,        text: labels.ac });
  if (hasGPS)      chips.push({ icon: <MapPin className="h-4 w-4 text-primary" />,       text: labels.gps });
  if (hasInsurance)chips.push({ icon: <ShieldCheck className="h-4 w-4 text-primary" />,  text: labels.insurance });
  if (note && parseFloat(note) >= 4.5)
    chips.push({ icon: <Star className="h-4 w-4 text-primary" />, text: labels.topRated });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {chips.map((chip, i) => (
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
