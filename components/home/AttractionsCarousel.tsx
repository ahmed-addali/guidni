"use client";

import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { FiMapPin } from "react-icons/fi";

const CATEGORY_GRADIENTS: Record<string, string> = {
  beach: "from-cyan-400 to-blue-500",
  culture: "from-purple-400 to-pink-500",
  nature: "from-green-400 to-teal-500",
  religion: "from-indigo-400 to-purple-500",
  history: "from-amber-400 to-orange-500",
  entertainment: "from-rose-400 to-pink-500",
};

type Attraction = {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  category: string;
  hasFee: boolean;
  feeAmount: number | null;
  images: { url: string }[];
  translations: { title: string; description: string }[];
};

interface Props {
  attractions: Attraction[];
  destinationSlug: string;
  locale: string;
}

export function AttractionsCarousel({ attractions, destinationSlug, locale }: Props) {
  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      plugins={[Autoplay({ delay: 4800, stopOnInteraction: true })]}
      className="w-full overflow-hidden sm:overflow-visible sm:px-12"
    >
      <CarouselContent className="-ml-4" viewportClassName="overflow-visible sm:overflow-hidden">
        {attractions.map((item) => {
          const imageUrl = item.images[0]?.url;
          const translation = item.translations[0];
          const title = translation?.title ?? item.title;
          const gradient = CATEGORY_GRADIENTS[item.category?.toLowerCase() ?? ""] ?? "from-primary to-blue-600";

          return (
            <CarouselItem
              key={item.id}
              className="pl-4 basis-[80%] sm:basis-1/2 lg:basis-1/3"
            >
              <Link
                href={`/${locale}/destinations/${destinationSlug}/attractions/${item.slug}`}
                className="group block bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-48 overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${gradient} group-hover:scale-105 transition-transform duration-300`}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full capitalize">
                      {item.category}
                    </span>
                  </div>
                  {item.hasFee && item.feeAmount && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-primary/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                        {item.feeAmount} TND
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-bold text-sm line-clamp-1">{title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <FiMapPin className="h-3 w-3 text-white/70 shrink-0" />
                      <p className="text-white/70 text-xs line-clamp-1">{item.location}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none sm:hidden" />
      <CarouselPrevious className="hidden sm:flex left-0" />
      <CarouselNext className="hidden sm:flex right-0" />
    </Carousel>
  );
}
