"use client";

import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import { FiStar, FiTag } from "react-icons/fi";
import { FaTicket } from "react-icons/fa6";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import type { FeaturedPass } from "@/lib/actions/passes";

interface Props {
  passes: FeaturedPass[];
  locale: string;
  labels: {
    popular: string;
    perPerson: string;
    included: string;
    optional: string;
    bookNow: string;
  };
}

export function PassesCarousel({ passes, locale, labels }: Props) {
  return (
    <Carousel
      opts={{ align: "start", loop: passes.length > 3 }}
      plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
      className="w-full overflow-hidden sm:overflow-visible sm:px-12"
    >
      <CarouselContent className="-ml-4" viewportClassName="overflow-visible sm:overflow-hidden">
        {passes.map((pass) => {
          const discountedPrice =
            pass.discount > 0
              ? Math.round(pass.price * (1 - pass.discount / 100))
              : null;

          return (
            <CarouselItem
              key={pass.id}
              className="pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3"
            >
              <Link
                href={`/${locale}/passes/${pass.passKey}`}
                className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow h-full"
              >
                {/* Coloured header band */}
                <div className="bg-primary/5 border-b border-gray-100 px-5 py-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <FaTicket className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                      {pass.name}
                    </p>
                    {pass.destination?.city && (
                      <p className="text-xs text-gray-400">{pass.destination.city}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {pass.popular && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                        <FiStar className="h-2.5 w-2.5" />
                        {labels.popular}
                      </span>
                    )}
                    {pass.discount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
                        <FiTag className="h-2.5 w-2.5" />
                        -{pass.discount}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 px-5 py-4 gap-3">
                  {/* Activity previews */}
                  {pass.fixedActivities.length > 0 && (
                    <ul className="space-y-1">
                      {pass.fixedActivities.map((a) => (
                        <li key={a.id} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                          {a.title}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Counts */}
                  <p className="text-xs text-gray-400">
                    {pass.fixedActivities.length} {labels.included}
                    {pass.optionalActivities.length > 0 && (
                      <> · {pass.optionalCount} / {pass.optionalActivities.length} {labels.optional}</>
                    )}
                  </p>

                  {/* Price + CTA */}
                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      {discountedPrice !== null ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-gray-900">
                            {discountedPrice} TND
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            {pass.price} TND
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {pass.price} TND
                        </span>
                      )}
                      <p className="text-xs text-gray-400">{labels.perPerson}</p>
                    </div>
                    <span className="text-sm font-semibold bg-primary text-white rounded-xl px-4 py-1.5 group-hover:bg-primary/90 transition-colors">
                      {labels.bookNow}
                    </span>
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
