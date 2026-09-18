import Link from "next/link";
import { siteConfig } from "@/config/site";
import { prisma } from "@/lib/prisma";
import MobileNav from "@/components/layout/MobileNav";

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
        <div className="flex items-center h-16 gap-4">

          {/* Hamburger — top-left */}
          <MobileNav categories={categories} />

          {/* Wordmark — centre on mobile, left on desktop */}
          <Link
            href="/"
            className="font-serif text-xl font-bold tracking-tight text-stone-900 hover:text-brand transition-colors duration-150"
          >
            {siteConfig.name}
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Author / admin link — hidden on small screens */}
          <Link
            href="/admin"
            className="hidden sm:block text-sm font-sans text-stone-400 hover:text-brand tracking-wide transition-colors duration-150"
          >
            {siteConfig.authorName}
          </Link>
        </div>
      </div>
    </header>
  );
}
