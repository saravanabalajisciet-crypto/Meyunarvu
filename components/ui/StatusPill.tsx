/**
 * Autosave status indicator.
 * Four explicit states — never hidden, never ambiguous.
 */

import type { SaveStatus } from "@/types";
import Spinner from "./Spinner";

interface StatusPillProps {
  status: SaveStatus;
  savedAt?: Date | null;
  onRetry?: () => void;
}

export default function StatusPill({ status, savedAt, onRetry }: StatusPillProps) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-sans text-stone-400">
        <Spinner size="sm" />
        Saving…
      </span>
    );
  }

  if (status === "saved") {
    const time = savedAt
      ? savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : null;
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-sans text-emerald-600">
        <svg
          aria-hidden
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        {time ? `Saved ${time}` : "Saved"}
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-sans text-red-600">
        <svg
          aria-hidden
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        Save failed
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="underline hover:no-underline focus:outline-none"
          >
            Retry
          </button>
        )}
      </span>
    );
  }

  // unsaved
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-sans text-stone-400">
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-stone-300"
      />
      Unsaved changes
    </span>
  );
}
