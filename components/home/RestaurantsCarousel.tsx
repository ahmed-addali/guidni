"use client";

import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { RestaurantCard, type RestaurantCardLabels } from "@/components/restaurants/RestaurantCard";
import { TrackedCard } from "@/components/shared/TrackedCard";
import type { RestaurantListItem } from "@/lib/actions/restaurants";
import type { BadgeKey } from "@prisma/client";

interface Props {
  restaurants: RestaurantListItem[];
  locale: string;
  badgesMap?: Record<string, BadgeKey[]>;
  cardLabels?: RestaurantCardLabels;
}

export function RestaurantsCarousel({ restaurants, locale, badgesMap = {}, cardLabels }: Props) {
  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      plugins={[Autoplay({ delay: 4500, stopOnInteraction: true })]}
      className="w-full overflow-hidden sm:overflow-visible sm:px-12"
    >
      <CarouselContent className="-ml-4" viewportClassName="overflow-visible sm:overflow-hidden">
        {restaurants.map((r) => (
          <CarouselItem key={r.id} className="pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3">
            <TrackedCard listingId={r.id} listingType="RESTAURANT">
              <RestaurantCard restaurant={r} locale={locale} badges={badgesMap[r.id]} cardLabels={cardLabels} />
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
