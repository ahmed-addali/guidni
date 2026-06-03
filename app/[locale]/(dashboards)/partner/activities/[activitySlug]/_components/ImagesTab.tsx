"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiStar, FiCheck, FiChevronDown, FiImage } from "react-icons/fi";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { setActivityImageAsCover, reorderActivityImages, reorderStayImages } from "@/lib/actions/partner";

type Props = {
  listingId: string;
  type: "activity" | "stay";
  images: { id: string; url: string }[];
};

export function ImagesTab({ listingId, type, images: initialImages }: Props) {
  const t = useTranslations("Components.imagesTab");
  const [images, setImages]         = useState(initialImages);
  const [picking, setPicking]       = useState(false);
  const [coverPending, start]       = useTransition();
  const [settingCover, setSettingCover] = useState<string | null>(null);

  const cover = images[0] ?? null;

  function handleSetCover(imageId: string) {
    if (type !== "activity" || imageId === cover?.id) {
      setPicking(false);
      return;
    }
    setSettingCover(imageId);
    start(async () => {
      const res = await setActivityImageAsCover(imageId, listingId);
      if (res.success) {
        // Move selected image to front locally so UI updates immediately
        setImages((prev) => [
          prev.find((i) => i.id === imageId)!,
          ...prev.filter((i) => i.id !== imageId),
        ]);
        toast.success(t("coverUpdated"));
        setPicking(false);
      } else {
        toast.error(res.error ?? t("coverFailed"));
      }
      setSettingCover(null);
    });
  }

  return (
    <div className="space-y-8">

      {/* ── Cover photo ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">{t("coverTitle")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t("coverHint")}</p>
          </div>
          {type === "activity" && images.length > 1 && (
            <button
              type="button"
              onClick={() => setPicking((p) => !p)}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-1.5 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              <FiStar className="h-3.5 w-3.5" />
              {t("changeCover")}
              <FiChevronDown className={`h-3.5 w-3.5 transition-transform ${picking ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>

        {/* Current cover preview */}
        {cover ? (
          <div className="relative h-52 w-full sm:w-80 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
            <Image
              src={cover.url}
              alt={t("coverTitle")}
              fill
              className="object-cover"
              sizes="320px"
            />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
              <FiStar className="h-3 w-3 fill-white" />
              {t("coverLabel")}
            </div>
          </div>
        ) : (
          <div className="h-52 w-full sm:w-80 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-300">
            <FiImage className="h-8 w-8" />
            <p className="text-xs">{t("noPhotos")}</p>
          </div>
        )}

        {/* Inline cover picker — revealed on "Change cover" click */}
        {picking && images.length > 1 && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <p className="text-xs font-medium text-gray-500">{t("pickerTitle")}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {images.map((img) => {
                const isCover    = img.id === cover?.id;
                const isSetting  = settingCover === img.id;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => handleSetCover(img.id)}
                    disabled={coverPending || isCover}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      isCover
                        ? "border-primary cursor-default"
                        : "border-transparent hover:border-primary/50 cursor-pointer"
                    } disabled:opacity-60`}
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                    {isCover && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <FiCheck className="h-5 w-5 text-white drop-shadow" />
                      </div>
                    )}
                    {isSetting && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── All photos ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{t("allPhotosTitle")}</p>
          <p className="text-xs text-gray-400 mt-0.5">{t("allPhotosHint")}</p>
        </div>
        {/* key forces ImageUploader to reinitialize when cover order changes */}
        <ImageUploader
          key={images[0]?.id ?? "empty"}
          entity={type}
          entityId={listingId}
          images={images}
          onChange={setImages}
          onReorder={
            type === "activity"
              ? (orderedIds) => reorderActivityImages(listingId, orderedIds)
              : type === "stay"
              ? (orderedIds) => reorderStayImages(listingId, orderedIds)
              : undefined
          }
        />
      </div>

    </div>
  );
}
