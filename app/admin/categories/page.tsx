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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [error, setError] = useState("");

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

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Posts in it will become uncategorised.")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    fetchCategories();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-8">Categories</h1>

      {/* Add form */}
      <div className="rounded-lg border border-stone-100 bg-white p-5 mb-6 space-y-4">
        <h2 className="font-sans text-xs font-semibold text-stone-400 uppercase tracking-wider">
          Add Category
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
          Add Category
        </Button>
      </div>

      {/* List */}
      <div className="rounded-lg border border-stone-100 bg-white overflow-hidden divide-y divide-stone-50">
        {loading ? (
          <p className="px-4 py-8 text-sm font-sans text-stone-400 text-center">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="px-4 py-8 text-sm font-sans text-stone-400 text-center">
            No categories yet. Add one above.
          </p>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-stone-50 transition-colors duration-100"
            >
              <div className="min-w-0">
                <p className="font-sans text-sm font-medium text-stone-800 truncate">
                  {cat.name}
                </p>
                <p className="font-sans text-xs text-stone-400 mt-0.5">
                  /{cat.slug} · {cat._count.posts} {cat._count.posts === 1 ? "post" : "posts"}
                </p>
              </div>
              <button
                onClick={() => handleDelete(cat.id)}
                className="shrink-0 font-sans text-xs text-stone-400 hover:text-red-600 transition-colors duration-150"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
