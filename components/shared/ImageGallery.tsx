"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Grid2x2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  images: { id: string; url: string }[];
  title: string;
  allPhotosLabel: string;
  photosLabel: string;
};

export function ImageGallery({ images, title, allPhotosLabel, photosLabel }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) return null;

  const count = images.length;

  function prev() {
    setActiveIndex((i) => (i === 0 ? count - 1 : i - 1));
  }
  function next() {
    setActiveIndex((i) => (i === count - 1 ? 0 : i + 1));
  }

  return (
    <>
      {/* ── Gallery grid ── */}
      <div className="relative">
        {/* Mobile: single image with photo count chip */}
        <div className="block sm:hidden relative h-64 rounded-2xl overflow-hidden">
          <Image
            src={images[0].url}
            alt={title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {count > 1 && (
            <button
              onClick={() => { setActiveIndex(0); setLightboxOpen(true); }}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm"
            >
              <Grid2x2 className="h-3.5 w-3.5" />
              {count} {photosLabel}
            </button>
          )}
        </div>

        {/* Desktop: 5-image Airbnb-style grid */}
        <div className="hidden sm:grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden">
          {/* Large image — spans 2 cols × 2 rows */}
          <div
            className="col-span-2 row-span-2 relative cursor-pointer group"
            onClick={() => { setActiveIndex(0); setLightboxOpen(true); }}
          >
            <Image
              src={images[0].url}
              alt={title}
              fill
              className="object-cover group-hover:brightness-90 transition-[filter]"
              priority
              sizes="50vw"
            />
          </div>

          {/* Right 4 thumbnails */}
          {[1, 2, 3, 4].map((i) => {
            const img = images[i];
            if (!img) {
              return <div key={i} className="bg-gray-100" />;
            }
            return (
              <div
                key={img.id}
                className="relative cursor-pointer group"
                onClick={() => { setActiveIndex(i); setLightboxOpen(true); }}
              >
                <Image
                  src={img.url}
                  alt={`${title} ${i + 1}`}
                  fill
                  className="object-cover group-hover:brightness-90 transition-[filter]"
                  sizes="25vw"
                />
              </div>
            );
          })}
        </div>

        {/* Show all photos button */}
        {count > 1 && (
          <button
            onClick={() => { setActiveIndex(0); setLightboxOpen(true); }}
            className="hidden sm:flex absolute bottom-4 right-4 items-center gap-2 bg-white border border-gray-200 text-gray-800 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Grid2x2 className="h-4 w-4" />
            {allPhotosLabel}
          </button>
        )}
      </div>

      {/* ── Lightbox modal ── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0">
            <span className="text-white/60 text-sm">
              {activeIndex + 1} / {count}
            </span>
            <p className="text-white font-medium text-sm truncate max-w-xs">{title}</p>
            <button
              onClick={() => setLightboxOpen(false)}
              className="text-white hover:text-white/70 transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Main image */}
          <div className="flex-1 relative">
            <Image
              src={images[activeIndex].url}
              alt={`${title} ${activeIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
            {count > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {count > 1 && (
            <div className="flex gap-2 px-6 py-4 overflow-x-auto scrollbar-hide shrink-0">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    "relative h-14 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                    i === activeIndex
                      ? "border-white"
                      : "border-transparent opacity-50 hover:opacity-80"
                  )}
                >
                  <Image src={img.url} alt={`${title} ${i + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
