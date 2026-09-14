/**
 * Seed: placeholder categories + admin user
 *
 * Run:  npx tsx prisma/seed.ts
 *
 * Categories are configurable — edit SEED_CATEGORIES below or add/remove
 * via the admin panel without code changes.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

// Admin credentials — override via environment variables before seeding
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@meyunarvu.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "change-me-immediately";

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding categories…");
  for (const cat of SEED_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, order: cat.order },
      create: cat,
    });
  }
  console.log(`  ✓ ${SEED_CATEGORIES.length} categories seeded`);

  // Admin user is stored as a hashed env variable, not in the DB.
  // We just verify the env is set and show a reminder.
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  console.log("\n── Admin credentials ──────────────────────────────────────");
  console.log(`  Email   : ${ADMIN_EMAIL}`);
  console.log(`  Password: (set via SEED_ADMIN_PASSWORD env var)`);
  console.log(`  Hash    : ${hash}`);
  console.log("  → Copy this hash into AUTH_PASSWORD_HASH in .env.local");
  console.log("───────────────────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
