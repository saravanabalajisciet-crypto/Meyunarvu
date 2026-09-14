import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Thirukkural — ${siteConfig.name}`,
  description: "Thirukkural couplets with Tamil and English translation.",
  alternates: { canonical: `${siteConfig.url}/thirukkural` },
};

async function getKurals() {
  return prisma.post.findMany({
    where: { status: "published", type: "thirukkural" },
    orderBy: [
      { thirukkuralMeta: { kuralNumber: "asc" } },
      { publishedAt: "desc" },
    ],
    select: {
      slug: true,
      title: true,
      excerpt: true,
      thirukkuralMeta: {
        select: { kuralNumber: true, tamilCouplet: true, englishTranslation: true },
      },
    },
  });
}

export default async function ThirukkuralIndexPage() {
  const kurals = await getKurals();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">

      {/* Header */}
      <header className="pt-12 pb-8 border-b border-stone-100">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
          Thirukkural
        </h1>
        <p className="mt-2 font-serif text-stone-500 text-lg">
          Ancient Tamil wisdom with English translation.
        </p>
        {kurals.length > 0 && (
          <p className="mt-3 font-sans text-sm text-stone-400">
            {kurals.length} {kurals.length === 1 ? "kural" : "kurals"}
          </p>
        )}
      </header>

      {/* Listing */}
      {kurals.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-stone-400 text-lg">No kurals published yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-stone-100 pb-16">
          {kurals.map((k) => (
            <Link
              key={k.slug}
              href={`/thirukkural/${k.slug}`}
              className="group block py-8 hover:bg-stone-50 -mx-4 sm:-mx-6 px-4 sm:px-6 transition-colors duration-150"
            >
              {/* Kural number */}
              {k.thirukkuralMeta?.kuralNumber && (
                <p className="text-xs font-sans font-semibold text-brand uppercase tracking-[0.15em] mb-3">
                  Kural {k.thirukkuralMeta.kuralNumber}
                </p>
              )}

              {/*
                Desktop: Tamil | English grid  (md:grid-cols-2)
                Mobile:  Tamil first, English below (single column)
              */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-10">
                {/* Tamil — always first in DOM */}
                <p className="font-serif text-lg text-stone-900 leading-[1.8] whitespace-pre-line tamil group-hover:text-brand transition-colors duration-150">
                  {k.thirukkuralMeta?.tamilCouplet ?? k.title}
                </p>
                {/* English — second in DOM */}
                <p className="font-serif text-lg text-stone-400 leading-[1.8] whitespace-pre-line">
                  {k.thirukkuralMeta?.englishTranslation ?? k.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
