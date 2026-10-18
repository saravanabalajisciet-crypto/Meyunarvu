/**
 * Seed: categories + admin User row.
 *
 * Run:  node scripts/prisma-with-neon-env.mjs db seed
 *   or: npx tsx prisma/seed.ts  (with DATABASE_URL in env)
 *
 * Categories are upserted safely — handles both slug and name uniqueness
 * constraints. Strategy:
 *   1. Try upsert by slug (updates if slug exists)
 *   2. If that fails due to name collision, update the existing name-matched row
 *      to use the new slug, then upsert by slug
 *
 * This handles the case where the DB has "Business Ideas" with slug "ideas"
 * and we want to move it to slug "business-ideas".
 *
 * Old categories (thirukkural, letters, ideas, linkedin, notes) are left
 * untouched — posts keep their categoryId. Clean up via admin if desired.
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

// Content types are modelled as Category rows (no schema migration needed).
// Upserted by slug — re-running the seed is safe and idempotent.
const SEED_CATEGORIES = [
  { name: "Kids Bedtime Stories", slug: "kids-stories",  description: "Bedtime stories for children",          order: 1 },
  { name: "Short Stories",        slug: "short-stories", description: "Short fiction and storytelling",         order: 2 },
  { name: "Leadership Articles",  slug: "leadership",    description: "Leadership and management articles",     order: 3 },
  { name: "Essays",               slug: "essays",         description: "Long-form essays and reflections",       order: 4 },
  { name: "Business Ideas",       slug: "business-ideas", description: "Ideas free for anyone to build",        order: 5 },
  { name: "Others",               slug: "others",         description: "Other writing and observations",        order: 6 },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function upsertCategory(cat: {
  name: string;
  slug: string;
  description: string;
  order: number;
}) {
  // Step 1: try normal upsert by slug
  try {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, order: cat.order },
      create: cat,
    });
    return;
  } catch (err: unknown) {
    // P2002 = unique constraint violation (name collision with a different slug)
    const code = (err as { code?: string }).code;
    if (code !== "P2002") throw err;
  }

  // Step 2: name collision — a row with this name exists but with a different slug.
  // Update that row's slug to our target slug, then the upsert will succeed.
  await prisma.category.updateMany({
    where: { name: cat.name },
    data: { slug: cat.slug, description: cat.description, order: cat.order },
  });
  // Now upsert by slug should succeed (the slug now matches)
  await prisma.category.upsert({
    where: { slug: cat.slug },
    update: { name: cat.name, description: cat.description, order: cat.order },
    create: cat,
  });
}

async function main() {
  // ── Categories ────────────────────────────────────────────────────────────
  console.log("Seeding categories…");
  for (const cat of SEED_CATEGORIES) {
    await upsertCategory(cat);
    console.log(`  ✓ ${cat.name} (/${cat.slug})`);
  }
  console.log(`  ${SEED_CATEGORIES.length} categories seeded`);

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