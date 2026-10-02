/**
 * Next.js Proxy (formerly middleware).
 * Protects /admin/* routes — redirects unauthenticated or non-admin requests to /login.
 * Only reads the session cookie (optimistic check — no DB query).
 *
 * CP3: checks session.role === "admin" instead of bare session.isAdmin boolean.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/login";

  // Read the session cookie directly from the request (no cookies() API here)
  const token = request.cookies.get("meyunarvu_session")?.value;
  const session = await decrypt(token);

  // Authenticated = valid session with any role; admin routes require role=admin
  const isAuthenticated = !!session;
  const isAdminSession = session?.role === "admin";

  // Redirect unauthenticated users away from /admin
  if (isAdminRoute && !isAdminSession) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from /login
  if (isLoginPage && isAuthenticated) {
    // Admins go to /admin; readers and authors go to / for now
    const dest = isAdminSession ? "/admin" : "/";
    return NextResponse.redirect(new URL(dest, request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run proxy on /admin and /login only.
     * Exclude static files, images, and api routes.
     */
    "/admin/:path*",
    "/login",
  ],
};
