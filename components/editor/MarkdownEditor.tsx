"use client";

/**
 * Wraps @uiw/react-md-editor.
 * The package uses browser-only APIs so it must be client-only.
 * The parent (PostEditor) is already "use client", so this is fine.
 */

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import Spinner from "@/components/ui/Spinner";

// Load lazily to keep the initial bundle smaller on mobile
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 border border-stone-200 rounded-md bg-stone-50">
      <Spinner />
    </div>
  ),
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  minHeight = 400,
}: MarkdownEditorProps) {
  return (
    <div className="rounded-md overflow-hidden border border-stone-200">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={minHeight}
        preview="edit"
        visibleDragbar={false}
        data-color-mode="light"
        style={{ fontFamily: "var(--font-lora)" }}
      />
    </div>
  );
}
