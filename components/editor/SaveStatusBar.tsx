"use client";

import StatusPill from "@/components/ui/StatusPill";
import type { SaveStatus } from "@/types";

interface SaveStatusBarProps {
  status: SaveStatus;
  savedAt: Date | null;
  onRetry?: () => void;
  onPublish?: () => void;
  isPublishing?: boolean;
  currentStatus?: "draft" | "published";
  publicUrl?: string;
}

export default function SaveStatusBar({
  status,
  savedAt,
  onRetry,
  onPublish,
  isPublishing,
  currentStatus,
  publicUrl,
}: SaveStatusBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-white border-b border-stone-100 font-sans sticky top-0 z-20">
      {/* Left: save status + view link */}
      <div className="flex items-center gap-4 min-w-0">
        <StatusPill status={status} savedAt={savedAt} onRetry={onRetry} />
        {currentStatus === "published" && publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline text-xs font-medium text-brand hover:text-brand-dark hover:underline transition-colors duration-150 truncate"
          >
            View post →
          </a>
        )}
      </div>

      {/* Right: publish / unpublish */}
      {onPublish && (
        <button
          type="button"
          onClick={onPublish}
          disabled={isPublishing || status === "saving"}
          className={[
            "inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium shrink-0",
            "transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            currentStatus === "published"
              ? "border border-stone-200 text-stone-600 hover:bg-stone-50"
              : "bg-brand text-white hover:bg-brand-dark",
          ].join(" ")}
        >
          {isPublishing ? (
            <>
              <span
                className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden
              />
              {currentStatus === "published" ? "Unpublishing…" : "Publishing…"}
            </>
          ) : currentStatus === "published" ? (
            "Unpublish"
          ) : (
            "Publish"
          )}
        </button>
      )}
    </div>
  );
}
