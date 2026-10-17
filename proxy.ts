/**
 * Next.js Proxy (formerly middleware) — gates ALL routes for the private
 * Meyunarvu platform.
 *
 * Public (no auth required):
 *   - pages:  /login, /signup (future), /_next/*, /favicon.ico,
 *             /robots.txt, /sitemap.xml
 *   - API:    /api/auth/login, /api/auth/logout
 *
 * Everything else requires a valid session:
 *   - Unauthenticated page request  → redirect to /login?from=<path>
 *   - Unauthenticated API request   → 401 JSON (JS fetch, not a browser redirect)
 *   - Authenticated non-admin on /admin/* → redirect to / (loop-safe)
 *   - /login visited while authenticated → /admin (admin/author) or / (reader)
 *
 * Belt-and-suspenders: the (public) layout and each API route also verify the
 * session, because a matcher change can silently drop Proxy coverage
 * (see the Next.js Data Security guide — always verify auth inside each
 * handler rather than relying on the Proxy alone).
 *
 * The proxy function reads the session cookie directly from the request
 * (no `cookies()` API here) and only decrypts the JWT — no DB query.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the session cookie directly from the request (no cookies() API here)
  const token = request.cookies.get("meyunarvu_session")?.value;
  const session = await decrypt(token);

  const isAuthenticated = !!session;
  const role = session?.role;
  const isAdmin = role === "admin";
  const isStaff = role === "admin" || role === "author";

  const isLoginPage = pathname === "/login";
  const isSignupPage = pathname === "/signup";
  const isApiRoute = pathname.startsWith("/api/");
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  // Paths that never require auth
  const isPublicPage =
    isLoginPage ||
    isSignupPage ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml";

  const isPublicApi =
    pathname === "/api/auth/login" || pathname === "/api/auth/logout";

  // 1) Authenticated user visiting /login or /signup → send them to their home
  if ((isLoginPage || isSignupPage) && isAuthenticated) {
    const dest = isStaff ? "/admin" : "/";
    return NextResponse.redirect(new URL(dest, request.nextUrl));
  }

  // 2) Public pages (login, signup, _next assets, metadata files) → allow
  if (isPublicPage) {
    return NextResponse.next();
  }

  // 3) API routes — return 401 JSON for unauthenticated requests (not a
  //    browser redirect, since these are called by JS fetch). Authenticated
  //    requests pass through; each route handler enforces its own role checks.
  if (isApiRoute) {
    if (isPublicApi) {
      return NextResponse.next();
    }
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 4) Admin pages — require the admin role (not just any auth)
  if (isAdminRoute) {
    if (!isAdmin) {
      if (isAuthenticated) {
        // Signed in but not admin → send home (avoids a /login redirect loop)
        return NextResponse.redirect(new URL("/", request.nextUrl));
      }
      const loginUrl = new URL("/login", request.nextUrl);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 5) All other pages — require auth
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run the proxy on every route EXCEPT static files and image optimization.
     * `api/` is intentionally NOT excluded — API routes are gated here too.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
