"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { FiUploadCloud, FiTrash2, FiImage, FiLoader } from "react-icons/fi";

export type UploadedImage = { id: string; url: string };

type Entity = "activity" | "stay" | "restaurant" | "rental" | "transfer" | "shop" | "product";

interface Props {
  entity: Entity;
  entityId: string;
  images: UploadedImage[];
  onChange?: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export function ImageUploader({ entity, entityId, images: initialImages, onChange, maxImages = 10 }: Props) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving]   = useState<string | null>(null);
  const [dragging, setDragging]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const update = useCallback((next: UploadedImage[]) => {
    setImages(next);
    onChange?.(next);
  }, [onChange]);

  async function uploadFile(file: File) {
    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed.`);
      return;
    }

    const form = new FormData();
    form.append("file", file);

    setUploading(true);
    try {
      const res = await fetch(`/api/upload/${entity}/${entityId}`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Upload failed.");
        return;
      }
      const next = [...images, data.image as UploadedImage];
      update(next);
      toast.success("Image uploaded.");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(imageId: string) {
    setRemoving(imageId);
    try {
      const res = await fetch(`/api/upload/${entity}/${entityId}?imageId=${imageId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Failed to remove image.");
        return;
      }
      update(images.filter((i) => i.id !== imageId));
      toast.success("Image removed.");
    } catch {
      toast.error("Failed to remove image.");
    } finally {
      setRemoving(null);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const canUpload = !uploading && images.length < maxImages;

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onClick={() => canUpload && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl py-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : canUpload
            ? "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
            : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={!canUpload}
        />
        {uploading ? (
          <>
            <FiLoader className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-gray-500">Uploading…</p>
          </>
        ) : (
          <>
            <FiUploadCloud className="h-8 w-8 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Drop images here or <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPEG, PNG, WebP, GIF, AVIF · Max 5 MB per file
              </p>
            </div>
            {maxImages && (
              <p className="text-xs text-gray-400">
                {images.length} / {maxImages} images
              </p>
            )}
          </>
        )}
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
            >
              <Image
                src={img.url}
                alt={`Image ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {i === 0 && (
                <span className="absolute top-2 left-2 bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  Cover
                </span>
              )}
              <button
                type="button"
                disabled={removing === img.id}
                onClick={() => handleRemove(img.id)}
                aria-label="Remove image"
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
              >
                {removing === img.id ? (
                  <FiLoader className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FiTrash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <div className="flex flex-col items-center gap-2 py-4 text-gray-300">
          <FiImage className="h-8 w-8" />
          <p className="text-xs">No images yet</p>
        </div>
      )}
    </div>
  );
}
