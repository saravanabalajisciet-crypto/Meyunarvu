import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { buildArticleMetadata } from "@/lib/metadata";
import { markdownToHtml } from "@/lib/markdown";
import KuralDetail from "@/components/thirukkural/KuralDetail";
import ShareBar from "@/components/posts/ShareBar";
import FavoriteButton from "@/components/posts/FavoriteButton";
import CommentSection from "@/components/posts/CommentSection";
import Link from "next/link";
import { getSessionUser } from "@/lib/dal";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const getKural = cache(async (slug: string) => {
  return prisma.post.findUnique({
    where: { slug, status: "published", type: "thirukkural" },
    include: { thirukkuralMeta: true },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getKural(slug);
  if (!post) return {};
  return buildArticleMetadata({
    title: post.title,
    description: post.excerpt,
    slug: post.slug,
    type: "thirukkural",
    publishedAt: post.publishedAt,
  });
}

export default async function KuralPage({ params }: Props) {
  const { slug } = await params;
  const post = await getKural(slug);
  if (!post || !post.thirukkuralMeta) notFound();

  const m = post.thirukkuralMeta;
  const [commentaryHtml, session] = await Promise.all([
    post.content ? markdownToHtml(post.content) : Promise.resolve(null),
    getSessionUser(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <article className="py-12 sm:py-16">

        {/* Back link */}
        <div className="mb-10">
          <Link
            href="/thirukkural"
            className="text-xs font-sans font-semibold text-brand uppercase tracking-[0.15em] hover:text-brand-dark transition-colors duration-150"
          >
            ← Thirukkural
          </Link>
        </div>

        {/* Title */}
        <header className="mb-10">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug mb-2">
            {post.title}
          </h1>
          {post.publishedAt && (
            <time
              dateTime={post.publishedAt.toISOString()}
              className="text-xs font-sans text-stone-400"
            >
              {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </time>
          )}
        </header>

        {/* Bilingual couplet + commentary */}
        <KuralDetail
          kuralNumber={m.kuralNumber}
          tamilCouplet={m.tamilCouplet}
          englishTranslation={m.englishTranslation}
          tamilCommentary={m.tamilCommentary}
          englishCommentary={m.englishCommentary}
        />

        {/* Optional extra prose content */}
        {commentaryHtml && (
          <div
            className="prose mt-10 pt-10 border-t border-stone-100"
            dangerouslySetInnerHTML={{ __html: commentaryHtml }}
          />
        )}

        <ShareBar title={post.title} slug={post.slug} type="thirukkural" />

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
    </div>
  );
}
