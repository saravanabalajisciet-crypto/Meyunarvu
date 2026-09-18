"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Category {
  name: string;
  slug: string;
}

interface MobileNavProps {
  categories: Category[];
}

export default function MobileNav({ categories }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Trap focus and close on Escape
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Prevent background scroll while drawer is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  // Determine active category from pathname
  const activeCategorySlug = pathname.split("/")[1] ?? "";

  return (
    <>
      {/* Hamburger button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="site-nav-drawer"
        className="flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-sm hover:bg-stone-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {/* Three bar icon — morphs subtly when open */}
        <span
          className={`block h-[1.5px] bg-stone-700 transition-all duration-200 origin-center ${
            open ? "w-5 rotate-45 translate-y-[6.5px]" : "w-5"
          }`}
        />
        <span
          className={`block h-[1.5px] bg-stone-700 transition-all duration-200 ${
            open ? "w-5 opacity-0" : "w-4"
          }`}
        />
        <span
          className={`block h-[1.5px] bg-stone-700 transition-all duration-200 origin-center ${
            open ? "w-5 -rotate-45 -translate-y-[6.5px]" : "w-5"
          }`}
        />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/20 backdrop-blur-[2px] animate-fade-in"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        id="site-nav-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={`fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-stone-100 shrink-0">
          <Link
            href="/"
            className="font-serif text-lg font-bold text-stone-900 hover:text-brand transition-colors duration-150"
            onClick={close}
          >
            Sections
          </Link>
          <button
            onClick={close}
            aria-label="Close navigation menu"
            className="flex items-center justify-center w-8 h-8 rounded-sm text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {/* × icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 2L14 14M14 2L2 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Category links */}
        <nav aria-label="Site sections" className="flex-1 overflow-y-auto px-2 py-4">
          <ul>
            {/* Home link */}
            <li>
              <Link
                href="/"
                onClick={close}
                className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-sans transition-colors duration-150 ${
                  pathname === "/"
                    ? "text-brand bg-brand-light font-semibold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                }`}
              >
                <span
                  className={`block w-1.5 h-1.5 rounded-full shrink-0 ${
                    pathname === "/" ? "bg-brand" : "bg-stone-200"
                  }`}
                  aria-hidden="true"
                />
                All
              </Link>
            </li>

            {/* Divider */}
            {categories.length > 0 && (
              <li aria-hidden="true">
                <div className="mx-4 my-2 border-t border-stone-100" />
              </li>
            )}

            {categories.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              return (
                <li key={cat.slug}>
                  <Link
                    href={`/${cat.slug}`}
                    onClick={close}
                    className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-sans transition-colors duration-150 ${
                      isActive
                        ? "text-brand bg-brand-light font-semibold"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    <span
                      className={`block w-1.5 h-1.5 rounded-full shrink-0 ${
                        isActive ? "bg-brand" : "bg-stone-200"
                      }`}
                      aria-hidden="true"
                    />
                    {cat.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Drawer footer */}
        <div className="px-6 py-5 border-t border-stone-100 shrink-0">
          <p className="text-xs font-sans text-stone-300 select-none">
            மெய்யுணர்வு
          </p>
        </div>
      </div>
    </>
  );
}
