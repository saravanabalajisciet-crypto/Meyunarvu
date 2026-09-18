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
    take: 4,
    select: {
      id: true, title: true, slug: true, excerpt: true,
      publishedAt: true, type: true,
      category: { select: { name: true, slug: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });
}

async function getAllPosts() {
  return prisma.post.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
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
  const [recentPosts, allPosts, categories] = await Promise.all([
    getRecentPosts(),
    getAllPosts(),
    getCategories(),
  ]);

  const flatRecent = recentPosts.map((p) => ({ ...p, tags: p.tags.map((pt) => pt.tag) }));
  const flatAll = allPosts.map((p) => ({ ...p, tags: p.tags.map((pt) => pt.tag) }));
  const nonEmptyCategories = categories.filter((c) => c._count.posts > 0);

  // Only show "Recently Published" section when there are posts
  const hasRecentPosts = flatRecent.length > 0;
  // Posts beyond the first 4 — shown in the full list below
  const olderPosts = flatAll.slice(4);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-14 pb-10 border-b border-stone-100">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 leading-tight tracking-tight mb-4">
          {siteConfig.name}
        </h1>
        <p className="font-serif text-lg text-stone-500 leading-relaxed max-w-xl">
          {siteConfig.description}
        </p>
      </section>

      {/* ── Recently Published ────────────────────────────────────────────── */}
      {hasRecentPosts && (
        <section aria-label="Recently published" className="pt-10 pb-4 border-b border-stone-100">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-stone-400 mb-6">
            Recently Published
          </h2>
          <div>
            {flatRecent.map((post) => (
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
        </section>
      )}

      {/* ── Categories ────────────────────────────────────────────────────── */}
      {nonEmptyCategories.length > 0 && (
        <section aria-label="Browse by category" className="py-10 border-b border-stone-100">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-stone-400 mb-6">
            Browse by Category
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {nonEmptyCategories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/${cat.slug}`}
                  className="group flex items-center justify-between gap-2 rounded border border-stone-150 px-4 py-3 hover:border-brand hover:bg-brand-light transition-colors duration-150"
                >
                  <span className="font-sans text-sm text-stone-700 group-hover:text-brand transition-colors duration-150 leading-snug">
                    {cat.name}
                  </span>
                  <span className="font-sans text-xs tabular-nums text-stone-300 group-hover:text-brand/60 transition-colors duration-150 shrink-0">
                    {cat._count.posts}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Older writing ─────────────────────────────────────────────────── */}
      {olderPosts.length > 0 && (
        <section aria-label="More writing" className="pb-16">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-stone-400 pt-10 mb-6">
            More Writing
          </h2>
          <div>
            {olderPosts.map((post) => (
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
        </section>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {flatAll.length === 0 && (
        <div className="py-24 text-center">
          <p className="font-serif text-stone-400 text-lg mb-2">Nothing published yet.</p>
          <p className="font-sans text-stone-400 text-sm">Check back soon.</p>
        </div>
      )}

    </div>
  );
}
