"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { HiViewGrid } from "react-icons/hi";
import { BiSolidBuildingHouse } from "react-icons/bi";
import { IoRestaurant } from "react-icons/io5";
import { FaMapLocationDot } from "react-icons/fa6";
import { useDestinationStore } from "@/stores/destinationStore";

const SLIDE_INTERVAL = 4500;

type Destination = {
  slug: string;
  city: string;
  country: string;
  coverImage?: string | null;
  gallery?: string[];
  description?: string | null;
};

export function DestinationSpotlight({ destinations }: { destinations: Destination[] }) {
  const { destination } = useDestinationStore();
  const locale = useLocale();
  const t = useTranslations("HomePage.spotlight");

  const current = destinations.find((d) => d.slug === destination.slug) ?? destinations[0];

  const images = current
    ? Array.from(
        new Set([
          ...(current.coverImage ? [current.coverImage] : []),
          ...(current.gallery ?? []),
        ])
      ).filter(Boolean)
    : [];

  const [activeIdx, setActiveIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);

  useEffect(() => {
    setActiveIdx(0);
    setPrevIdx(null);
  }, [current?.slug]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx((i) => {
        const next = (i + 1) % images.length;
        setPrevIdx(i);
        return next;
      });
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [images.length, current?.slug]);

  if (!current) return null;

  const ctaBase =
    "flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition";

  return (
    <section className="w-full mb-4">
      <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden">

        {/* Image layers */}
        {images.length > 0 ? (
          <>
            {prevIdx !== null && prevIdx !== activeIdx && (
              <Image
                key={`prev-${prevIdx}`}
                src={images[prevIdx]}
                alt={current.city}
                fill
                className="object-cover opacity-0 transition-opacity duration-700"
                sizes="100vw"
              />
            )}
            <Image
              key={`active-${activeIdx}`}
              src={images[activeIdx]}
              alt={current.city}
              fill
              className="object-cover opacity-100 transition-opacity duration-700"
              sizes="100vw"
              priority={activeIdx === 0}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-teal-500" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute top-3 right-4 flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setPrevIdx(activeIdx);
                  setActiveIdx(i);
                }}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIdx
                    ? "w-4 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8">
          <div className="flex items-center gap-1.5 text-white/75 text-xs mb-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{current.country}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-1.5 tracking-tight">
            {current.city}
          </h2>

          {current.description && (
            <p className="text-white/75 text-sm max-w-xl mb-4 line-clamp-2 leading-relaxed">
              {current.description}
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/activities`}
              className={`${ctaBase} bg-white text-gray-900 hover:bg-white/90`}
            >
              <HiViewGrid className="h-4 w-4" />
              {t("activities")}
            </Link>
            <Link
              href={`/${locale}/stays`}
              className={`${ctaBase} bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25`}
            >
              <BiSolidBuildingHouse className="h-4 w-4" />
              {t("stays")}
            </Link>
            <Link
              href={`/${locale}/restaurants`}
              className={`${ctaBase} bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25`}
            >
              <IoRestaurant className="h-4 w-4" />
              {t("restaurants")}
            </Link>
            <Link
              href={`/${locale}/destinations/${current.slug}`}
              className={`${ctaBase} bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25`}
            >
              <FaMapLocationDot className="h-4 w-4" />
              {t("seeGuide")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
