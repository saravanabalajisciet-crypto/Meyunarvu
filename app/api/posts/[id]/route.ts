/**
 * GET    /api/posts/[id]   — get single post (admin: any; public: published only)
 * PATCH  /api/posts/[id]   — update post (admin only; slug field ignored)
 * DELETE /api/posts/[id]   — delete post (admin only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { extractExcerpt } from "@/lib/markdown";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/posts/[id]">
) {
  const { id } = await ctx.params;
  const session = await getSession();
  const isAdmin = session?.role === "admin";

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      images: { orderBy: { displayOrder: "asc" } },
      thirukkuralMeta: true,
      letterMeta: true,
      linkedInMeta: true,
      businessIdeaMeta: true,
    },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && post.status !== "published") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ...post, tags: post.tags.map((pt) => pt.tag) });
}

export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/posts/[id]">
) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // slug intentionally ignored — permanent slug rule
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { slug: _slug, tagIds, status, meta, ...rest } = body;

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (rest.content && !rest.excerpt) {
    rest.excerpt = extractExcerpt(rest.content);
  }

  const publishedAt =
    status === "published" && !existing.publishedAt ? new Date() : undefined;

  // Persist meta for companion tables based on post type
  const type = rest.type ?? existing.type;
  const metaUpserts = await buildMetaUpserts(id, type, meta ?? {});

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...rest,
      ...(status ? { status } : {}),
      ...(publishedAt ? { publishedAt } : {}),
      ...(tagIds != null
        ? { tags: { deleteMany: {}, create: (tagIds as string[]).map((tagId: string) => ({ tagId })) } }
        : {}),
    },
    select: { id: true, slug: true, status: true, updatedAt: true },
  });

  // Run meta upserts after main update (separate statements)
  await metaUpserts();

  return NextResponse.json(post);
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/posts/[id]">
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await prisma.post.delete({ where: { id } }).catch(() => null);
  return new Response(null, { status: 204 });
}

// ---------------------------------------------------------------------------
// Meta upsert builder — returns a function to execute after the post update
// ---------------------------------------------------------------------------
function buildMetaUpserts(
  postId: string,
  type: string,
  meta: Record<string, string>
): () => Promise<void> {
  return async () => {
    if (type === "thirukkural" && (meta.tamilCouplet || meta.englishTranslation)) {
      await prisma.thirukkuralMeta.upsert({
        where: { postId },
        create: {
          postId,
          tamilCouplet: meta.tamilCouplet ?? "",
          englishTranslation: meta.englishTranslation ?? "",
          tamilCommentary: meta.tamilCommentary || null,
          englishCommentary: meta.englishCommentary || null,
          kuralNumber: meta.kuralNumber ? parseInt(meta.kuralNumber) : null,
        },
        update: {
          tamilCouplet: meta.tamilCouplet ?? "",
          englishTranslation: meta.englishTranslation ?? "",
          tamilCommentary: meta.tamilCommentary || null,
          englishCommentary: meta.englishCommentary || null,
          kuralNumber: meta.kuralNumber ? parseInt(meta.kuralNumber) : null,
        },
      });
    }

    if (type === "letter") {
      await prisma.letterMeta.upsert({
        where: { postId },
        create: {
          postId,
          recipient: meta.recipient || null,
          letterDate: meta.letterDate ? new Date(meta.letterDate) : null,
          responseStatus: meta.responseStatus || null,
        },
        update: {
          recipient: meta.recipient || null,
          letterDate: meta.letterDate ? new Date(meta.letterDate) : null,
          responseStatus: meta.responseStatus || null,
        },
      });
    }

    if (type === "linkedin_post" && meta.linkedInUrl) {
      await prisma.linkedInMeta.upsert({
        where: { postId },
        create: {
          postId,
          linkedInUrl: meta.linkedInUrl,
          originalDate: meta.originalDate ? new Date(meta.originalDate) : null,
        },
        update: {
          linkedInUrl: meta.linkedInUrl,
          originalDate: meta.originalDate ? new Date(meta.originalDate) : null,
        },
      });
    }

    if (type === "business_idea") {
      await prisma.businessIdeaMeta.upsert({
        where: { postId },
        create: {
          postId,
          freeUseNotice: meta.freeUseNotice || "These ideas are free for anyone to take and build. No attribution or credit required.",
        },
        update: {
          freeUseNotice: meta.freeUseNotice || "These ideas are free for anyone to take and build. No attribution or credit required.",
        },
      });
    }
  };
}
