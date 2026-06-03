"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { FiUploadCloud, FiLoader, FiX } from "react-icons/fi";

interface Props {
  /** POST target: /api/upload/{entity}/{entityId} */
  entity: string;
  entityId: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** aspect-ratio tailwind class, e.g. "aspect-square" or "aspect-video" */
  aspect?: string;
  placeholder?: string;
}

export function SingleImageUploader({
  entity,
  entityId,
  value,
  onChange,
  label,
  aspect = "aspect-video",
  placeholder,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/upload/${entity}/${entityId}`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Upload failed.");
        return;
      }
      onChange(data.url);
    } finally {
      setUploading(false);
    }
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

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}

      <div
        className={`${aspect} relative rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer group hover:border-primary/40 transition-colors`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {value ? (
          <>
            <Image src={value} alt="Preview" fill className="object-cover" sizes="400px" />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <FiLoader className="h-6 w-6 text-white animate-spin" />
              ) : (
                <div className="text-center text-white">
                  <FiUploadCloud className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-xs font-medium">Change photo</p>
                </div>
              )}
            </div>
            {/* Remove button */}
            {!uploading && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
            {uploading ? (
              <FiLoader className="h-7 w-7 animate-spin text-primary" />
            ) : (
              <>
                <FiUploadCloud className="h-7 w-7" />
                <p className="text-xs text-center px-4">
                  {placeholder ?? "Click or drag & drop to upload"}
                </p>
                <p className="text-xs text-gray-300">JPG, PNG or WebP · max 5 MB</p>
              </>
            )}
          </div>
        )}
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
