"use client";

import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { StayCard } from "@/components/stays/StayCard";
import { TrackedCard } from "@/components/shared/TrackedCard";
import type { StayListItem } from "@/types/stay";
import type { BadgeKey } from "@prisma/client";

interface Props {
  stays: StayListItem[];
  locale: string;
  badgesMap?: Record<string, BadgeKey[]>;
  perNight?: string;
  currency?: string;
}

export function StaysCarousel({ stays, locale, badgesMap = {}, perNight, currency }: Props) {
  return (
    <Carousel
      opts={{ loop: true, align: "start" }}
      plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
      className="w-full overflow-hidden sm:overflow-visible sm:px-12"
    >
      <CarouselContent viewportClassName="overflow-visible sm:overflow-hidden">
        {stays.map((stay) => (
          <CarouselItem key={stay.id} className="basis-[85%] sm:basis-1/2 lg:basis-1/3">
            <TrackedCard listingId={stay.id} listingType="STAY">
              <StayCard stay={stay} locale={locale} badges={badgesMap[stay.id]} perNight={perNight} currency={currency} />
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
