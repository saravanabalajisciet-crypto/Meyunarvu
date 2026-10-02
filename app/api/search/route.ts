/**
 * GET /api/search?q=<query>&page=<n>&limit=<n>
 *
 * Public endpoint — no auth required.
 * Searches published posts by title (case-insensitive partial match).
 * Never returns drafts, manuscripts, or private content.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "10"));
  const skip = (page - 1) * limit;

  // Empty query — return empty results (not an error)
  if (!q) {
    return NextResponse.json({ results: [], total: 0, page, limit, q });
  }

  const where = {
    status: "published" as const,
    title: { contains: q, mode: "insensitive" as const },
  };

  const [results, total] = await Promise.all([
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

  return NextResponse.json({ results, total, page, limit, q });
}
