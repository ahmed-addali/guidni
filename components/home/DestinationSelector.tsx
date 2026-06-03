"use client";

import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useDestinationStore } from "@/stores/destinationStore";
import { setDestinationCookie } from "@/lib/actions/destination-cookie";
import { cn } from "@/lib/utils";

type Destination = {
  slug: string;
  city: string;
  country: string;
  images?: { url: string }[];
  description?: string | null;
};

type Props = {
  destinations: Destination[];
  title: string;
};

export function DestinationSelector({ destinations, title }: Props) {
  const { destination, setDestination } = useDestinationStore();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function select(dest: Destination) {
    setDestination({ slug: dest.slug, city: dest.city, country: dest.country });
    startTransition(async () => {
      await setDestinationCookie(dest.slug);
      router.refresh();
    });
  }

  // Active destination always first
  const sorted = [...destinations].sort((a, b) => {
    if (a.slug === destination.slug) return -1;
    if (b.slug === destination.slug) return 1;
    return 0;
  });

  return (
    <section className="w-full pt-2 pb-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {title}
      </p>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {sorted.map((dest) => {
          const isSelected = destination.slug === dest.slug;
          return (
            <button
              key={dest.slug}
              onClick={() => select(dest)}
              className={cn(
                "relative flex-shrink-0 w-[100px] h-[68px] sm:w-[112px] sm:h-[76px] rounded-xl overflow-hidden border-2 transition-all duration-200",
                isSelected
                  ? "border-blue-600 ring-2 ring-blue-600/25 scale-[1.04]"
                  : "border-transparent hover:border-gray-300 hover:scale-[1.02]"
              )}
            >
              {dest.images?.[0]?.url ? (
                <Image
                  src={dest.images[0].url}
                  alt={dest.city}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-700" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5">
                <p className="text-white text-[11px] font-semibold leading-tight truncate">
                  {dest.city}
                </p>
              </div>
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
