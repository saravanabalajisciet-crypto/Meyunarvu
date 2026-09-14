/**
 * Server-side Markdown → HTML pipeline.
 *
 * Used by public article pages and the preview pane.
 * On the client the editor uses @uiw/react-md-editor's built-in preview,
 * so this module is server-only.
 *
 * Plugins:
 *   remark-gfm       — tables, task lists, strikethrough, autolinks
 *   rehype-slug      — adds id= anchors to headings
 *   rehype-autolink-headings — adds # anchor links to headings
 *   rehype-highlight — syntax highlighting for code blocks
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { EXCERPT_MAX_CHARS } from "@/config/editor";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, { behavior: "wrap" })
  .use(rehypeHighlight, { detect: true })
  .use(rehypeStringify);

/** Render Markdown to an HTML string (server-side). */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await processor.process(markdown);
  return String(result);
}

/**
 * Extract a plain-text excerpt from Markdown.
 * Strips Markdown syntax, collapses whitespace, and trims to max chars.
 */
export function extractExcerpt(markdown: string, maxChars = EXCERPT_MAX_CHARS): string {
  const plain = markdown
    .replace(/!\[.*?\]\(.*?\)/g, "")   // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1") // links → text
    .replace(/[#*_`~>|-]/g, "")        // markdown symbols
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxChars) return plain;
  const cut = plain.lastIndexOf(" ", maxChars);
  return plain.slice(0, cut > 0 ? cut : maxChars) + "…";
}
