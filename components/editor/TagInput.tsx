"use client";

import { useState, useRef, KeyboardEvent } from "react";
import Badge from "@/components/ui/Badge";

interface TagInputProps {
  tags: string[];        // tag names currently selected
  onChange: (tags: string[]) => void;
  suggestions?: string[]; // existing tag names from DB
}

export default function TagInput({ tags, onChange, suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(input.toLowerCase()) &&
      !tags.includes(s)
  );

  function add(name: string) {
    const trimmed = name.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function remove(name: string) {
    onChange(tags.filter((t) => t !== name));
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      add(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      remove(tags[tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-stone-700 font-sans">Tags</label>

      {/* Tag chips + input */}
      <div
        className="flex flex-wrap gap-1.5 rounded-md border border-stone-300 bg-white px-2.5 py-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-sans text-stone-700">
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(tag); }}
              className="text-stone-400 hover:text-stone-700 leading-none"
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKey}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={tags.length === 0 ? "Add tags (Enter or comma to add)" : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm font-sans text-stone-900 placeholder-stone-400 outline-none"
        />
      </div>

      {/* Autocomplete dropdown */}
      {showSuggestions && filtered.length > 0 && (
        <ul className="rounded-md border border-stone-200 bg-white shadow-md mt-0.5 max-h-48 overflow-y-auto z-20 relative">
          {filtered.slice(0, 10).map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); add(s); }}
                className="w-full text-left px-3 py-2 text-sm font-sans text-stone-700 hover:bg-stone-50 hover:text-brand transition-colors"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs font-sans text-stone-400">Press Enter or comma to add a new tag</p>
    </div>
  );
}
