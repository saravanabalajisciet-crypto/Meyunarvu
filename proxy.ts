/**
 * Next.js Proxy (formerly middleware).
 * Protects /admin/* routes — redirects unauthenticated requests to /login.
 * Only reads the session cookie (optimistic check — no DB query).
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
  const isAuthenticated = !!session?.isAdmin;

  // Redirect unauthenticated users away from /admin
  if (isAdminRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from /login
  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.nextUrl));
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
