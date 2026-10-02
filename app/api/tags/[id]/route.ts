/**
 * PATCH  /api/tags/[id]  — rename a tag (admin only)
 * DELETE /api/tags/[id]  — delete a tag (admin only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { makeSlug } from "@/lib/slugify";

export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/tags/[id]">
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const tag = await prisma.tag.update({
    where: { id },
    data: { name: body.name, slug: body.slug ?? makeSlug(body.name) },
  });

  return NextResponse.json(tag);
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/tags/[id]">
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await prisma.tag.delete({ where: { id } }).catch(() => null);
  return new Response(null, { status: 204 });
}
