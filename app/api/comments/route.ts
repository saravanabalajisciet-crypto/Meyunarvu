/**
 * GET  /api/comments?postId=<id>  — list comments for a post (public)
 * POST /api/comments              — create a comment or reply (authenticated)
 *
 * Notification logic on POST:
 *
 * COMMENT_ON_POST:
 *   - If post.authorId exists and is not the commenter → notify the post author.
 *   - If post.authorId is null (legacy content) → notify the admin user as fallback.
 *     If the commenter IS the admin fallback recipient, no notification is created.
 *
 * REPLY_TO_COMMENT:
 *   - Notify the parent comment author.
 *   - Skip if the replier IS the parent comment author (no self-notifications).
 *
 * Payload includes postSlug, postType, and categorySlug so the UI can navigate
 * directly to the post URL without an extra lookup.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const MAX_COMMENT_LENGTH = 2000;

/** Build the public post URL from type + category slug + slug. */
function postHref(
  type: string,
  categorySlug: string | null | undefined,
  slug: string
): string {
  if (type === "thirukkural") return `/thirukkural/${slug}`;
  if (type === "letter") return `/letters/${slug}`;
  if (type === "business_idea") return `/ideas/${slug}`;
  if (type === "linkedin_post") return `/linkedin/${slug}`;
  return `/${categorySlug ?? "essays"}/${slug}`;
}

export async function GET(req: Request) {
  try {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  // Verify the post exists and is published
  const post = await prisma.post.findUnique({
    where: { id: postId, status: "published" },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch top-level comments with their replies (one level deep)
  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ comments });
  } catch (err) {
    console.error("[GET /api/comments]", err);
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
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { postId, parentId, content } = body as {
    postId?: string;
    parentId?: string;
    content?: string;
  };

  if (!postId || typeof postId !== "string") {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  if (content.trim().length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `Comment must be ${MAX_COMMENT_LENGTH} characters or less` },
      { status: 400 }
    );
  }

  // Verify the post is published — fetch fields needed for notification payload
  const post = await prisma.post.findUnique({
    where: { id: postId, status: "published" },
    select: {
      id: true,
      slug: true,
      type: true,
      authorId: true,
      category: { select: { slug: true } },
    },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Verify parent comment belongs to this post (if replying) — prevents cross-post replies
  let parentComment: { id: string; userId: string } | null = null;
  if (parentId) {
    parentComment = await prisma.comment.findUnique({
      where: { id: parentId, postId },   // postId scoping prevents cross-post replies
      select: { id: true, userId: true },
    });
    if (!parentComment) {
      return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
    }
  }

  // Create the comment — userId always from session, never from client
  const comment = await prisma.comment.create({
    data: {
      postId,
      userId: session.userId,
      parentId: parentId ?? null,
      content: content.trim(),
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  // ── Notification logic ───────────────────────────────────────────────────
  // If the session userId is a synthetic env-admin placeholder (pre-seed),
  // actor name lookup would fail. Resolve it to the real DB admin if possible.
  const isEnvAdmin = session.userId.startsWith("env-admin:");

  let resolvedActorId = session.userId;
  let actorName = "Someone";

  if (isEnvAdmin) {
    // Try to resolve the env-admin to the real DB admin record
    const envEmail = session.userId.replace("env-admin:", "");
    const dbAdmin = await prisma.user.findUnique({
      where: { email: envEmail },
      select: { id: true, name: true },
    });
    if (dbAdmin) {
      resolvedActorId = dbAdmin.id;
      actorName = dbAdmin.name;
    }
    // If no DB record yet, resolvedActorId stays as the synthetic placeholder
    // and notifications won't be created (fallback guard below handles this)
  } else {
    const actor = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true },
    });
    actorName = actor?.name ?? "Someone";
  }

  // Build navigation payload — enough for the UI to construct a direct post URL
  const postHrefValue = postHref(post.type, post.category?.slug, post.slug);
  const basePayload = {
    postId: post.id,
    postSlug: post.slug,
    postType: post.type,
    categorySlug: post.category?.slug ?? null,
    postHref: postHrefValue,
    commentId: comment.id,
    actorId: resolvedActorId,
    actorName,
  };

  if (parentComment) {
    // REPLY_TO_COMMENT: notify parent comment author — skip self-notification
    if (parentComment.userId !== resolvedActorId) {
      await prisma.notification.create({
        data: {
          userId: parentComment.userId,
          type: "REPLY_TO_COMMENT",
          payload: {
            ...basePayload,
            parentCommentId: parentComment.id,
          },
        },
      });
    }
  } else {
    // COMMENT_ON_POST: determine who to notify
    let notifyUserId: string | null = null;

    if (post.authorId) {
      // Post has a known author
      notifyUserId = post.authorId;
    } else {
      // Legacy post with no authorId — fall back to the admin user.
      const adminUser = await prisma.user.findFirst({
        where: { role: "admin" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      notifyUserId = adminUser?.id ?? null;
    }

    // Create notification only if we have a recipient who is not the commenter
    // Use resolvedActorId for self-notification check (handles env-admin case)
    if (notifyUserId && notifyUserId !== resolvedActorId) {
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          type: "COMMENT_ON_POST",
          payload: basePayload,
        },
      });
    }
  }

  return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/comments]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}