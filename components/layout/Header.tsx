import Link from "next/link";
import { siteConfig } from "@/config/site";
import { prisma } from "@/lib/prisma";

async function getCategories() {
  return prisma.category.findMany({
    orderBy: { order: "asc" },
    select: { name: true, slug: true },
  });
}

export default async function Header() {
  const categories = await getCategories();

  return (
    <header className="bg-white border-b border-stone-100 sticky top-0 z-40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        {/* Top row: wordmark + author */}
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="font-serif text-xl font-bold tracking-tight text-stone-900 hover:text-brand transition-colors duration-150"
          >
            {siteConfig.name}
          </Link>

          <Link
            href="/admin"
            className="hidden sm:block text-sm font-sans text-stone-400 hover:text-brand tracking-wide transition-colors duration-150"
          >
            {siteConfig.authorName}
          </Link>
        </div>

        {/* Category nav row */}
        {categories.length > 0 && (
          <nav
            aria-label="Site sections"
            className="overflow-x-auto pb-0 -mb-px"
          >
            <ul className="flex items-center gap-0.5 whitespace-nowrap">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/${cat.slug}`}
                    className="inline-block px-3 py-2.5 text-sm font-sans text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-sm transition-colors duration-150 border-b-2 border-transparent hover:border-brand"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
