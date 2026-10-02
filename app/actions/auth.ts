"use server";

import { redirect } from "next/navigation";
import { verifyCredentials } from "@/lib/auth";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState =
  | { error: string }
  | { success: true }
  | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  // CP3: verifyCredentials now returns { userId, role } or null
  const verified = await verifyCredentials(email, password);
  if (!verified) {
    return { error: "Invalid email or password." };
  }

  await createSession(verified.userId, verified.role);

  // Redirect based on role:
  //   admin  → /admin dashboard
  //   author → /admin dashboard (author-side features in later CP3 tasks)
  //   reader → / (public home; reader-specific features via client state)
  const dest = verified.role === "reader" ? "/" : "/admin";

  // redirect() throws a special error — must be called outside try/catch
  redirect(dest);
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
