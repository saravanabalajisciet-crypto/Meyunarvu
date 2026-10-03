/**
 * GET /api/notifications  — list current user's notifications (authenticated, own only)
 *
 * Query params:
 *   unreadOnly=true  — only unread notifications
 *   page, limit
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
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;

  const where = {
    userId: session.userId,
    ...(unreadOnly ? { read: false } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: session.userId, read: false } }),
  ]);

  return NextResponse.json({ notifications, total, page, limit, unreadCount });

  } catch (err) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }

