import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { markdownToHtml } from "@/lib/markdown";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview Post — Admin" };

async function getPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
      images: { orderBy: { displayOrder: "asc" } },
      thirukkuralMeta: true,
      letterMeta: true,
      linkedInMeta: true,
      businessIdeaMeta: true,
    },
  });
}

export default async function AdminPostPreviewPage(
  props: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await props.params;
  const post = await getPost(id);
  if (!post) notFound();

  const html = post.content ? await markdownToHtml(post.content) : "";
  const tags = post.tags.map((pt) => pt.tag);
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Sticky top bar ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-sm font-sans text-stone-500 hover:text-stone-900 transition-colors duration-150 shrink-0"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm font-medium text-stone-700 truncate hidden sm:block">
              {post.title}
            </p>
          </div>

          <Badge variant={post.status === "published" ? "published" : "draft"}>
            {post.status}
          </Badge>

          <Link
            href={`/admin/posts/${post.id}/edit`}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-md bg-brand text-white text-sm font-sans font-medium hover:bg-brand-dark transition-colors duration-150 shrink-0"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </Link>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 book-surface reading-safe">
        {/* Status notice for drafts */}
        {post.status === "draft" && (
          <div className="mb-8 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2">
            <svg
              className="h-4 w-4 text-amber-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <p className="font-sans text-sm text-amber-700">
              This post is a <strong>draft</strong> — not visible to readers.
            </p>
          </div>
        )}

        {/* Category + Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {post.category && (
            <span className="font-sans text-xs font-semibold text-brand uppercase tracking-widest">
              {post.category.name}
            </span>
          )}
          {tags.map((tag) => (
            <Badge key={tag.slug} variant="tag">
              {tag.name}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight tracking-tight mb-4">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="font-serif text-lg text-stone-500 italic leading-relaxed mb-5">
            {post.excerpt}
          </p>
        )}

        {/* Date */}
        {date && (
          <time
            dateTime={post.publishedAt?.toISOString()}
            className="block text-sm font-sans text-stone-400 mb-8"
          >
            Published {date}
          </time>
        )}

        {/* Decorative divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-stone-300 text-xl select-none" aria-hidden>
            ❧
          </span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        {/* Featured image */}
        {post.images[0] && (
          <figure className="mb-10 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.images[0].url}
              alt={post.images[0].altText ?? post.title}
              className="w-full object-cover max-h-[480px]"
            />
          </figure>
        )}

        {/* Body */}
        {html ? (
          <div
            className="prose prose-book"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="font-sans text-stone-400 text-sm italic py-8">
            No content yet.
          </p>
        )}

        {/* Bottom actions */}
        <div className="mt-12 pt-8 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm font-sans text-stone-500 hover:text-stone-900 transition-colors duration-150"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to dashboard
          </Link>
          <Link
            href={`/admin/posts/${post.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-5 py-2 text-sm font-sans font-medium text-white hover:bg-brand-dark transition-colors duration-150"
          >
            Edit this post
          </Link>
        </div>
      </div>
    </div>
  );
}