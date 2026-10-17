import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

// Content is private — the sitemap advertises only the login page.
// (No post slugs, no categories, no DB query.)
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteConfig.url}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
