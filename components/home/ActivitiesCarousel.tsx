"use client";

import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { TrackedCard } from "@/components/shared/TrackedCard";
import type { ActivityListItem } from "@/types/activity";
import type { BadgeKey } from "@prisma/client";

interface Props {
  activities: ActivityListItem[];
  locale: string;
  badgesMap?: Record<string, BadgeKey[]>;
}

export function ActivitiesCarousel({ activities, locale, badgesMap = {} }: Props) {
  return (
    <Carousel
      opts={{ loop: true, align: "start" }}
      plugins={[Autoplay({ delay: 3500, stopOnInteraction: true })]}
      className="w-full overflow-hidden sm:overflow-visible sm:px-12"
    >
      <CarouselContent viewportClassName="overflow-visible sm:overflow-hidden">
        {activities.map((activity) => (
          <CarouselItem key={activity.id} className="basis-[85%] sm:basis-1/2 lg:basis-1/3">
            <TrackedCard listingId={activity.id} listingType="ACTIVITY">
              <ActivityCard activity={activity} locale={locale} badges={badgesMap[activity.id]} />
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
