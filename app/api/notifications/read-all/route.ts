/**
 * POST /api/notifications/read-all  — mark all notifications as read (authenticated)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST() {
  try {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.notification.updateMany({
    where: { userId: session.userId, read: false },
    data: { read: true },
  });

  return NextResponse.json({ updated: result.count });

  } catch (err) {
    console.error("[POST /api/notifications/read-all]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
