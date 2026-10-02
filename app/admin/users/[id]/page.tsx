import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import UserForm from "@/components/admin/UserForm";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Edit User — Admin" };

export default async function EditUserPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Edit User</h1>
      <p className="font-sans text-sm text-stone-400 mb-8">{user.email}</p>
      <UserForm mode="edit" user={user} />
    </div>
  );
}
