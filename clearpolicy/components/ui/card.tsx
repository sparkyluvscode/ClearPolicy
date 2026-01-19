"use client";

import { cn } from "@/lib/utils";

type CardVariant = "default" | "subtle" | "document" | "inset";

export function Card({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  const variantClasses: Record<CardVariant, string> = {
    default: "bg-[var(--cp-surface)] border border-[var(--cp-border)] shadow-soft",
    subtle: "bg-[var(--cp-surface-2)] border border-[var(--cp-border)]",
    document: "bg-[var(--cp-doc)] border border-[var(--cp-border)] shadow-card",
    inset: "bg-[var(--cp-surface-2)] border border-[var(--cp-border)]",
  };
  return (
    <div
      className={cn("card rounded-xl p-5 md:p-6 text-[var(--cp-text)]", variantClasses[variant], className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-[var(--cp-muted)]", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex items-center gap-3", className)} {...props} />;
}
