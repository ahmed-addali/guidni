"use client";

import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { ProductCard } from "@/components/shops/ProductCard";

interface ProductItem {
  id:           string;
  slug:         string;
  name:         string;
  price:        number;
  comparePrice?: number | null;
  isHandmade:   boolean;
  images:       { url: string }[];
  shop:         { name: string; slug: string };
}

interface Props {
  products:     ProductItem[];
  locale:       string;
  handmadeLabel?: string;
}

export function ProductsCarousel({ products, locale, handmadeLabel }: Props) {
  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
      className="w-full overflow-hidden sm:overflow-visible sm:px-12"
    >
      <CarouselContent className="-ml-4" viewportClassName="overflow-visible sm:overflow-hidden">
        {products.map((product) => (
          <CarouselItem key={product.id} className="pl-4 basis-[50%] sm:basis-1/3 lg:basis-1/4">
            <ProductCard
              id={product.id}
              slug={product.slug}
              shopSlug={product.shop.slug}
              name={product.name}
              shopName={product.shop.name}
              price={product.price}
              comparePrice={product.comparePrice}
              isHandmade={product.isHandmade}
              imageUrl={product.images[0]?.url ?? null}
              locale={locale}
              handmadeLabel={handmadeLabel}
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
