import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import type { PostType } from "@prisma/client";

// Sitemap is generated at request time (server-side, not build-time static export)
export const dynamic = "force-dynamic";

function postUrl(type: PostType, categorySlug: string | null | undefined, slug: string): string {
  if (type === "thirukkural") return `${siteConfig.url}/thirukkural/${slug}`;
  if (type === "letter")       return `${siteConfig.url}/letters/${slug}`;
  if (type === "business_idea") return `${siteConfig.url}/ideas/${slug}`;
  if (type === "linkedin_post") return `${siteConfig.url}/linkedin/${slug}`;
  return `${siteConfig.url}/${categorySlug ?? "articles"}/${slug}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Guard: if no DB is connected yet, return minimal sitemap
  if (!process.env.DATABASE_URL) {
    return [{ url: siteConfig.url, lastModified: new Date() }];
  }

  const { prisma } = await import("@/lib/prisma");

  const [posts, categories] = await Promise.all([
    prisma.post.findMany({
      where: { status: "published" },
      select: {
        slug: true, type: true, updatedAt: true,
        category: { select: { slug: true } },
      },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.category.findMany({ select: { slug: true, createdAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteConfig.url}/thirukkural`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${siteConfig.url}/${cat.slug}`,
    lastModified: cat.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: postUrl(post.type, post.category?.slug, post.slug),
    lastModified: post.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...postRoutes];
}
