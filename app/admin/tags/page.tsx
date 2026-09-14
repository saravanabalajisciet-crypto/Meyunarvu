"use client";

import { useState, useEffect, useTransition } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Tag { id: string; name: string; slug: string; }

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  async function fetchTags() {
    const res = await fetch("/api/tags");
    setTags(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchTags(); }, []);

  function handleAdd() {
    if (!newName.trim()) { setError("Name is required"); return; }
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) { setNewName(""); fetchTags(); }
      else { const d = await res.json(); setError(d.error ?? "Failed"); }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tag? It will be removed from all posts.")) return;
    await fetch(`/api/tags/${id}`, { method: "DELETE" });
    fetchTags();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-8">Tags</h1>

      {/* Add form */}
      <div className="rounded-lg border border-stone-100 bg-white p-5 mb-6 space-y-4">
        <h2 className="font-sans text-xs font-semibold text-stone-400 uppercase tracking-wider">
          Add Tag
        </h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              label="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Tag name"
              error={error}
            />
          </div>
          <Button onClick={handleAdd} isLoading={isPending} size="sm" className="mb-[1px]">
            Add
          </Button>
        </div>
      </div>

      {/* Tag cloud */}
      <div>
        <p className="font-sans text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          All Tags
        </p>
        {loading ? (
          <p className="font-sans text-sm text-stone-400">Loading…</p>
        ) : tags.length === 0 ? (
          <p className="font-sans text-sm text-stone-400">No tags yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-3 py-1 bg-white"
              >
                <span className="font-sans text-xs text-stone-700">{tag.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(tag.id)}
                  className="text-stone-300 hover:text-red-500 transition-colors duration-150 leading-none ml-0.5"
                  aria-label={`Delete tag ${tag.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
