"use client";

import type React from "react";
import { cn } from "@/lib/utils";

type Option = { label: string; value: string; ariaLabel?: string; title?: string };

export function SegmentedControl({
  options,
  value,
  onChange,
  size = "md",
  className,
  ariaLabel,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const sizeClasses = size === "sm" ? "text-xs" : "text-sm";
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("glass-input inline-flex rounded-xl p-1", className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            aria-label={opt.ariaLabel || opt.label}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 font-medium transition-colors focus-ring",
              sizeClasses,
              active
                ? "bg-[var(--cp-doc)] text-[var(--cp-text)] shadow-sm"
                : "text-[var(--cp-muted)] hover:text-[var(--cp-text)]"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ToggleButton({
  pressed,
  onPressedChange,
  label,
  className,
  ...props
}: {
  pressed: boolean;
  onPressedChange: (next: boolean) => void;
  label: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "glass-input inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-ring",
        pressed
          ? "bg-[var(--cp-doc)] text-[var(--cp-text)] shadow-sm"
          : "text-[var(--cp-muted)] hover:text-[var(--cp-text)]",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-4 w-8 rounded-full border border-[var(--cp-border)] bg-[var(--cp-bg)] transition-colors",
          pressed ? "bg-emerald-500/25" : "bg-[var(--cp-bg)]"
        )}
      >
        <span
          className={cn(
            "block h-3.5 w-3.5 translate-y-0.5 rounded-full bg-[var(--cp-text)] transition-transform",
            pressed ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </span>
      {label}
    </button>
  );
}
