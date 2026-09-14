import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import PostRow from "@/components/admin/PostRow";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [totalPosts, published, drafts, recentPosts] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: "published" } }),
    prisma.post.count({ where: { status: "draft" } }),
    prisma.post.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true, title: true, slug: true,
        status: true, type: true, updatedAt: true,
        category: { select: { name: true } },
      },
    }),
  ]);
  return { totalPosts, published, drafts, recentPosts };
}

export default async function AdminDashboard() {
  await requireAdmin();
  const { totalPosts, published, drafts, recentPosts } = await getDashboardData();

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Dashboard</h1>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-sans font-medium text-white hover:bg-brand-dark transition-colors duration-150"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Total", value: totalPosts },
          { label: "Published", value: published },
          { label: "Drafts", value: drafts },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-stone-100 bg-white px-4 py-5 text-center"
          >
            <p className="font-serif text-3xl font-bold text-stone-900">{stat.value}</p>
            <p className="font-sans text-xs text-stone-400 mt-1 uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Post list */}
      <div>
        <h2 className="font-sans text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Posts
        </h2>

        {recentPosts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-200 bg-white py-12 text-center">
            <p className="font-serif text-stone-400 mb-3">No posts yet.</p>
            <Link
              href="/admin/posts/new"
              className="font-sans text-sm text-brand hover:underline"
            >
              Write your first post →
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-stone-100 bg-white overflow-hidden divide-y divide-stone-50">
            {recentPosts.map((post) => (
              <PostRow
                key={post.id}
                id={post.id}
                title={post.title}
                status={post.status}
                type={post.type}
                updatedAt={post.updatedAt}
                categoryName={post.category?.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
