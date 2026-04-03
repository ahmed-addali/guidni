"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { FiUploadCloud, FiLoader } from "react-icons/fi";

interface Props {
  profileId: string;
  currentImage?: string | null;
  businessName: string;
}

export function AvatarUploader({ profileId, currentImage, businessName }: Props) {
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const [uploading, startUpload] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5 MB.");
      return;
    }

    const form = new FormData();
    form.append("file", file);

    startUpload(async () => {
      const res = await fetch(`/api/upload/business-profile/${profileId}`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Upload failed.");
        return;
      }
      setPreview(data.url);
      toast.success("Profile photo updated.");
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const initials = businessName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-6">
      {/* Avatar preview */}
      <div
        className="relative h-20 w-20 rounded-2xl overflow-hidden shrink-0 cursor-pointer group border border-gray-200"
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {preview ? (
          <Image
            src={preview}
            alt={businessName}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
            {initials}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <FiLoader className="h-5 w-5 text-white animate-spin" />
          ) : (
            <FiUploadCloud className="h-5 w-5 text-white" />
          )}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-800">{businessName}</p>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="mt-1 text-xs text-blue-600 hover:underline disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Change photo"}
        </button>
        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or WebP · Max 5 MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
