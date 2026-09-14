/**
 * Authentication helpers — single author.
 *
 * Credentials are read exclusively from environment variables:
 *   AUTH_ADMIN_EMAIL   — the admin email address
 *   AUTH_PASSWORD_HASH — bcrypt hash of the admin password
 *
 * To change the password:
 *   1. Run:  node -e "require('bcryptjs').hash('newpassword',12).then(console.log)"
 *   2. Copy the printed hash into AUTH_PASSWORD_HASH in .env.local
 *      NOTE: write .env.local using Node.js (via write-env.mjs) — not PowerShell,
 *      because PowerShell expands $-prefixed tokens and corrupts bcrypt hashes.
 *   3. Restart the dev server.
 *
 * server-only: never import this on the client.
 */

import "server-only";
import bcrypt from "bcryptjs";

export async function verifyCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const adminEmail = process.env.AUTH_ADMIN_EMAIL;
  const passwordHash = process.env.AUTH_PASSWORD_HASH;

  if (!adminEmail || !passwordHash) {
    console.error(
      "[auth] Missing env vars — AUTH_ADMIN_EMAIL or AUTH_PASSWORD_HASH not set. " +
        "Check .env.local and ensure the hash was written with write-env.mjs."
    );
    return false;
  }

  if (email.toLowerCase().trim() !== adminEmail.toLowerCase().trim()) {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
}
