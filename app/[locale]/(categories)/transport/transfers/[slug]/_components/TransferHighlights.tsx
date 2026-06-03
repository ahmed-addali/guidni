import { Wind, Users, Star, MessageSquare } from "lucide-react";

type Props = {
  isAC: boolean;
  isMeetGreet: boolean;
  isChildSeat: boolean;
  note: string | null;
  labels: {
    ac: string;
    meetGreet: string;
    childSeat: string;
    topRated: string;
  };
};

export function TransferHighlights({ isAC, isMeetGreet, isChildSeat, note, labels }: Props) {
  const chips: { icon: React.ReactNode; text: string }[] = [];

  if (isAC)        chips.push({ icon: <Wind className="h-4 w-4 text-primary" />,         text: labels.ac });
  if (isMeetGreet) chips.push({ icon: <MessageSquare className="h-4 w-4 text-primary" />, text: labels.meetGreet });
  if (isChildSeat) chips.push({ icon: <Users className="h-4 w-4 text-primary" />,         text: labels.childSeat });
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
