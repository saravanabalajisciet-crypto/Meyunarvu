/**
 * PATCH /api/notifications/[id]  — mark a notification as read (owner only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  // Update only if the notification belongs to the current user
  const notification = await prisma.notification.updateMany({
    where: { id, userId: session.userId },
    data: { read: true },
  });

  if (notification.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
