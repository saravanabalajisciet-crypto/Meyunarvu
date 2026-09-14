"use client";

import { forwardRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, placeholder, id, className = "", children, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-sans font-semibold text-stone-500 uppercase tracking-wide">
            {label}
          </label>
        )}
        {/* Wrapper adds the custom dropdown arrow */}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={[
              "block w-full rounded-md border bg-white pl-3 pr-9 py-2.5 text-sm font-sans text-stone-900",
              "shadow-sm appearance-none",
              "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error ? "border-red-400" : "border-stone-200",
              className,
            ].join(" ")}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          {/* Custom chevron */}
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-stone-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
        {error && <p className="text-xs font-sans text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
