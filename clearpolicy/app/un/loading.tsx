import { Card } from "@/components/ui";

/**
 * Loading skeleton for UN docs pages
 */
export default function UNLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--cp-surface-2)]" />
          <div className="space-y-2">
            <div className="h-6 w-64 animate-pulse rounded bg-[var(--cp-surface-2)]" />
            <div className="h-4 w-48 animate-pulse rounded bg-[var(--cp-surface-2)]" />
          </div>
        </div>
      </Card>
      
      <Card className="space-y-6">
        <div className="h-4 w-48 animate-pulse rounded bg-[var(--cp-surface-2)]" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-24 animate-pulse rounded-xl bg-[var(--cp-surface-2)]" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--cp-surface-2)]" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-[var(--cp-surface-2)]" />
        </div>
        <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--cp-surface-2)]" />
      </Card>
    </div>
  );
}
