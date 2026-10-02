import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { markdownToHtml } from "@/lib/markdown";
import { buildArticleMetadata } from "@/lib/metadata";
import ShareBar from "@/components/posts/ShareBar";
import FavoriteButton from "@/components/posts/FavoriteButton";
import CommentSection from "@/components/posts/CommentSection";
import { getSessionUser } from "@/lib/dal";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const getLinkedInPost = cache(async (slug: string) => {
  return prisma.post.findUnique({
    where: { slug, status: "published", type: "linkedin_post" },
    include: { linkedInMeta: true },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getLinkedInPost(slug);
  if (!post) return {};
  return buildArticleMetadata({
    title: post.title,
    description: post.excerpt,
    slug: post.slug,
    type: "linkedin_post",
    publishedAt: post.publishedAt,
    canonicalUrl: post.linkedInMeta?.linkedInUrl,
  });
}

export default async function LinkedInPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getLinkedInPost(slug);
  if (!post) notFound();

  const [html, session] = await Promise.all([
    post.content ? markdownToHtml(post.content) : Promise.resolve(""),
    getSessionUser(),
  ]);
  const m = post.linkedInMeta;
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    : null;
  const originalDate = m?.originalDate
    ? new Date(m.originalDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <header className="mb-8 space-y-2">
        <span className="text-xs font-sans font-semibold text-brand uppercase tracking-wider">LinkedIn Post</span>
        <h1 className="text-3xl font-serif font-bold text-stone-900 leading-tight">{post.title}</h1>
        {date && (
          <time dateTime={post.publishedAt?.toISOString()} className="text-xs font-sans text-stone-400">{date}</time>
        )}
      </header>

      {m?.linkedInUrl && (
        <aside className="mb-8 rounded-md border border-stone-200 bg-stone-50 px-5 py-3 flex items-center justify-between gap-4">
          <p className="text-sm font-sans text-stone-500">
            Originally published on LinkedIn{originalDate ? ` · ${originalDate}` : ""}
          </p>
          <a
            href={m.linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-sans font-medium text-brand hover:underline"
          >
            View original →
          </a>
        </aside>
      )}

      {html && <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />}

      <ShareBar title={post.title} slug={post.slug} type="linkedin_post" />

      {/* Favorite */}
      <div className="mt-6 flex items-center gap-3">
        <FavoriteButton postId={post.id} isLoggedIn={!!session} />
      </div>

      {/* Comments */}
      <CommentSection
        postId={post.id}
        isLoggedIn={!!session}
        currentUserId={session?.userId}
        currentUserRole={session?.role}
      />
    </article>
  );
}
