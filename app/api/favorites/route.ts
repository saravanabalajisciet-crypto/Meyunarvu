/**
 * GET  /api/favorites          — list current user's favorited posts (authenticated)
 * POST /api/favorites          — favorite a post (authenticated, idempotent)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            type: true,
            publishedAt: true,
            status: true,
            category: { select: { name: true, slug: true } },
            tags: { select: { tag: { select: { name: true, slug: true } } } },
          },
        },
      },
    }),
    prisma.favorite.count({ where: { userId: session.userId } }),
  ]);

  // Only return published posts (defensive — post may have been un-published)
  const publishedFavorites = favorites
    .filter((f) => f.post.status === "published")
    .map((f) => ({
      ...f,
      post: { ...f.post, tags: f.post.tags.map((pt) => pt.tag) },
    }));

  return NextResponse.json({ favorites: publishedFavorites, total, page, limit });
  } catch (err) {
    console.error("[GET /api/favorites]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const postId = body?.postId;

  if (!postId || typeof postId !== "string") {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  // Verify the post is published
  const post = await prisma.post.findUnique({
    where: { id: postId, status: "published" },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Upsert — idempotent, safe to call multiple times
  const favorite = await prisma.favorite.upsert({
    where: { userId_postId: { userId: session.userId, postId } },
    update: {},
    create: { userId: session.userId, postId },
  });

  return NextResponse.json({ favorite }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/favorites]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}