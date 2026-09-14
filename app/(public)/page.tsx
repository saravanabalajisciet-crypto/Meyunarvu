import { prisma } from "@/lib/prisma";
import PostCard from "@/components/posts/PostCard";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  openGraph: { url: siteConfig.url, type: "website" },
};

async function getRecentPosts() {
  return prisma.post.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 12,
    select: {
      id: true, title: true, slug: true, excerpt: true,
      publishedAt: true, type: true,
      category: { select: { name: true, slug: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });
}

async function getCategories() {
  return prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { posts: { where: { status: "published" } } } } },
  });
}

export default async function HomePage() {
  const [posts, categories] = await Promise.all([getRecentPosts(), getCategories()]);
  const flatPosts = posts.map((p) => ({ ...p, tags: p.tags.map((pt) => pt.tag) }));
  const nonEmptyCategories = categories.filter((c) => c._count.posts > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">

      {/* Hero */}
      <section className="pt-14 pb-10 border-b border-stone-100">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 leading-tight tracking-tight mb-4">
          {siteConfig.name}
        </h1>
        <p className="font-serif text-lg text-stone-500 leading-relaxed max-w-xl">
          {siteConfig.description}
        </p>
      </section>

      {/* Category pills */}
      {nonEmptyCategories.length > 0 && (
        <section className="py-6 border-b border-stone-100" aria-label="Browse by category">
          <div className="flex flex-wrap gap-2">
            {nonEmptyCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-1.5 text-sm font-sans text-stone-600 hover:border-brand hover:text-brand hover:bg-brand-light transition-colors duration-150"
              >
                {cat.name}
                <span className="text-xs text-stone-300 tabular-nums">{cat._count.posts}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Posts list */}
      <section aria-label="Recent posts" className="pb-16">
        {flatPosts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-serif text-stone-400 text-lg mb-2">Nothing published yet.</p>
            <p className="font-sans text-stone-400 text-sm">Check back soon.</p>
          </div>
        ) : (
          <div>
            {flatPosts.map((post) => (
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
      </section>
    </div>
  );
}
