/**
 * GET  /api/admin/users  — list all users (admin only)
 * POST /api/admin/users  — create a new user (admin only)
 *
 * Password is bcrypt-hashed server-side. passwordHash is NEVER returned.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

const VALID_ROLES: Role[] = ["reader", "author", "admin"];
const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export async function GET() {
  try {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      // passwordHash intentionally omitted
    },
  });

  return NextResponse.json({ users });

  } catch (err) {
    console.error("[GET /api/admin/users]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { name, email, password, role } = body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }
  if (!role || !VALID_ROLES.includes(role as Role)) {
    return NextResponse.json(
      { error: `role must be one of: ${VALID_ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  // Check email uniqueness
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role as Role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });

  } catch (err) {
    console.error("[POST /api/admin/users]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
