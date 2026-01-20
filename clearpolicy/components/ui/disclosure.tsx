"use client";

import { cn } from "@/lib/utils";

export function Disclosure({
  open,
  onToggle,
  label,
  children,
  className,
  buttonProps,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
  buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    "data-testid"?: string;
  };
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--cp-text)] hover:text-[var(--cp-accent)] focus-ring rounded"
        {...buttonProps}
      >
        {label}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className={cn("transition-transform text-[var(--cp-muted)]", open ? "rotate-180" : "rotate-0")}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {open && <div className="text-sm text-[var(--cp-text)]">{children}</div>}
    </div>
  );
}
