import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import UserDeleteButton from "@/components/admin/UserDeleteButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Users — Admin",
};

const roleBadgeVariant = (role: string) => {
  if (role === "admin") return "brand" as const;
  if (role === "author") return "published" as const;
  return "default" as const;
};

export default async function UsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { posts: true, comments: true } },
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Users</h1>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-sans font-medium text-white hover:bg-brand-dark transition-colors duration-150"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New User
        </Link>
      </div>

      {users.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-200 bg-white py-12 text-center">
          <p className="font-serif text-stone-400 mb-3">No users yet.</p>
          <Link href="/admin/users/new" className="font-sans text-sm text-brand hover:underline">
            Create the first user →
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-stone-100 bg-white overflow-hidden">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-4 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide hidden md:table-cell">Posts</th>
                <th className="text-left px-4 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide hidden md:table-cell">Joined</th>
                <th className="text-right px-4 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50/50 transition-colors duration-100">
                  <td className="px-4 py-3">
                    <span className="font-medium text-stone-800">{user.name}</span>
                  </td>
                  <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-stone-400 tabular-nums hidden md:table-cell">{user._count.posts}</td>
                  <td className="px-4 py-3 text-stone-400 hidden md:table-cell">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-sans text-xs text-stone-400 hover:text-brand transition-colors duration-150"
                      >
                        Edit
                      </Link>
                      <UserDeleteButton userId={user.id} userName={user.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
