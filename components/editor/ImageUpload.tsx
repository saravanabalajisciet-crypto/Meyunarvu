"use client";

import { useState, useRef } from "react";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";

interface UploadedImage {
  url: string;
  storageKey: string;
  altText: string;
}

interface ImageUploadProps {
  postId?: string;
  images: UploadedImage[];
  onAdd: (img: UploadedImage) => void;
  onRemove: (storageKey: string) => void;
}

export default function ImageUpload({ postId, images, onAdd, onRemove }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");

    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      if (postId) form.append("postId", postId);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        onAdd({ url: data.url, storageKey: data.storageKey, altText: "" });
      } else {
        const data = await res.json();
        setError(data.error ?? "Upload failed");
      }
    }
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-stone-700 font-sans">Images</label>

      {/* Drop zone */}
      <div
        className="relative rounded-md border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center hover:border-brand transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
        aria-label="Upload images"
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            <span className="text-sm font-sans text-stone-500">Uploading…</span>
          </div>
        ) : (
          <>
            <svg className="mx-auto h-8 w-8 text-stone-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-sans text-stone-500">
              Tap to upload or drag and drop
            </p>
            <p className="text-xs font-sans text-stone-400 mt-1">JPG, PNG, GIF, WebP — max 10 MB</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-xs font-sans text-red-600">{error}</p>}

      {/* Uploaded images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.storageKey} className="relative group rounded-md overflow-hidden border border-stone-200 bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.altText || "Uploaded image"}
                className="w-full h-24 object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(img.storageKey)}
                className="absolute top-1 right-1 rounded-full bg-white/80 p-1 text-stone-600 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
