"use client";

import { useState } from "react";
import Link from "next/link";

import type { Notification as PrismaNotification } from "@prisma/client";

interface NotificationPayload {
  postId?: string;
  postSlug?: string;
  postType?: string;
  categorySlug?: string | null;
  postHref?: string;
  commentId?: string;
  actorName?: string;
  parentCommentId?: string;
}

interface Notification {
  id: string;
  type: string;
  payload: NotificationPayload;
  read: boolean;
  createdAt: Date | string;
}

interface Props {
  initialNotifications: PrismaNotification[];
}

function timeAgo(dateStr: Date | string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function notificationText(type: string, payload: NotificationPayload): string {
  const actor = payload.actorName ?? "Someone";
  if (type === "COMMENT_ON_POST") return `${actor} commented on your post`;
  if (type === "REPLY_TO_COMMENT") return `${actor} replied to your comment`;
  return "New activity";
}

export default function NotificationList({ initialNotifications }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications.map((n) => ({
      ...n,
      payload: (n.payload ?? {}) as NotificationPayload,
    }))
  );
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } finally {
      setMarkingAll(false);
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="py-16 text-center rounded-lg border border-dashed border-stone-200">
        <p className="font-serif text-stone-400 text-lg mb-2">No notifications yet.</p>
        <p className="font-sans text-stone-400 text-sm">Activity on your posts and comments will appear here.</p>
        <Link href="/" className="mt-4 inline-block font-sans text-sm text-brand hover:text-brand-dark transition-colors duration-150">
          Browse articles →
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Mark all read */}
      {unreadCount > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="font-sans text-sm text-brand hover:text-brand-dark transition-colors duration-150 disabled:opacity-50"
          >
            {markingAll ? "Marking…" : "Mark all as read"}
          </button>
        </div>
      )}

      <div className="divide-y divide-stone-100 rounded-xl border border-stone-150 overflow-hidden">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-4 px-5 py-4 ${n.read ? "bg-white" : "bg-brand-light/50"}`}
          >
            {/* Unread indicator */}
            <div className="shrink-0 mt-1.5">
              {!n.read ? (
                <span className="block w-2 h-2 rounded-full bg-brand" aria-label="Unread" />
              ) : (
                <span className="block w-2 h-2 rounded-full bg-stone-200" aria-hidden />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`font-sans text-sm leading-snug mb-0.5 ${n.read ? "text-stone-600" : "text-stone-900 font-medium"}`}>
                {notificationText(n.type, n.payload)}
              </p>
              <p className="font-sans text-xs text-stone-400">{timeAgo(n.createdAt)}</p>
              {(n.payload.postHref || n.payload.postId) && (
                <Link
                  href={n.payload.postHref ?? "/notifications"}
                  className="font-sans text-xs text-brand hover:text-brand-dark transition-colors duration-150 mt-1 inline-block"
                >
                  View post →
                </Link>
              )}
            </div>
            {/* Mark read */}
            {!n.read && (
              <button
                onClick={() => markRead(n.id)}
                className="shrink-0 font-sans text-xs text-stone-400 hover:text-stone-600 transition-colors duration-150 mt-0.5"
                aria-label="Mark as read"
              >
                Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
