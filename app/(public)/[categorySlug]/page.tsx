import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PostCard from "@/components/posts/PostCard";
import { buildCategoryMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ categorySlug: string }> };

async function getCategory(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

async function getCategoryPosts(categorySlug: string) {
  return prisma.post.findMany({
    where: { status: "published", category: { slug: categorySlug } },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true, title: true, slug: true, excerpt: true,
      publishedAt: true, type: true,
      category: { select: { name: true, slug: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategory(categorySlug);
  if (!category) return {};
  return buildCategoryMetadata(category.name, category.slug);
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const [category, posts] = await Promise.all([
    getCategory(categorySlug),
    getCategoryPosts(categorySlug),
  ]);
  if (!category) notFound();

  const flatPosts = posts.map((p) => ({ ...p, tags: p.tags.map((pt) => pt.tag) }));

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      {/* Header */}
      <header className="pt-12 pb-8 border-b border-stone-100">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 font-serif text-stone-500 text-lg leading-relaxed">
            {category.description}
          </p>
        )}
        <p className="mt-3 font-sans text-sm text-stone-400">
          {flatPosts.length} {flatPosts.length === 1 ? "post" : "posts"}
        </p>
      </header>

      {/* Posts */}
      <section className="pb-16">
        {flatPosts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-serif text-stone-400 text-lg">Nothing in this category yet.</p>
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
