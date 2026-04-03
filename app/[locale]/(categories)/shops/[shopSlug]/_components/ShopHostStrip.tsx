import Image from "next/image";
import { BadgeCheck } from "lucide-react";

interface Props {
  name:          string;
  profileImage?: string | null;
  isVerified:    boolean;
  memberSince:   number;
  labels: {
    hostedBy:    string;
    memberSince: string;
  };
}

export function ShopHostStrip({ name, profileImage, isVerified, memberSince, labels }: Props) {
  return (
    <div className="flex items-center gap-4 py-5 border-y border-gray-100">
      {/* Avatar */}
      <div className="relative h-12 w-12 rounded-full overflow-hidden bg-primary/10 shrink-0 flex items-center justify-center">
        {profileImage ? (
          <Image src={profileImage} alt={name} fill className="object-cover" sizes="48px" />
        ) : (
          <span className="text-primary font-bold text-lg">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{labels.hostedBy}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="font-semibold text-gray-900 truncate">{name}</p>
          {isVerified && (
            <BadgeCheck className="h-4 w-4 text-blue-600 shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {labels.memberSince} {memberSince}
        </p>
      </div>
    </div>
  );
}
