"use client";

import { ImageUploader } from "@/components/upload/ImageUploader";

export function ImagesTab({
  listingId,
  type,
  images,
}: {
  listingId: string;
  type: "activity" | "stay";
  images: { id: string; url: string }[];
}) {
  return (
    <ImageUploader
      entity={type}
      entityId={listingId}
      images={images}
    />
  );
}
