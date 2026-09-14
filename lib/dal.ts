/**
 * Data Access Layer — authorization checks.
 * Call these at the top of Server Components and Server Actions
 * that handle sensitive data.
 *
 * server-only: never import this on the client.
 */

import "server-only";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

/** Verify the request is from the authenticated admin. */
export async function requireAdmin(): Promise<void> {
  const session = await getSession();
  if (!session?.isAdmin) {
    redirect("/login");
  }
}

/** Returns true if the current request is from the authenticated admin. */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return !!session?.isAdmin;
}
