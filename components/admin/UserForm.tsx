"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import type { Role } from "@prisma/client";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface Props {
  mode: "create" | "edit";
  user?: UserData;
}

export default function UserForm({ mode, user }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? "reader");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const url = mode === "create" ? "/api/admin/users" : `/api/admin/users/${user!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const body: Record<string, string> = { name, role };
      if (mode === "create") {
        body.email = email;
        body.password = password;
      } else if (password) {
        body.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }

      router.push("/admin/users");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-stone-100 p-6 space-y-5">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        required
        autoComplete="off"
      />

      {mode === "create" && (
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          required
          autoComplete="off"
        />
      )}

      <Input
        label={mode === "create" ? "Password" : "New password (leave blank to keep current)"}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={mode === "create" ? "Min 8 characters" : "Leave blank to keep unchanged"}
        required={mode === "create"}
        autoComplete="new-password"
        hint="Minimum 8 characters"
      />

      <Select
        label="Role"
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        required
      >
        <option value="reader">Reader</option>
        <option value="author">Author</option>
        <option value="admin">Admin</option>
      </Select>

      {error && (
        <p className="text-sm font-sans text-red-600 rounded-md bg-red-50 border border-red-200 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" isLoading={submitting}>
          {mode === "create" ? "Create user" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/users")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
