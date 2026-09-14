"use client";

/**
 * PostEditor — full editing shell for creating and updating posts.
 *
 * Autosave states: unsaved → saving → saved | error
 * Slug is shown read-only after first save; never editable.
 * Publish/Unpublish are explicit actions separate from autosave.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import SaveStatusBar from "./SaveStatusBar";
import MarkdownEditor from "./MarkdownEditor";
import TagInput from "./TagInput";
import ImageUpload from "./ImageUpload";
import TypeMetaFields from "./TypeMetaFields";
import type { SaveStatus, PostType, PostStatus } from "@/types";
import { AUTOSAVE_DEBOUNCE_MS } from "@/config/editor";

interface Category { id: string; name: string; slug: string; }
interface Tag { id: string; name: string; slug: string; }
interface UploadedImage { url: string; storageKey: string; altText: string; }

interface PostEditorProps {
  /** undefined = new post */
  postId?: string;
  initialTitle?: string;
  initialContent?: string;
  initialExcerpt?: string;
  initialType?: PostType;
  initialStatus?: PostStatus;
  initialCategoryId?: string;
  initialTags?: string[];      // tag names
  initialImages?: UploadedImage[];
  initialSlug?: string;
  initialMeta?: Record<string, string>;
  categories: Category[];
  allTags: Tag[];
}

