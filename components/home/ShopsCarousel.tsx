"use client";

import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { ShopCard } from "@/components/shops/ShopCard";
import { getShopCategoryLabel } from "@/lib/utils/shop-categories";
import type { BadgeKey } from "@prisma/client";

type DeliveryMethod = "PICKUP" | "LOCAL_DELIVERY" | "NATIONWIDE" | "INTERNATIONAL";

interface ShopItem {
  id:              string;
  slug:            string;
  name:            string;
  arabicName?:     string | null;
  category:        string;
  city?:           string | null;
  country:         string;
  note?:           string | null;
  nbReviews:       number;
  coverPhoto?:     string | null;
  logo?:           string | null;
  deliveryMethods: DeliveryMethod[];
  images:          { url: string }[];
  products:        { images: { url: string }[] }[];
  destination?:    { city: string } | null;
}

interface Props {
  shops:      ShopItem[];
  locale:     string;
  badgesMap?: Record<string, BadgeKey[]>;
}

export function ShopsCarousel({ shops, locale, badgesMap = {} }: Props) {
  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      plugins={[Autoplay({ delay: 4500, stopOnInteraction: true })]}
      className="w-full overflow-hidden sm:overflow-visible sm:px-12"
    >
      <CarouselContent className="-ml-4" viewportClassName="overflow-visible sm:overflow-hidden">
        {shops.map((shop) => (
          <CarouselItem key={shop.id} className="pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3">
            <ShopCard
              id={shop.id}
              slug={shop.slug}
              name={shop.name}
              arabicName={shop.arabicName}
              category={shop.category}
              categoryLabel={getShopCategoryLabel(shop.category, locale)}
              city={shop.city ?? shop.destination?.city ?? null}
              country={shop.country}
              note={shop.note}
              nbReviews={shop.nbReviews}
              coverPhoto={shop.coverPhoto ?? shop.images[0]?.url ?? null}
              logo={shop.logo}
              deliveryMethods={shop.deliveryMethods}
              productImages={shop.products.flatMap((p) => p.images.map((i) => i.url))}
              locale={locale}
              badges={badgesMap[shop.id]}
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
