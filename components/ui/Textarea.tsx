"use client";

import { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-sans font-semibold text-stone-500 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={[
            "block w-full rounded-md border bg-white px-3 py-2.5 text-sm font-sans text-stone-900",
            "placeholder-stone-300 shadow-sm resize-y min-h-[80px]",
            "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
              : "border-stone-200",
            className,
          ].join(" ")}
          {...props}
        />
        {error && <p className="text-xs font-sans text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs font-sans text-stone-400">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;
