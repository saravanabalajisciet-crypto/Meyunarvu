import { requireAdmin } from "@/lib/dal";
import { AdminSidebar, AdminBottomNav } from "@/components/layout/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth guard — proxy handles redirects, but we double-check here
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Desktop sidebar */}
      <AdminSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 sm:px-6 py-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <AdminBottomNav />
    </div>
  );
}
