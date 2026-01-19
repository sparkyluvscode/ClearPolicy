"use client";

import { cn } from "@/lib/utils";

type Tab = { label: string; value: string };

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2", className)} role="tablist">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-ring",
              active
                ? "border-[var(--cp-border)] bg-[var(--cp-surface)] text-[var(--cp-text)] shadow-sm"
                : "border-transparent bg-[var(--cp-surface-2)] text-[var(--cp-muted)] hover:text-[var(--cp-text)]"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
