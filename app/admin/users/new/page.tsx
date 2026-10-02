import { requireAdmin } from "@/lib/dal";
import UserForm from "@/components/admin/UserForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New User — Admin" };

export default async function NewUserPage() {
  await requireAdmin();
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-8">Create User</h1>
      <UserForm mode="create" />
    </div>
  );
}