export default function PostEditor({
  postId: initialPostId,
  initialTitle = "",
  initialContent = "",
  initialExcerpt = "",
  initialType = "article",
  initialStatus = "draft",
  initialCategoryId = "",
  initialTags = [],
  initialImages = [],
  initialSlug,
  initialMeta = {},
  categories,
  allTags,
}: PostEditorProps) {
  const router = useRouter();

  // ── Field state ──────────────────────────────────────────────────────────
  const [postId, setPostId] = useState(initialPostId);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [type, setType] = useState<PostType>(initialType);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [status, setStatus] = useState<PostStatus>(initialStatus);
  const [meta, setMeta] = useState<Record<string, string>>(initialMeta);

  // ── Autosave state ────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  // ── Tag name → ID resolution ──────────────────────────────────────────────
  async function resolveTagIds(tagNames: string[]): Promise<string[]> {
    const ids: string[] = [];
    for (const name of tagNames) {
      const existing = allTags.find(
        (t) => t.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        ids.push(existing.id);
      } else {
        // Create tag on the fly
        const res = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (res.ok) {
          const newTag = await res.json();
          ids.push(newTag.id);
        }
      }
    }
    return ids;
  }

  // ── Core save function ───────────────────────────────────────────────────
  const save = useCallback(
    async (overrideStatus?: PostStatus) => {
      if (!title.trim()) return; // don't save blank titles
      setSaveStatus("saving");

      const tagIds = await resolveTagIds(tags);
      const body = {
        title,
        content,
        excerpt,
        type,
        categoryId: categoryId || null,
        tagIds,
        meta,
        ...(overrideStatus ? { status: overrideStatus } : {}),
      };

      try {
        let res: Response;
        if (!postId) {
          // First save → create
          res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (res.ok) {
            const data = await res.json();
            setPostId(data.id);
            setSlug(data.slug);
            setStatus(data.status);
            // Redirect to edit URL so the browser reflects the real ID
            router.replace(`/admin/posts/${data.id}/edit`);
          }
        } else {
          res = await fetch(`/api/posts/${postId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.status) setStatus(data.status);
          }
        }

        if (!res.ok) throw new Error("Save failed");

        setSaveStatus("saved");
        setSavedAt(new Date());
        isDirtyRef.current = false;
      } catch {
        setSaveStatus("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [postId, title, content, excerpt, type, categoryId, tags]
  );

  // ── Mark dirty + schedule autosave on any change ──────────────────────────
  function scheduleAutosave() {
    isDirtyRef.current = true;
    setSaveStatus("unsaved");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      save();
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  // Clean up on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // ── Field change handlers that trigger autosave ───────────────────────────
  function handleTitle(v: string) { setTitle(v); scheduleAutosave(); }
  function handleContent(v: string) { setContent(v); scheduleAutosave(); }
  function handleExcerpt(v: string) { setExcerpt(v); scheduleAutosave(); }
  function handleType(v: PostType) { setType(v); scheduleAutosave(); }
  function handleCategory(v: string) { setCategoryId(v); scheduleAutosave(); }
  function handleTags(v: string[]) { setTags(v); scheduleAutosave(); }
  function handleMeta(key: string, value: string) {
    setMeta((prev) => ({ ...prev, [key]: value }));
    scheduleAutosave();
  }

  // ── Build public URL from type + slug ────────────────────────────────────
  function buildPublicUrl(postSlug: string, postType: PostType, catId: string): string {
    if (postType === "thirukkural") return `/thirukkural/${postSlug}`;
    if (postType === "letter") return `/letters/${postSlug}`;
    if (postType === "business_idea") return `/ideas/${postSlug}`;
    if (postType === "linkedin_post") return `/linkedin/${postSlug}`;
    // article — use category slug if available
    const cat = categories.find((c) => c.id === catId);
    return cat ? `/${cat.slug}/${postSlug}` : `/essays/${postSlug}`;
  }

  // ── Publish / Unpublish ───────────────────────────────────────────────────
  async function handlePublish() {
    setIsPublishing(true);
    const next = status === "published" ? "draft" : "published";
    await save(next);
    setIsPublishing(false);
  }

  // ── Image handlers ────────────────────────────────────────────────────────
  function handleImageAdd(img: UploadedImage) {
    setImages((prev) => [...prev, img]);
    // Images are persisted by the upload API; no autosave needed
  }

  async function handleImageRemove(storageKey: string) {
    setImages((prev) => prev.filter((i) => i.storageKey !== storageKey));
    // Optionally delete from storage — omitted in Phase 1 (safe to clean up later)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Sticky status + publish bar */}
      <SaveStatusBar
        status={saveStatus}
        savedAt={savedAt}
        onRetry={() => save()}
        onPublish={handlePublish}
        isPublishing={isPublishing}
        currentStatus={status}
        publicUrl={slug ? buildPublicUrl(slug, type, categoryId) : undefined}
      />

      {/* Editor body */}
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-8 space-y-7 pb-24 lg:pb-10">

        {/* Slug — read-only, shown after first save */}
        {slug && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-sans text-stone-400">
              <span className="text-stone-300">URL: </span>
              <span className="font-mono text-stone-500">/{slug}</span>
            </p>
            {status === "published" && (
              <a
                href={buildPublicUrl(slug, type, categoryId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-sans font-medium text-brand hover:text-brand-dark hover:underline transition-colors duration-150"
              >
                View →
              </a>
            )}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="post-title" className="sr-only">Title</label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(e) => handleTitle(e.target.value)}
            placeholder="Title…"
            className="block w-full bg-transparent text-2xl sm:text-3xl font-serif font-bold text-stone-900 placeholder-stone-200 border-none outline-none focus:outline-none"
          />
        </div>

        {/* Type + Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Type"
            value={type}
            onChange={(e) => handleType(e.target.value as PostType)}
          >
            <option value="article">Article</option>
            <option value="thirukkural">Thirukkural</option>
            <option value="letter">Letter</option>
            <option value="business_idea">Business Idea</option>
            <option value="linkedin_post">LinkedIn Post</option>
          </Select>

          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => handleCategory(e.target.value)}
            placeholder="— No category —"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        {/* Type-specific meta */}
        <TypeMetaFields type={type} meta={meta} onChange={handleMeta} />

        {/* Markdown content */}
        <div>
          <label className="block text-xs font-sans font-semibold text-stone-400 uppercase tracking-wider mb-2">
            Content
          </label>
          <MarkdownEditor value={content} onChange={handleContent} />
        </div>

        {/* Excerpt */}
        <Textarea
          label="Excerpt"
          value={excerpt}
          onChange={(e) => handleExcerpt(e.target.value)}
          placeholder="Brief summary (auto-generated if left blank)…"
          rows={3}
        />

        {/* Tags */}
        <TagInput
          tags={tags}
          onChange={handleTags}
          suggestions={allTags.map((t) => t.name)}
        />

        {/* Images */}
        <ImageUpload
          postId={postId}
          images={images}
          onAdd={handleImageAdd}
          onRemove={handleImageRemove}
        />

        {/* Bottom publish — useful on mobile */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing || saveStatus === "saving" || !title.trim()}
            className={[
              "rounded-md px-6 py-2.5 text-sm font-sans font-medium",
              "transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              status === "published"
                ? "border border-stone-200 text-stone-600 hover:bg-stone-50"
                : "bg-brand text-white hover:bg-brand-dark",
            ].join(" ")}
          >
            {status === "published" ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
