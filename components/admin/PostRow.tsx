"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Badge from "@/components/ui/Badge";
import type { PostStatus, PostType } from "@prisma/client";

interface PostRowProps {
  id: string;
  title: string;
  status: PostStatus;
  type: PostType;
  updatedAt: Date | string;
  categoryName?: string | null;
}

export default function PostRow({ id, title, status, type, updatedAt, categoryName }: PostRowProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors duration-100">
      <div className="min-w-0 flex-1">
        <Link
          href={`/admin/posts/${id}/edit`}
          className="font-sans text-sm font-medium text-stone-800 hover:text-brand truncate block transition-colors duration-150"
        >
          {title}
        </Link>
        <p className="font-sans text-xs text-stone-400 mt-0.5">
          {categoryName ?? type} ·{" "}
          {new Date(updatedAt).toLocaleDateString("en-IN", {
            day: "numeric", month: "short",
          })}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Badge variant={status === "published" ? "published" : "draft"}>
          {status}
        </Badge>
        <Link
          href={`/admin/posts/${id}/edit`}
          className="font-sans text-xs text-stone-400 hover:text-brand transition-colors duration-150"
          aria-label={`Edit ${title}`}
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="font-sans text-xs text-stone-300 hover:text-red-500 transition-colors duration-150 disabled:opacity-40"
          aria-label={`Delete ${title}`}
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
