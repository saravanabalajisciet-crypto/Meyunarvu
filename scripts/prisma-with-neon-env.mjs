/**
 * Helper: injects Neon DATABASE_URL + Vercel auth env vars then runs a Prisma CLI command.
 *
 * DATABASE_URL resolution (first that works):
 *   1. neon-env export (uses OIDC token — works when vercel dev has been run recently)
 *   2. neon connection-string (uses cached neon CLI OAuth — longer-lived)
 *
 * Other env vars (AUTH_*, SESSION_SECRET, etc.) come from .env.seed if present.
 *
 * Usage:
 *   node scripts/prisma-with-neon-env.mjs migrate status
 *   node scripts/prisma-with-neon-env.mjs db seed
 *   node scripts/prisma-with-neon-env.mjs migrate dev --name <name>
 */

import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// ── Parse .env.seed for non-DB vars ───────────────────────────────────────
const seedEnvPath = resolve(root, ".env.seed");
const fileEnv = {};
if (existsSync(seedEnvPath)) {
  const lines = readFileSync(seedEnvPath, "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=("?)([^\n]*?)\2\s*$/);
    if (match && match[3]) fileEnv[match[1]] = match[3];
  }
}

// ── Get DATABASE_URL from neon-env (OIDC) or neon connection-string ───────
let databaseUrl = null;

// Try neon-env export first
const neonEnvResult = spawnSync("node_modules\\.bin\\neon-env.cmd", ["export"], {
  encoding: "utf8",
  shell: true,
});
if (neonEnvResult.status === 0) {
  for (const line of neonEnvResult.stdout.split("\n")) {
    const m = line.match(/^DATABASE_URL="([^"]+)"$/);
    if (m) { databaseUrl = m[1]; break; }
  }
}

// Fallback: neon CLI connection-string (uses cached OAuth)
if (!databaseUrl) {
  const connResult = spawnSync(
    "node",
    ["node_modules/.bin/neon", "connection-string",
     "--project-id", "wandering-darkness-72642523",
     "--branch", "production", "--pooled"],
    { encoding: "utf8", shell: false }
  );
  if (connResult.status === 0) {
    databaseUrl = connResult.stdout.trim();
  }
}

if (!databaseUrl) {
  console.error("Could not obtain DATABASE_URL from neon-env or neon CLI.");
  process.exit(1);
}

const env = {
  ...process.env,
  ...fileEnv,
  DATABASE_URL: databaseUrl,
};

// ── Run prisma ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/prisma-with-neon-env.mjs <prisma subcommand> [args...]");
  process.exit(1);
}

const result = spawnSync("node_modules\\.bin\\prisma.cmd", args, {
  env,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
