"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "supported" | "unverified" | "official" | "primary" | "analysis" | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  supported: "border-[rgba(34,197,94,0.45)] bg-[rgba(34,197,94,0.12)] text-[color:var(--cp-text)]",
  unverified: "border-[rgba(245,158,11,0.45)] bg-[rgba(245,158,11,0.12)] text-[color:var(--cp-text)]",
  official: "border-[rgba(59,130,246,0.45)] bg-[rgba(59,130,246,0.12)] text-[color:var(--cp-text)]",
  primary: "border-[rgba(99,102,241,0.45)] bg-[rgba(99,102,241,0.12)] text-[color:var(--cp-text)]",
  analysis: "border-[rgba(168,85,247,0.45)] bg-[rgba(168,85,247,0.12)] text-[color:var(--cp-text)]",
  neutral: "border-[rgba(148,163,184,0.3)] bg-[rgba(148,163,184,0.1)] text-[color:var(--cp-text)]",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
