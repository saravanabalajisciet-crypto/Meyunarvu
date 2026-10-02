"use client";

/**
 * HeaderActions — client component rendered inside the server Header.
 * Handles: search icon/bar toggle, user account menu, notification bell.
 * The server parent passes session data as props (no client-side session fetch needed).
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "@/components/layout/NotificationBell";
import type { Role } from "@prisma/client";

interface Props {
  user: { userId: string; role: Role; } | null;
}

export default function HeaderActions({ user }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close search when navigating
  useEffect(() => {
    setSearchOpen(false);
    setSearchValue("");
    setMenuOpen(false);
  }, [pathname]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !menuButtonRef.current?.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = searchValue.trim();
      if (!q) return;
      setSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(q)}`);
    },
    [searchValue, router]
  );

  return (
    <div className="flex items-center gap-1">
      {/* ── Search ──────────────────────────────────────────────────────── */}
      {searchOpen ? (
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-1 animate-fade-in"
        >
          <input
            ref={searchInputRef}
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
            placeholder="Search articles…"
            aria-label="Search articles"
            className="w-40 sm:w-56 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-sans text-stone-900 placeholder-stone-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            aria-label="Submit search"
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-stone-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <svg className="h-4 w-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-stone-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </form>
      ) : (
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-stone-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <svg className="h-5 w-5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
        </button>
      )}

      {/* ── Authenticated user actions ────────────────────────────────── */}
      {user ? (
        <>
          {/* Notification bell */}
          <NotificationBell userId={user.userId} />

          {/* User menu */}
          <div className="relative">
            <button
              ref={menuButtonRef}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-light hover:bg-brand/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-2 w-44 bg-white border border-stone-150 rounded-xl shadow-lg overflow-hidden z-50"
              >
                <div className="px-4 py-2.5 border-b border-stone-100">
                  <p className="font-sans text-xs text-stone-400 uppercase tracking-wide">
                    {user.role}
                  </p>
                </div>
                <nav className="py-1">
                  <Link
                    href="/favorites"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-sans text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors duration-150"
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Favorites
                  </Link>
                  <Link
                    href="/notifications"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-sans text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors duration-150"
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Notifications
                  </Link>
                  {(user.role === "admin" || user.role === "author") && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-sans text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors duration-150"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Dashboard
                    </Link>
                  )}
                </nav>
                <div className="border-t border-stone-100 py-1">
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        window.location.href = "/";
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm font-sans text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors duration-150"
                    >
                      <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Unauthenticated — show Sign In link */
        <Link
          href="/login"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-sans font-medium text-stone-600 hover:text-brand hover:bg-brand-light/60 transition-colors duration-150"
        >
          Sign in
        </Link>
      )}
    </div>
  );
}
