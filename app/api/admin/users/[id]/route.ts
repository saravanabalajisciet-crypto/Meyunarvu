/**
 * PATCH  /api/admin/users/[id]  — update user name/role/password (admin only)
 * DELETE /api/admin/users/[id]  — delete user (admin only)
 *
 * Post.authorId uses ON DELETE SET NULL — existing posts are preserved.
 * Comments/Favorites/Notifications use ON DELETE CASCADE — cleaned up automatically.
 * passwordHash is NEVER returned.
 *
 * An admin cannot delete themselves to prevent accidental lockout.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

const VALID_ROLES: Role[] = ["reader", "author", "admin"];
const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { name, role, password } = body as {
    name?: string;
    role?: string;
    password?: string;
  };

  const data: Record<string, unknown> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    data.name = name.trim();
  }

  if (role !== undefined) {
    if (!VALID_ROLES.includes(role as Role)) {
      return NextResponse.json(
        { error: `role must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }
    data.role = role as Role;
  }

  if (password !== undefined) {
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }
    data.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ user });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  // Prevent self-deletion
  if (id === session.userId) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Post.authorId → SET NULL (posts preserved)
  // Comments, Favorites, Notifications → CASCADE deleted
  await prisma.user.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
