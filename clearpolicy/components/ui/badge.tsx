"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "supported" | "unverified" | "official" | "primary" | "analysis" | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  supported: "bg-green-50 text-green-700 dark:bg-green-900/15 dark:text-green-400",
  unverified: "bg-amber-50 text-amber-700 dark:bg-amber-900/15 dark:text-amber-400",
  official: "bg-blue-50 text-blue-700 dark:bg-blue-900/15 dark:text-blue-400",
  primary: "bg-[var(--cp-accent-soft)] text-[var(--cp-accent)]",
  analysis: "bg-violet-50 text-violet-700 dark:bg-violet-900/15 dark:text-violet-400",
  neutral: "bg-[var(--cp-surface-2)] text-[var(--cp-muted)]",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-medium tracking-wide",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
