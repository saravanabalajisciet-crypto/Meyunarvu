import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import type { PostType } from "@prisma/client";

interface ArticleMetaInput {
  title: string;
  description?: string | null;
  slug: string;
  type?: PostType;
  categorySlug?: string | null;
  publishedAt?: Date | string | null;
  /** For LinkedIn reposts — the original canonical URL */
  canonicalUrl?: string | null;
}

function buildPostUrl(type: PostType | undefined, categorySlug: string | null | undefined, slug: string): string {
  if (type === "thirukkural") return `${siteConfig.url}/thirukkural/${slug}`;
  if (type === "letter") return `${siteConfig.url}/letters/${slug}`;
  if (type === "business_idea") return `${siteConfig.url}/ideas/${slug}`;
  if (type === "linkedin_post") return `${siteConfig.url}/linkedin/${slug}`;
  return `${siteConfig.url}/${categorySlug ?? "articles"}/${slug}`;
}

export function buildArticleMetadata({
  title,
  description,
  slug,
  type,
  categorySlug,
  publishedAt,
  canonicalUrl,
}: ArticleMetaInput): Metadata {
  const pageUrl = buildPostUrl(type, categorySlug, slug);
  // LinkedIn posts preserve the original as canonical
  const effectiveCanonical = type === "linkedin_post" && canonicalUrl ? canonicalUrl : pageUrl;

  return {
    title,
    description: description ?? undefined,
    alternates: { canonical: effectiveCanonical },
    openGraph: {
      title,
      description: description ?? undefined,
      url: pageUrl,
      type: "article",
      ...(publishedAt ? { publishedTime: new Date(publishedAt).toISOString() } : {}),
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description ?? undefined,
    },
    // Private content (manuscripts) should be noindex — handled per-page
    robots: { index: true, follow: true },
  };
}

export function buildCategoryMetadata(categoryName: string, categorySlug: string): Metadata {
  const title = `${categoryName} — ${siteConfig.name}`;
  const url = `${siteConfig.url}/${categorySlug}`;
  return {
    title,
    alternates: { canonical: url },
    openGraph: { title, url, siteName: siteConfig.name },
  };
}
