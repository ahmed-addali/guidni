"use client";

import { ImageUploader } from "@/components/upload/ImageUploader";

export function ImagesTab({
  shopId,
  images,
}: {
  shopId: string;
  images: { id: string; url: string }[];
}) {
  return (
    <ImageUploader
      entity="shop"
      entityId={shopId}
      images={images}
    />
  );
}
