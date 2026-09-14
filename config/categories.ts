/**
 * Placeholder category list used for the seed script.
 * Add, rename, or reorder entries here — then re-run the seed.
 * The final category list will be confirmed by the client and managed
 * via the admin panel without requiring code changes.
 */

export interface CategorySeed {
  name: string;
  slug: string;
  description: string;
  order: number;
}

export const PLACEHOLDER_CATEGORIES: CategorySeed[] = [
  { name: "Essays", slug: "essays", description: "Long-form essays and reflections", order: 1 },
  { name: "Thirukkural", slug: "thirukkural", description: "Thirukkural with Tamil and English", order: 2 },
  { name: "Letters", slug: "letters", description: "Open letters and correspondence", order: 3 },
  { name: "Business Ideas", slug: "ideas", description: "Ideas free for anyone to build", order: 4 },
  { name: "LinkedIn", slug: "linkedin", description: "Republished LinkedIn posts", order: 5 },
  { name: "Notes", slug: "notes", description: "Short notes and observations", order: 6 },
];
