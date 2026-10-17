"use server";

/**
 * Reader signup Server Action.
 *
 * Validation (manual — no Zod in this project):
 *   - name: required, min 2 chars
 *   - email: required, must contain @ and .
 *   - password: required, min 8 chars
 *   - confirmPassword: must match password
 *
 * Role is hardcoded to "reader" — never read from client input.
 * Password hashed with bcryptjs (BCRYPT_ROUNDS=12, matching the codebase).
 * On success, creates a session and redirects to "/".
 *
 * redirect() throws a special error — it MUST be called outside try/catch.
 */

import "server-only";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import type { Role } from "@prisma/client";

const BCRYPT_ROUNDS = 12;

export interface SignupFieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export type SignupState =
  | { error: string }
  | { fieldErrors: SignupFieldErrors }
  | undefined;

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const confirmPassword =
    (formData.get("confirmPassword") as string | null) ?? "";

  const normalizedEmail = email.toLowerCase().trim();

  // ── Field validation ─────────────────────────────────────────────────
  const fieldErrors: SignupFieldErrors = {};

  if (name.length < 2) {
    fieldErrors.name = "Name must be at least 2 characters.";
  }

  if (!email) {
    fieldErrors.email = "Email is required.";
  } else if (!email.includes("@") || !email.includes(".")) {
    fieldErrors.email = "Please enter a valid email address.";
  }

  if (password.length < 8) {
    fieldErrors.password = "Password must be at least 8 characters.";
  }

  if (confirmPassword !== password) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // ── Duplicate email check ─────────────────────────────────────────────
  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      return {
        error: "An account with this email already exists. Try signing in.",
      };
    }
  } catch (err) {
    console.error("[signup] duplicate email check failed:", err);
    return { error: "Something went wrong. Please try again." };
  }

  // ── Hash password + create the reader account ────────────────────────
  let userId: string;
  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: "reader" as Role, // hardcoded — never from client input
      },
      select: { id: true },
    });
    userId = user.id;
  } catch (err) {
    console.error("[signup] user creation failed:", err);
    return { error: "Could not create your account. Please try again." };
  }

  // ── Create session + redirect (outside try/catch so redirect() works) ─
  await createSession(userId, "reader" as Role);
  redirect("/");
}
