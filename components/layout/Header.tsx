import Link from "next/link";
import { siteConfig } from "@/config/site";
import { prisma } from "@/lib/prisma";
import MobileNav from "@/components/layout/MobileNav";
import HeaderActions from "@/components/layout/HeaderActions";
import { getSessionUser } from "@/lib/dal";

async function getCategories() {
  return prisma.category.findMany({
    orderBy: { order: "asc" },
    select: { name: true, slug: true },
  });
}

export default async function Header() {
  const [categories, session] = await Promise.all([
    getCategories(),
    getSessionUser(),
  ]);

  // Pass minimal session data to client component — never pass passwordHash or sensitive fields
  const userForClient = session
    ? { userId: session.userId, role: session.role }
    : null;

  return (
    <header className="bg-white border-b border-stone-100 sticky top-0 z-40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-center h-16 gap-4">

          {/* Hamburger — top-left */}
          <MobileNav categories={categories} user={userForClient} />

          {/* Wordmark — centre on mobile, left on desktop */}
          <Link
            href="/"
            className="font-serif text-xl font-bold tracking-tight text-stone-900 hover:text-brand transition-colors duration-150"
          >
            {siteConfig.name}
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right-side actions: search + notifications + user menu */}
          <HeaderActions user={userForClient} />
        </div>
      </div>
    </header>
  );
}
