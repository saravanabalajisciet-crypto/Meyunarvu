/**
 * GET  /api/posts  — list posts (admin: all; no session: published only)
 * POST /api/posts  — create a new post (admin only)
 *
 * Slug is generated server-side on creation and never updated by PATCH.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { makeSlug, uniqueSlug } from "@/lib/slugify";
import { extractExcerpt } from "@/lib/markdown";
import type { PostType } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getSession();
  const isAdmin = session?.role === "admin";

  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");
  const typeParam = searchParams.get("type") as PostType | null;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;

  const where = {
    ...(isAdmin ? {} : { status: "published" as const }),
    ...(categorySlug
      ? { category: { slug: categorySlug } }
      : {}),
    ...(typeParam ? { type: typeParam } : {}),
  };

  const [posts, total] = await Promise.all([
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
        status: true,
        type: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { name: true, slug: true } },
        tags: { select: { tag: { select: { name: true, slug: true } } } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  // Flatten tag join
  const result = posts.map((p) => ({
    ...p,
    tags: p.tags.map((pt) => pt.tag),
  }));

  return NextResponse.json({ posts: result, total, page, limit });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const { title, content, excerpt, type = "article", categoryId, tagIds = [] } = body;

  // Generate unique slug — never from the client
  const existingSlugs = (
    await prisma.post.findMany({ select: { slug: true } })
  ).map((p) => p.slug);
  const slug = uniqueSlug(makeSlug(title), existingSlugs);

  const autoExcerpt =
    excerpt || (content ? extractExcerpt(content) : null) || null;

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content: content ?? null,
      excerpt: autoExcerpt,
      type,
      status: "draft",
      categoryId: categoryId ?? null,
      // CP3: associate post with the creating user (null for env-admin fallback)
      authorId: session.userId.startsWith("env-admin:") ? null : session.userId,
      tags: {
        create: (tagIds as string[]).map((tagId: string) => ({ tagId })),
      },
    },
    select: { id: true, slug: true, status: true, type: true },
  });

  return NextResponse.json(post, { status: 201 });
}
