"use client";

import { useState, useEffect, useTransition } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  _count: { posts: number };
}

/** The six required content type slugs — protected from deletion. */
const SYSTEM_SLUGS = new Set([
  "kids-stories",
  "short-stories",
  "leadership",
  "essays",
  "business-ideas",
  "others",
]);

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function fetchCategories() {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  function handleAdd() {
    if (!newName.trim()) { setError("Name is required"); return; }
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }),
      });
      if (res.ok) {
        setNewName(""); setNewDesc(""); fetchCategories();
      } else {
        const d = await res.json();
        setError(d.error ?? "Failed to create");
      }
    });
  }

  async function handleDelete(id: string, slug: string) {
    if (SYSTEM_SLUGS.has(slug)) {
      setDeleteError("System content types cannot be deleted.");
      return;
    }
    if (!confirm("Delete this content type? Posts in it will become uncategorised.")) return;
    setDeleteError(null);
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const d = await res.json().catch(() => ({}));
      setDeleteError(d.error ?? "Failed to delete.");
    }
    fetchCategories();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-8">Content Types</h1>

      {deleteError && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </p>
      )}

      {/* Add form */}
      <div className="rounded-lg border border-stone-100 bg-white p-5 mb-6 space-y-4">
        <h2 className="font-sans text-xs font-semibold text-stone-400 uppercase tracking-wider">
          Add Content Type
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g. Essays"
            error={error}
          />
          <Input
            label="Description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Short description (optional)"
          />
        </div>
        <Button onClick={handleAdd} isLoading={isPending} size="sm">
          Add Content Type
        </Button>
      </div>

      {/* List */}
      <div className="rounded-lg border border-stone-100 bg-white overflow-hidden divide-y divide-stone-50">
        {loading ? (
          <p className="px-4 py-8 text-sm font-sans text-stone-400 text-center">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="px-4 py-8 text-sm font-sans text-stone-400 text-center">
            No content types yet. Add one above.
          </p>
        ) : (
          categories.map((cat) => {
            const isSystem = SYSTEM_SLUGS.has(cat.slug);
            return (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-stone-50 transition-colors duration-100"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-sans text-sm font-medium text-stone-800 truncate">
                      {cat.name}
                    </p>
                    {isSystem && (
                      <span className="shrink-0 inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-sans text-stone-400">
                        system
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-xs text-stone-400 mt-0.5">
                    /{cat.slug} · {cat._count.posts} {cat._count.posts === 1 ? "post" : "posts"}
                  </p>
                </div>
                {isSystem ? (
                  <span
                    className="shrink-0 font-sans text-xs text-stone-200 cursor-not-allowed select-none"
                    title="System content types cannot be deleted"
                  >
                    Delete
                  </span>
                ) : (
                  <button
                    onClick={() => handleDelete(cat.id, cat.slug)}
                    className="shrink-0 font-sans text-xs text-stone-400 hover:text-red-600 transition-colors duration-150"
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
