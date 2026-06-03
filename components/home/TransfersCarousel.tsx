"use client";

import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { TransferCard } from "@/components/transfers/TransferCard";
import { TrackedCard } from "@/components/shared/TrackedCard";
import type { BadgeKey } from "@prisma/client";

type Transfer = {
  id: string;
  slug: string;
  title: string;
  type: "AIRPORT_TRANSFER" | "TAXI" | "CHAUFFEUR" | "SHUTTLE";
  pricePerTrip: number | null;
  pricePerHour: number | null;
  pricePerPerson: number | null;
  capacity: number;
  city: string | null;
  country: string;
  images: { url: string }[];
};

interface Props {
  transfers:  Transfer[];
  locale:     string;
  badgesMap?: Record<string, BadgeKey[]>;
}

export function TransfersCarousel({ transfers, locale, badgesMap = {} }: Props) {
  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      plugins={[Autoplay({ delay: 4500, stopOnInteraction: true })]}
      className="w-full overflow-hidden sm:overflow-visible sm:px-12"
    >
      <CarouselContent className="-ml-4" viewportClassName="overflow-visible sm:overflow-hidden">
        {transfers.map((tr) => (
          <CarouselItem key={tr.id} className="pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3">
            <TrackedCard listingId={tr.id} listingType="TRANSFER">
              <TransferCard
                id={tr.id}
                slug={tr.slug}
                title={tr.title}
                type={tr.type}
                pricePerTrip={tr.pricePerTrip}
                pricePerHour={tr.pricePerHour}
                pricePerPerson={tr.pricePerPerson}
                capacity={tr.capacity}
                city={tr.city}
                country={tr.country}
                coverImage={tr.images[0]?.url ?? null}
                locale={locale}
                badges={badgesMap[tr.id]}
              />
            </TrackedCard>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none sm:hidden" />
      <CarouselPrevious className="hidden sm:flex left-0" />
      <CarouselNext className="hidden sm:flex right-0" />
    </Carousel>
  );
}
