"use client";

import Autoplay from "embla-carousel-autoplay";
import { useTranslations } from "next-intl";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { GuideCard } from "@/components/planner/GuideCard";

type Guide = {
  id: string;
  slug: string;
  displayName: string;
  tagline?: string | null;
  avatarUrl?: string | null;
  specializations: string[];
  languages: string[];
  note?: string | null;
  nbReviews: number;
  planCount: number;
  isVerified: boolean;
  destination?: { city: string; slug: string } | null;
};

interface Props {
  guides: Guide[];
  locale: string;
}

export function GuidesCarousel({ guides, locale }: Props) {
  const t = useTranslations("GuideCard");

  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
      className="w-full overflow-hidden sm:overflow-visible sm:px-12"
    >
      <CarouselContent className="-ml-4" viewportClassName="overflow-visible sm:overflow-hidden">
        {guides.map((guide) => (
          <CarouselItem key={guide.id} className="pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3">
            <GuideCard
              slug={guide.slug}
              displayName={guide.displayName}
              tagline={guide.tagline}
              avatarUrl={guide.avatarUrl}
              specializations={guide.specializations}
              languages={guide.languages}
              note={guide.note}
              nbReviews={guide.nbReviews}
              planCount={guide.planCount}
              planCountLabel={t("planCount", { count: guide.planCount })}
              isVerified={guide.isVerified}
              destination={guide.destination}
              locale={locale}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none sm:hidden" />
      <CarouselPrevious className="hidden sm:flex left-0" />
      <CarouselNext className="hidden sm:flex right-0" />
    </Carousel>
  );
}
