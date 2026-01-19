"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1 block text-xs font-medium text-[var(--cp-muted)]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "h-10 w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 text-sm text-[var(--cp-text)] placeholder:text-[var(--cp-muted)] shadow-sm focus-ring",
          className
        )}
        {...props}
      />
    </div>
  )
);

Input.displayName = "Input";

export function SearchInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative w-full", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cp-muted)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm7-1 4 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <input
        className="h-10 w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] pl-10 pr-3 text-sm text-[var(--cp-text)] placeholder:text-[var(--cp-muted)] shadow-sm focus-ring"
        {...props}
      />
    </div>
  );
}
