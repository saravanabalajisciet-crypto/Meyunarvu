/**
 * GET    /api/favorites/[postId]  — check if current user has favorited this post
 * DELETE /api/favorites/[postId]  — unfavorite a post (owner only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ postId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ isFavorited: false });
  }

  const { postId } = await ctx.params;

  const favorite = await prisma.favorite.findUnique({
    where: { userId_postId: { userId: session.userId, postId } },
    select: { postId: true },
  });

  return NextResponse.json({ isFavorited: !!favorite });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ postId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await ctx.params;

  // Delete only if the record belongs to the current user (never trust client userId)
  await prisma.favorite
    .delete({ where: { userId_postId: { userId: session.userId, postId } } })
    .catch(() => null); // silently ignore if it doesn't exist

  return new Response(null, { status: 204 });
}
