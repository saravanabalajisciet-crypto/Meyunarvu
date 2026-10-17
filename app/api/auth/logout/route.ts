/**
 * POST /api/auth/logout
 * Client-callable logout endpoint — used by HeaderActions client component.
 * Deletes the session cookie and tells the client to redirect to /login
 * (the whole site is private once the session is gone).
 */

import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

export async function POST() {
  await deleteSession();
  return NextResponse.json({ success: true, redirect: "/login" });
}
