"use client";

import { cn } from "@/lib/utils";

export function Tooltip({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex group", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-60 -translate-x-1/2 rounded-lg border border-[var(--cp-border)] bg-[rgba(10,16,30,0.9)] px-2 py-1 text-xs text-[var(--cp-text)] opacity-0 shadow-soft transition-opacity group-hover:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
