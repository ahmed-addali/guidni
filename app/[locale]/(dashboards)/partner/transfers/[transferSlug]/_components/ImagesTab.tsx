"use client";

import { ImageUploader } from "@/components/upload/ImageUploader";

interface Image { id: string; url: string; alt: string }

export function ImagesTab({ transferId, images }: { transferId: string; images: Image[] }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      <div className="border-b border-gray-100 pb-3">
        <p className="font-semibold text-gray-800">Photos</p>
        <p className="text-xs text-gray-400 mt-1">Add photos of your vehicle to attract more bookings.</p>
      </div>
      <ImageUploader
        entity="transfer"
        entityId={transferId}
        images={images}
        maxImages={8}
      />
    </div>
  );
}
