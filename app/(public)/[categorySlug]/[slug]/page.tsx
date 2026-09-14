import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { markdownToHtml } from "@/lib/markdown";
import { buildArticleMetadata } from "@/lib/metadata";
import ShareBar from "@/components/posts/ShareBar";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ categorySlug: string; slug: string }> };

const getPost = cache(async (slug: string) => {
  return prisma.post.findUnique({
    where: { slug, status: "published" },
    include: {
      category: { select: { name: true, slug: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
      images: { orderBy: { displayOrder: "asc" } },
    },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return buildArticleMetadata({
    title: post.title,
    description: post.excerpt,
    slug: post.slug,
    type: post.type,
    categorySlug: post.category?.slug,
    publishedAt: post.publishedAt,
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const html = post.content ? await markdownToHtml(post.content) : "";
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;
  const tags = post.tags.map((pt) => pt.tag);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <article className="py-12 sm:py-16">

        {/* Breadcrumb */}
        {post.category && (
          <div className="mb-8">
            <Link
              href={`/${post.category.slug}`}
              className="text-xs font-sans font-semibold text-brand uppercase tracking-widest hover:text-brand-dark transition-colors duration-150"
            >
              {post.category.name}
            </Link>
          </div>
        )}

        {/* Title */}
        <header className="mb-8 max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 leading-tight tracking-tight mb-5">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="font-serif text-xl text-stone-500 leading-relaxed mb-5">
              {post.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {date && (
              <time
                dateTime={post.publishedAt?.toISOString()}
                className="text-sm font-sans text-stone-400"
              >
                {date}
              </time>
            )}
            {tags.length > 0 && <span className="text-stone-200" aria-hidden>·</span>}
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag.slug} variant="tag">{tag.name}</Badge>
            ))}
          </div>
        </header>

        {/* Featured image */}
        {post.images[0] && (
          <figure className="mb-10 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.images[0].url}
              alt={post.images[0].altText ?? post.title}
              className="w-full object-cover max-h-[520px]"
            />
          </figure>
        )}

        {/* Body */}
        {html ? (
          <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="font-sans text-stone-400 text-sm italic py-8">No content yet.</p>
        )}

        {/* All tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-10 pt-8 border-t border-stone-100">
            {tags.map((tag) => (
              <Badge key={tag.slug} variant="tag">{tag.name}</Badge>
            ))}
          </div>
        )}

        {/* Share */}
        <ShareBar
          title={post.title}
          slug={post.slug}
          type={post.type}
          categorySlug={post.category?.slug}
        />
      </article>
    </div>
  );
}
