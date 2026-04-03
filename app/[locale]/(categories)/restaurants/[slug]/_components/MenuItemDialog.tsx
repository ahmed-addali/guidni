"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, UtensilsCrossed, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string | null;
  images: { url: string }[];
};

type Props = {
  item: MenuItem | null;
  onClose: () => void;
};

export function MenuItemDialog({ item, onClose }: Props) {
  const [imgIndex, setImgIndex] = useState(0);

  if (!item) return null;

  const images = item.images ?? [];
  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;

  function prev() {
    setImgIndex((i) => (i - 1 + images.length) % images.length);
  }
  function next() {
    setImgIndex((i) => (i + 1) % images.length);
  }

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) { onClose(); setImgIndex(0); } }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl gap-0">
        <DialogTitle className="sr-only">{item.name}</DialogTitle>

        {/* Image area */}
        <div className="relative bg-gray-100 aspect-video w-full">
          {hasImages ? (
            <>
              <Image
                src={images[imgIndex].url}
                alt={item.name}
                fill
                className="object-cover"
                sizes="512px"
              />
              {hasMultiple && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${i === imgIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <UtensilsCrossed className="h-12 w-12 text-gray-300" />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={() => { onClose(); setImgIndex(0); }}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">{item.name}</h2>
              {item.category && (
                <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {item.category}
                </span>
              )}
            </div>
            <span className="text-xl font-bold text-gray-900 shrink-0">{item.price} TND</span>
          </div>
          {item.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
