"use client";

import { ImageUploader } from "@/components/upload/ImageUploader";

export function ImagesTab({
  restaurantId,
  images,
}: {
  restaurantId: string;
  images: { id: string; url: string }[];
}) {
  return (
    <ImageUploader
      entity="restaurant"
      entityId={restaurantId}
      images={images}
    />
  );
}
