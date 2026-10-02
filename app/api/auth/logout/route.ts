/**
 * POST /api/auth/logout
 * Client-callable logout endpoint — used by HeaderActions client component.
 * Deletes the session cookie and returns 200.
 */

import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

export async function POST() {
  await deleteSession();
  return NextResponse.json({ success: true });
}
