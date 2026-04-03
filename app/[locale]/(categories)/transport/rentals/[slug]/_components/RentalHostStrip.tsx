import Image from "next/image";
import { BadgeCheck } from "lucide-react";

type Props = {
  name: string;
  profileImage: string | null;
  createdAt: Date;
  isVerified: boolean;
  labels: {
    hostedBy: string;
    memberSince: string;
  };
};

export function RentalHostStrip({ name, profileImage, createdAt, isVerified, labels }: Props) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const year = new Date(createdAt).getFullYear();

  return (
    <div className="flex items-center gap-4">
      {profileImage ? (
        <Image
          src={profileImage}
          alt={name}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0 text-sm">
          {initials}
        </div>
      )}
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-gray-900">
            {labels.hostedBy} {name}
          </p>
          {isVerified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{labels.memberSince} {year}</p>
      </div>
    </div>
  );
}
