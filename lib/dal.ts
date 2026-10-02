/**
 * Data Access Layer — authorization checks.
 * Call these at the top of Server Components and Server Actions
 * that handle sensitive data.
 *
 * CP3: extended with requireRole() and getSessionUser().
 * requireAdmin() is kept as a backward-compatible alias.
 *
 * server-only: never import this on the client.
 */

import "server-only";
import { getSession, type SessionPayload } from "@/lib/session";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Returns the current session payload, or null if unauthenticated.
 * Use this when you need userId or role without enforcing a redirect.
 */
export async function getSessionUser(): Promise<SessionPayload | null> {
  return getSession();
}

/**
 * Requires the current user to have one of the specified roles.
 * Redirects to /login if not authenticated, or throws 403 if wrong role.
 *
 * Usage:
 *   await requireRole("admin");
 *   await requireRole("admin", "author");
 */
export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!roles.includes(session.role)) {
    // Wrong role — redirect to login rather than exposing a 403 page
    redirect("/login");
  }
  return session;
}

// ---------------------------------------------------------------------------
// Convenience aliases
// ---------------------------------------------------------------------------

/**
 * Requires the current user to be an admin.
 * Backward-compatible alias for requireRole("admin").
 */
export async function requireAdmin(): Promise<void> {
  await requireRole("admin");
}

/**
 * Returns true if the current session belongs to an admin.
 * Non-throwing check — use in conditional logic rather than guards.
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.role === "admin";
}

/**
 * Returns true if the current session belongs to an admin or author.
 */
export async function isAuthorOrAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.role === "admin" || session?.role === "author";
}
