/**
 * POST /api/admin/seed-users
 *
 * One-time bootstrap endpoint: upserts the admin User row from env vars.
 * Safe to call multiple times — upsert is idempotent.
 *
 * Auth: requires an active session with role "admin".
 * (The env-var login path sets role="admin" after CP3 auth changes land.)
 *
 * Intended use: call once after deploying CP3 to create the admin User row
 * so that subsequent logins resolve from the DB.
 *
 * TODO CP4: remove this route once the admin user-management UI is in place.
 */

import "server-only";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = process.env.AUTH_ADMIN_EMAIL;
  const passwordHash = process.env.AUTH_PASSWORD_HASH;
  const name = process.env.AUTH_ADMIN_NAME ?? "Admin";

  if (!email || !passwordHash) {
    return NextResponse.json(
      { error: "AUTH_ADMIN_EMAIL or AUTH_PASSWORD_HASH not set in environment" },
      { status: 500 }
    );
  }

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    update: { passwordHash, role: "admin", name },
    create: {
      email: email.toLowerCase().trim(),
      passwordHash,
      name,
      role: "admin",
    },
    select: { id: true, email: true, role: true, name: true },
  });

  return NextResponse.json({ seeded: true, user });
}
