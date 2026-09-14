import Link from "next/link";
import Badge from "@/components/ui/Badge";
import type { PostType } from "@prisma/client";

interface PostCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | string | null;
  categorySlug?: string | null;
  type: PostType;
  tags?: { name: string; slug: string }[];
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

function postHref(type: PostType, categorySlug: string | null | undefined, slug: string): string {
  if (type === "thirukkural") return `/thirukkural/${slug}`;
  if (type === "letter") return `/letters/${slug}`;
  if (type === "business_idea") return `/ideas/${slug}`;
  if (type === "linkedin_post") return `/linkedin/${slug}`;
  return `/${categorySlug ?? "essays"}/${slug}`;
}

export default function PostCard({
  title,
  slug,
  excerpt,
  publishedAt,
  categorySlug,
  type,
  tags = [],
}: PostCardProps) {
  const href = postHref(type, categorySlug, slug);
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <article className="group py-8 border-b border-stone-100 last:border-0">
      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2.5 mb-3">
        {type !== "article" && (
          <Badge variant="brand">{typeLabel(type)}</Badge>
        )}
        {date && (
          <time
            dateTime={new Date(publishedAt!).toISOString()}
            className="text-xs font-sans text-stone-400 tracking-wide"
          >
            {date}
          </time>
        )}
      </div>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 leading-snug mb-3 group-hover:text-brand transition-colors duration-150">
        <Link href={href} className="focus-visible:outline-none focus-visible:underline">
          {title}
        </Link>
      </h2>

      {/* Excerpt */}
      {excerpt && (
        <p className="text-stone-500 font-serif text-base leading-relaxed line-clamp-2 mb-4">
          {excerpt}
        </p>
      )}

      {/* Tags + Read link */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((tag) => (
            <Badge key={tag.slug} variant="tag">
              {tag.name}
            </Badge>
          ))}
        </div>
        <Link
          href={href}
          className="shrink-0 text-xs font-sans font-medium text-brand hover:text-brand-dark transition-colors duration-150"
          tabIndex={-1}
          aria-hidden
        >
          Read →
        </Link>
      </div>
    </article>
  );
}
