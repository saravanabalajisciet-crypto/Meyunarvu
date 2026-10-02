/**
 * Authentication helpers — multi-user with env-var admin fallback.
 *
 * CP3 verification order:
 *   1. Look up the user by email in the DB (prisma User table).
 *      If found, bcrypt-compare the stored passwordHash.
 *   2. If no DB User record exists for this email, fall back to the env-var
 *      admin credentials (AUTH_ADMIN_EMAIL + AUTH_PASSWORD_HASH).
 *      This ensures the admin can log in even before the seed has been run.
 *
 * Returns { userId, role } on success, or null on failure.
 *
 * server-only: never import this on the client.
 */

import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export interface VerifiedUser {
  userId: string;
  role: Role;
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<VerifiedUser | null> {
  const normalizedEmail = email.toLowerCase().trim();

  // ── Path 1: DB user ────────────────────────────────────────────────────
  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, passwordHash: true, role: true },
    });

    if (user) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;
      return { userId: user.id, role: user.role };
    }
  } catch (err) {
    // DB unavailable or query failed — log and fall through to env-var path
    console.error("[auth] DB lookup failed, falling back to env-var admin:", err);
  }

  // ── Path 2: env-var admin fallback ─────────────────────────────────────
  // Used when the User table is empty (pre-seed) or the DB is unreachable.
  const adminEmail = process.env.AUTH_ADMIN_EMAIL;
  const passwordHash = process.env.AUTH_PASSWORD_HASH;

  if (!adminEmail || !passwordHash) {
    console.error(
      "[auth] No DB user found and env-var fallback not configured. " +
        "Set AUTH_ADMIN_EMAIL and AUTH_PASSWORD_HASH in .env.local."
    );
    return null;
  }

  if (normalizedEmail !== adminEmail.toLowerCase().trim()) return null;

  const valid = await bcrypt.compare(password, passwordHash);
  if (!valid) return null;

  // No DB record yet — return a synthetic admin identity.
  // userId is set to a stable placeholder derived from the email so the
  // session is consistent across requests until the seed runs.
  return { userId: `env-admin:${normalizedEmail}`, role: "admin" as Role };
}
