import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { markdownToHtml } from "@/lib/markdown";
import { buildArticleMetadata } from "@/lib/metadata";
import ShareBar from "@/components/posts/ShareBar";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const getIdea = cache(async (slug: string) => {
  return prisma.post.findUnique({
    where: { slug, status: "published", type: "business_idea" },
    include: { businessIdeaMeta: true },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getIdea(slug);
  if (!post) return {};
  return buildArticleMetadata({
    title: post.title,
    description: post.excerpt,
    slug: post.slug,
    type: "business_idea",
    publishedAt: post.publishedAt,
  });
}

export default async function IdeaPage({ params }: Props) {
  const { slug } = await params;
  const post = await getIdea(slug);
  if (!post) notFound();

  const html = post.content ? await markdownToHtml(post.content) : "";
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    : null;
  const notice = post.businessIdeaMeta?.freeUseNotice;

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <header className="mb-8 space-y-2">
        <span className="text-xs font-sans font-semibold text-brand uppercase tracking-wider">Business Idea</span>
        <h1 className="text-3xl font-serif font-bold text-stone-900 leading-tight">{post.title}</h1>
        {date && (
          <time dateTime={post.publishedAt?.toISOString()} className="text-xs font-sans text-stone-400">{date}</time>
        )}
      </header>

      {notice && (
        <aside className="mb-8 rounded-md border border-brand/20 bg-brand-light px-5 py-4">
          <p className="text-sm font-sans text-brand">{notice}</p>
        </aside>
      )}

      {html && <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />}

      <ShareBar title={post.title} slug={post.slug} type="business_idea" />
    </article>
  );
}
