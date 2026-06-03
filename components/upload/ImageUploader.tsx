"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiUploadCloud, FiTrash2, FiLoader, FiMove } from "react-icons/fi";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export type UploadedImage = { id: string; url: string };

type Entity = "activity" | "stay" | "restaurant" | "rental" | "transfer" | "shop" | "product" | "menu-item";

interface Props {
  entity: Entity;
  entityId: string;
  images: UploadedImage[];
  onChange?: (images: UploadedImage[]) => void;
  onReorder?: (orderedIds: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({ entity, entityId, images: initialImages, onChange, onReorder, maxImages = 10 }: Props) {
  const t = useTranslations("Components.imageUploader");
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
      toast.error(t("maxImagesError", { max: maxImages }));
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
        toast.error(data.error ?? t("uploadFailed"));
        return;
      }
      const next = [...images, data.image as UploadedImage];
      update(next);
      toast.success(t("uploadSuccess"));
    } catch {
      toast.error(t("uploadFailedRetry"));
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
        toast.error(data.error ?? t("removeFailed"));
        return;
      }
      update(images.filter((i) => i.id !== imageId));
      toast.success(t("removeSuccess"));
    } catch {
      toast.error(t("removeFailed"));
    } finally {
      setRemoving(null);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = Array.from(images);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    update(next);
    onReorder?.(next.map((i) => i.id));
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
            <p className="text-sm text-gray-500">{t("uploading")}</p>
          </>
        ) : (
          <>
            <FiUploadCloud className="h-8 w-8 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {t("dropHint")} <span className="text-primary">{t("browse")}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t("fileTypes")}
              </p>
            </div>
            {maxImages && (
              <p className="text-xs text-gray-400">
                {t("countLabel", { count: images.length, max: maxImages })}
              </p>
            )}
          </>
        )}
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        onReorder ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="images" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-wrap gap-4"
                >
                  {images.map((img, i) => (
                    <Draggable key={img.id} draggableId={img.id} index={i}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`relative group w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] aspect-square rounded-xl overflow-hidden border bg-gray-100 transition-shadow ${
                            snapshot.isDragging
                              ? "border-primary shadow-lg ring-2 ring-primary/20"
                              : "border-gray-200"
                          }`}
                        >
                          <Image
                            src={img.url}
                            alt={`Image ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                          {i === 0 && !snapshot.isDragging && (
                            <span className="absolute top-2 left-2 bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                              {t("cover")}
                            </span>
                          )}
                          {/* Drag handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="absolute top-2 left-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            aria-label="Drag to reorder"
                          >
                            <FiMove className="h-3.5 w-3.5" />
                          </div>
                          <button
                            type="button"
                            disabled={removing === img.id}
                            onClick={() => handleRemove(img.id)}
                            aria-label={t("removeImage")}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                          >
                            {removing === img.id ? (
                              <FiLoader className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <FiTrash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
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
                    {t("cover")}
                  </span>
                )}
                <button
                  type="button"
                  disabled={removing === img.id}
                  onClick={() => handleRemove(img.id)}
                  aria-label={t("removeImage")}
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
        )
      )}

    </div>
  );
}
