/**
 * GET  /api/categories  — list all categories (public)
 * POST /api/categories  — create a category (admin only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { makeSlug } from "@/lib/slugify";

export async function GET() {
  try {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  return NextResponse.json(categories);

  } catch (err) {
    console.error("[GET /api/categories]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
  const session = await getSession();
  if (!session || session.role !== "admin") {
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

  } catch (err) {
    console.error("[POST /api/categories]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
