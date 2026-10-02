"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  type: "COMMENT_ON_POST" | "REPLY_TO_COMMENT";
  payload: NotificationPayload;
  read: boolean;
  createdAt: string;
}

interface Props {
  userId: string; // passed from server parent — confirms user is logged in
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function notificationText(n: Notification): string {
  const actor = n.payload.actorName ?? "Someone";
  if (n.type === "COMMENT_ON_POST") return `${actor} commented on your post`;
  if (n.type === "REPLY_TO_COMMENT") return `${actor} replied to your comment`;
  return "New activity";
}

function notificationHref(n: Notification): string {
  // Use the pre-computed postHref stored in the payload — direct navigation
  if (n.payload.postHref) return n.payload.postHref;
  // Fallback for any notifications created before this field existed
  return "/notifications";
}

export default function NotificationBell({ userId: _userId }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Fetch unread count on mount (lightweight — just the count)
  useEffect(() => {
    fetch("/api/notifications?unreadOnly=true&limit=1")
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.unreadCount ?? 0))
      .catch(() => null);
  }, []);

  // Fetch full list when panel opens
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=15");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); buttonRef.current?.focus(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
        className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-stone-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <svg
          className="h-5 w-5 text-stone-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-sans font-bold text-white leading-none"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full mt-2 w-80 max-h-[480px] bg-white border border-stone-150 rounded-xl shadow-lg overflow-hidden flex flex-col z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 shrink-0">
            <h2 className="font-sans text-sm font-semibold text-stone-800">Notifications</h2>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-sans text-brand hover:text-brand-dark transition-colors duration-150"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-label="Loading" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="font-sans text-sm text-stone-400">No notifications yet.</p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`border-b border-stone-50 last:border-0 ${n.read ? "" : "bg-brand-light/60"}`}
                  >
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors duration-150 focus-visible:outline-none focus-visible:bg-stone-50"
                      onClick={async () => {
                        if (!n.read) await markRead(n.id);
                        setOpen(false);
                        router.push(notificationHref(n));
                      }}
                    >
                      <p className={`font-sans text-sm leading-snug ${n.read ? "text-stone-600" : "text-stone-900 font-medium"}`}>
                        {notificationText(n)}
                      </p>
                      <p className="font-sans text-xs text-stone-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-stone-100 shrink-0">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="font-sans text-xs text-brand hover:text-brand-dark transition-colors duration-150"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
