/**
 * Slug generation.
 *
 * Rules:
 * - Generated once on first save; never auto-changed when title is edited.
 * - The API route for PATCH ignores any `slug` field in the request body.
 */

import slugifyLib from "slugify";

/**
 * Convert a title to a URL-safe slug.
 * Handles Tamil and other Unicode characters by falling back to a simple
 * transliteration / stripping pass — preserving ASCII slug readability
 * for English titles.
 */
export function makeSlug(title: string): string {
  return slugifyLib(title, {
    lower: true,
    strict: true,    // strips everything that isn't alphanumeric or separator
    trim: true,
    locale: "en",
  });
}

/**
 * Given a desired slug and a list of existing slugs, append a numeric
 * suffix until unique.  e.g. "my-post" → "my-post-2" → "my-post-3"
 */
export function uniqueSlug(desired: string, existing: string[]): string {
  if (!existing.includes(desired)) return desired;
  let n = 2;
  while (existing.includes(`${desired}-${n}`)) n++;
  return `${desired}-${n}`;
}
