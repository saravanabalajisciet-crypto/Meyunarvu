/**
 * PATCH  /api/categories/[id]  — update category (admin only)
 * DELETE /api/categories/[id]  — delete category (admin only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/categories/[id]">
) {
  const session = await getSession();
  if (!session?.isAdmin) {
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
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await prisma.category.delete({ where: { id } }).catch(() => null);
  return new Response(null, { status: 204 });
}
