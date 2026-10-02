/**
 * Seed: categories + admin User row.
 *
 * Run:  node scripts/prisma-with-neon-env.mjs db seed
 *   or: npx tsx prisma/seed.ts  (with DATABASE_URL in env)
 *
 * Categories are upserted by slug — safe to re-run.
 *
 * Admin user (CP3):
 *   - Reads AUTH_ADMIN_EMAIL and AUTH_PASSWORD_HASH from the environment.
 *   - AUTH_PASSWORD_HASH is already a bcrypt hash — stored directly, never re-hashed.
 *   - Upserts by email → idempotent, safe to re-run.
 *   - Role is locked to "admin" on every upsert.
 *   - AUTH_ADMIN_NAME is optional; defaults to "Admin".
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Configurable seed data
// ---------------------------------------------------------------------------

const SEED_CATEGORIES = [
  { name: "Essays", slug: "essays", description: "Long-form essays and reflections", order: 1 },
  { name: "Thirukkural", slug: "thirukkural", description: "Thirukkural with Tamil and English", order: 2 },
  { name: "Letters", slug: "letters", description: "Open letters and correspondence", order: 3 },
  { name: "Business Ideas", slug: "ideas", description: "Ideas free for anyone to build", order: 4 },
  { name: "LinkedIn", slug: "linkedin", description: "Republished LinkedIn posts", order: 5 },
  { name: "Notes", slug: "notes", description: "Short notes and observations", order: 6 },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  // ── Categories ────────────────────────────────────────────────────────────
  console.log("Seeding categories…");
  for (const cat of SEED_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, order: cat.order },
      create: cat,
    });
  }
  console.log(`  ✓ ${SEED_CATEGORIES.length} categories seeded`);

  // ── Admin User ────────────────────────────────────────────────────────────
  console.log("\nSeeding admin user…");

  const email = process.env.AUTH_ADMIN_EMAIL;
  const passwordHash = process.env.AUTH_PASSWORD_HASH;
  const name = process.env.AUTH_ADMIN_NAME ?? "Admin";

  if (!email || !passwordHash) {
    console.warn(
      "  ⚠ AUTH_ADMIN_EMAIL or AUTH_PASSWORD_HASH not set — skipping admin user seed.\n" +
      "    Set both env vars and re-run to create the admin User row."
    );
    return;
  }

  // AUTH_PASSWORD_HASH is already a bcrypt hash — store it directly.
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    update: {
      // Keep hash and role in sync with env vars on every seed run.
      passwordHash,
      role: "admin",
      name,
    },
    create: {
      email: email.toLowerCase().trim(),
      passwordHash,
      name,
      role: "admin",
    },
  });

  console.log(`  ✓ Admin user upserted: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
