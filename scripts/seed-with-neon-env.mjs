/**
 * Runs prisma/seed.ts directly with all required env vars injected.
 * Env resolution: process.env < .env.seed < neon-env export (DB URLs override).
 *
 * Usage: node scripts/seed-with-neon-env.mjs
 */

import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// ── Parse .env.seed ────────────────────────────────────────────────────────
const seedEnvPath = resolve(root, ".env.seed");
const fileEnv = {};
if (existsSync(seedEnvPath)) {
  const lines = readFileSync(seedEnvPath, "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=("?)([^\n]*?)\2\s*$/);
    if (match) fileEnv[match[1]] = match[3];
  }
}

// ── Get live Neon DB URLs ──────────────────────────────────────────────────
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

// ── Merge ──────────────────────────────────────────────────────────────────
const env = { ...process.env, ...fileEnv, ...neonEnv };

// Quick sanity check
const missing = ["DATABASE_URL", "AUTH_ADMIN_EMAIL", "AUTH_PASSWORD_HASH"].filter(k => !env[k]);
if (missing.length > 0) {
  console.error(`\nMissing env vars: ${missing.join(", ")}`);
  console.error("\nTo run the seed, either:");
  console.error("  1. Set them in your shell before running:");
  console.error(`     $env:AUTH_ADMIN_EMAIL="your@email.com"`);
  console.error(`     $env:AUTH_PASSWORD_HASH="<bcrypt hash from write-env.mjs>"`);
  console.error("     node scripts/seed-with-neon-env.mjs");
  console.error("\n  2. Or run inside vercel dev context (env vars injected automatically).");
  process.exit(1);
}

console.log(`Running seed with env: DATABASE_URL=[SET], AUTH_ADMIN_EMAIL=[SET], AUTH_PASSWORD_HASH=[SET]`);

// ── Run seed directly via tsx ──────────────────────────────────────────────
const result = spawnSync(
  "node_modules\\.bin\\tsx.cmd",
  ["prisma/seed.ts"],
  { env, stdio: "inherit", shell: true }
);

process.exit(result.status ?? 1);
