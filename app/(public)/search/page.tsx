import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import type { Metadata } from "next";
import type { PostType } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

function postHref(type: PostType, categorySlug: string | null | undefined, slug: string): string {
  if (type === "thirukkural") return `/thirukkural/${slug}`;
  if (type === "letter") return `/letters/${slug}`;
  if (type === "business_idea") return `/ideas/${slug}`;
  if (type === "linkedin_post") return `/linkedin/${slug}`;
  return `/${categorySlug ?? "essays"}/${slug}`;
}

function typeLabel(type: PostType): string {
  const map: Record<PostType, string> = {
    article: "Article",
    thirukkural: "Thirukkural",
    letter: "Letter",
    business_idea: "Business Idea",
    linkedin_post: "LinkedIn",
  };
  return map[type] ?? type;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: "${q}" — Meyunarvu` : "Search — Meyunarvu",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", page: pageStr = "1" } = await searchParams;
  const query = q.trim();
  const page = Math.max(1, parseInt(pageStr));
  const limit = 10;
  const skip = (page - 1) * limit;

  let results: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    type: PostType;
    publishedAt: Date | null;
    category: { name: string; slug: string } | null;
  }[] = [];
  let total = 0;

  if (query) {
    const where = {
      status: "published" as const,
      title: { contains: query, mode: "insensitive" as const },
    };

    [results, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          type: true,
          publishedAt: true,
          category: { select: { name: true, slug: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">

      {/* Search form */}
      <form method="GET" action="/search" className="mb-10">
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search articles by title…"
            autoFocus={!query}
            className="flex-1 rounded-md border border-stone-200 bg-white px-4 py-3 text-base font-sans text-stone-900 placeholder-stone-300 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            className="flex items-center gap-2 rounded-md bg-brand px-5 py-3 text-sm font-sans font-medium text-white hover:bg-brand-dark transition-colors duration-150 shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            Search
          </button>
        </div>
      </form>

      {/* Results header */}
      {query && (
        <div className="mb-6">
          <p className="font-sans text-sm text-stone-400">
            {total === 0
              ? `No results for "${query}"`
              : `${total} result${total !== 1 ? "s" : ""} for "${query}"`}
          </p>
        </div>
      )}

      {/* Results list */}
      {results.length > 0 && (
        <div className="divide-y divide-stone-100">
          {results.map((post) => {
            const href = postHref(post.type, post.category?.slug, post.slug);
            const date = post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
                  year: "numeric", month: "long", day: "numeric",
                })
              : null;
            return (
              <article key={post.id} className="py-7 group">
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  {post.type !== "article" && (
                    <Badge variant="brand">{typeLabel(post.type)}</Badge>
                  )}
                  {post.category && (
                    <span className="font-sans text-xs font-semibold text-brand uppercase tracking-widest">
                      {post.category.name}
                    </span>
                  )}
                  {date && (
                    <time className="font-sans text-xs text-stone-400">{date}</time>
                  )}
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 leading-snug mb-2 group-hover:text-brand transition-colors duration-150">
                  <Link href={href}>{post.title}</Link>
                </h2>
                {post.excerpt && (
                  <p className="font-serif text-stone-500 text-base leading-relaxed line-clamp-2 mb-3">
                    {post.excerpt}
                  </p>
                )}
                <Link
                  href={href}
                  className="font-sans text-xs font-medium text-brand hover:text-brand-dark transition-colors duration-150"
                >
                  Read →
                </Link>
              </article>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {query && results.length === 0 && (
        <div className="py-16 text-center">
          <p className="font-serif text-stone-400 text-lg mb-2">No articles matched your search.</p>
          <p className="font-sans text-stone-400 text-sm">Try a different title or browse by category below.</p>
          <Link href="/" className="mt-4 inline-block font-sans text-sm text-brand hover:text-brand-dark transition-colors duration-150">
            ← Back to home
          </Link>
        </div>
      )}

      {/* No query state */}
      {!query && (
        <div className="py-16 text-center">
          <p className="font-serif text-stone-400 text-lg">Enter a title to search.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Search results pagination">
          {page > 1 && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
              className="share-btn"
            >
              ← Previous
            </Link>
          )}
          <span className="font-sans text-sm text-stone-400">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
              className="share-btn"
            >
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
