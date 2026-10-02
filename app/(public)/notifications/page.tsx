import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import NotificationList from "@/components/layout/NotificationList";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications — Meyunarvu",
};

export default async function NotificationsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">Notifications</h1>
          {unreadCount > 0 && (
            <p className="font-sans text-sm text-stone-400">
              {unreadCount} unread
            </p>
          )}
        </div>
      </div>
      <NotificationList initialNotifications={notifications} />
    </div>
  );
}
