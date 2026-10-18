/**
 * PATCH  /api/categories/[id]  — update category (admin only)
 * DELETE /api/categories/[id]  — delete category (admin only)
 *
 * The six system content-type slugs (kids-stories, short-stories, leadership,
 * essays, business-ideas, others) are protected from deletion to prevent
 * accidental loss of content organisation.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/** Slugs that map to the six required content types — protected from deletion. */
const SYSTEM_SLUGS = new Set([
  "kids-stories",
  "short-stories",
  "leadership",
  "essays",
  "business-ideas",
  "others",
]);

export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/categories/[id]">
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(body.name != null ? { name: body.name } : {}),
      ...(body.slug != null ? { slug: body.slug } : {}),
      ...(body.description != null ? { description: body.description } : {}),
      ...(body.order != null ? { order: body.order } : {}),
    },
  });

  return NextResponse.json(category);
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/categories/[id]">
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  // Fetch the slug first so we can guard system content types
  const existing = await prisma.category.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (SYSTEM_SLUGS.has(existing.slug)) {
    return NextResponse.json(
      { error: "System content types cannot be deleted." },
      { status: 403 }
    );
  }

  await prisma.category.delete({ where: { id } }).catch(() => null);
  return new Response(null, { status: 204 });
}
