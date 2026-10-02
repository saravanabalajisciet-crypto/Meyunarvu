/**
 * GET  /api/tags  — list all tags (public)
 * POST /api/tags  — create a tag (admin only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { makeSlug } from "@/lib/slugify";

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  return NextResponse.json(tags);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const slug = body.slug || makeSlug(body.name);

  // Upsert — tags are auto-created from TagInput, duplicates are fine
  const tag = await prisma.tag.upsert({
    where: { slug },
    update: {},
    create: { name: body.name, slug },
  });

  return NextResponse.json(tag, { status: 201 });
}
