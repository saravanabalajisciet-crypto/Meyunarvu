/**
 * Site-wide configuration.
 * All values come from environment variables so they are changeable without code edits.
 */

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Meyunarvu",
  authorName: process.env.NEXT_PUBLIC_AUTHOR_NAME || "Author",
  /** Canonical base URL — no trailing slash */
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://meyunarvu.vercel.app",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "A personal publishing platform.",
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE ?? "",
} as const;
