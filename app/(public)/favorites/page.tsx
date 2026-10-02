import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import PostCard from "@/components/posts/PostCard";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Favorites — Meyunarvu",
};

export default async function FavoritesPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          type: true,
          publishedAt: true,
          status: true,
          category: { select: { name: true, slug: true } },
          tags: { select: { tag: { select: { name: true, slug: true } } } },
        },
      },
    },
  });

  // Only show published posts
  const publishedFavorites = favorites
    .filter((f) => f.post.status === "published")
    .map((f) => ({
      ...f.post,
      tags: f.post.tags.map((pt) => pt.tag),
    }));

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">

      <div className="mb-10">
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">My Favorites</h1>
        <p className="font-serif text-stone-400 text-base">
          {publishedFavorites.length > 0
            ? `${publishedFavorites.length} saved article${publishedFavorites.length !== 1 ? "s" : ""}`
            : "Articles you save will appear here."}
        </p>
      </div>

      {publishedFavorites.length === 0 ? (
        <div className="py-16 text-center rounded-lg border border-dashed border-stone-200">
          <p className="font-serif text-stone-400 text-lg mb-2">No favorites yet.</p>
          <p className="font-sans text-stone-400 text-sm mb-6">
            Tap the heart on any article to save it here.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-sans font-medium text-white hover:bg-brand-dark transition-colors duration-150"
          >
            Browse articles
          </Link>
        </div>
      ) : (
        <div>
          {publishedFavorites.map((post) => (
            <PostCard
              key={post.id}
              title={post.title}
              slug={post.slug}
              excerpt={post.excerpt}
              publishedAt={post.publishedAt}
              categorySlug={post.category?.slug}
              type={post.type}
              tags={post.tags}
            />
          ))}
        </div>
      )}
    </div>
  );
}
