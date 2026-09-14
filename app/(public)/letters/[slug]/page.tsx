import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { markdownToHtml } from "@/lib/markdown";
import { buildArticleMetadata } from "@/lib/metadata";
import ShareBar from "@/components/posts/ShareBar";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const getLetter = cache(async (slug: string) => {
  return prisma.post.findUnique({
    where: { slug, status: "published", type: "letter" },
    include: { letterMeta: true },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getLetter(slug);
  if (!post) return {};
  return buildArticleMetadata({
    title: post.title,
    description: post.excerpt,
    slug: post.slug,
    type: "letter",
    publishedAt: post.publishedAt,
  });
}

export default async function LetterPage({ params }: Props) {
  const { slug } = await params;
  const post = await getLetter(slug);
  if (!post) notFound();

  const m = post.letterMeta;
  const html = post.content ? await markdownToHtml(post.content) : "";
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    : null;
  const letterDate = m?.letterDate
    ? new Date(m.letterDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <header className="mb-8 space-y-2">
        <span className="text-xs font-sans font-semibold text-brand uppercase tracking-wider">Letter</span>
        <h1 className="text-3xl font-serif font-bold text-stone-900 leading-tight">{post.title}</h1>
        <dl className="text-sm font-sans text-stone-500 space-y-1 mt-4">
          {m?.recipient && (
            <div className="flex gap-2">
              <dt className="font-medium text-stone-600 w-24 shrink-0">To</dt>
              <dd>{m.recipient}</dd>
            </div>
          )}
          {letterDate && (
            <div className="flex gap-2">
              <dt className="font-medium text-stone-600 w-24 shrink-0">Date</dt>
              <dd>{letterDate}</dd>
            </div>
          )}
          {m?.responseStatus && (
            <div className="flex gap-2">
              <dt className="font-medium text-stone-600 w-24 shrink-0">Status</dt>
              <dd>{m.responseStatus}</dd>
            </div>
          )}
          {date && (
            <div className="flex gap-2">
              <dt className="font-medium text-stone-600 w-24 shrink-0">Published</dt>
              <dd><time dateTime={post.publishedAt?.toISOString()}>{date}</time></dd>
            </div>
          )}
        </dl>
      </header>

      {html && <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />}

      <ShareBar title={post.title} slug={post.slug} type="letter" />
    </article>
  );
}
