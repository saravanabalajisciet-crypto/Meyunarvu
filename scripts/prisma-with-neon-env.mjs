/**
 * Helper: injects env vars then runs a Prisma CLI command.
 *
 * Env var resolution order (last wins):
 *   1. process.env (current shell)
 *   2. .env.seed   (production vars pulled via `vercel env pull --environment production`)
 *   3. neon-env export (live Neon DB URLs — these override .env.seed DATABASE_URL)
 *
 * .env.seed is optional — if absent, only neon-env is used for DB vars.
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

// ── Step 1: parse .env.seed if present ────────────────────────────────────
const seedEnvPath = resolve(root, ".env.seed");
const fileEnv = {};
if (existsSync(seedEnvPath)) {
  const lines = readFileSync(seedEnvPath, "utf8").split("\n");
  for (const line of lines) {
    // Support both KEY=VALUE and KEY="VALUE"
    const match = line.match(/^([A-Z0-9_]+)=("?)([^\n]*)\2\s*$/);
    if (match) fileEnv[match[1]] = match[3];
  }
}

// ── Step 2: get live Neon DB URLs ─────────────────────────────────────────
const exportResult = spawnSync(
  "node_modules\\.bin\\neon-env.cmd",
  ["export"],
  { encoding: "utf8", shell: true }
);

if (exportResult.status !== 0) {
  console.error("neon-env export failed:", exportResult.stderr || exportResult.stdout);
  process.exit(1);
}

const neonEnv = {};
for (const line of exportResult.stdout.split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)="([^"]*)"$/);
  if (match) neonEnv[match[1]] = match[2];
}

// ── Merge: process.env < fileEnv < neonEnv ───────────────────────────────
const env = { ...process.env, ...fileEnv, ...neonEnv };

// ── Step 3: run prisma ────────────────────────────────────────────────────
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
