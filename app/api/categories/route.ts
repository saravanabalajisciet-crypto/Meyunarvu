/**
 * GET  /api/categories  — list all categories (public)
 * POST /api/categories  — create a category (admin only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { makeSlug } from "@/lib/slugify";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const slug = body.slug || makeSlug(body.name);

  const category = await prisma.category.create({
    data: {
      name: body.name,
      slug,
      description: body.description ?? null,
      order: body.order ?? 0,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
