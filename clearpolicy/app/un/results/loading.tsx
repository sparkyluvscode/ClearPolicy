import { Card } from "@/components/ui";

/**
 * Loading skeleton for UN results page
 */
export default function UNResultsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Header skeleton */}
      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-24 animate-pulse rounded-full bg-[var(--cp-surface-2)]" />
          <div className="h-6 w-32 animate-pulse rounded-full bg-[var(--cp-surface-2)]" />
        </div>
        <div className="h-8 w-3/4 animate-pulse rounded bg-[var(--cp-surface-2)]" />
        <div className="h-4 w-48 animate-pulse rounded bg-[var(--cp-surface-2)]" />
      </Card>

      {/* Reading level selector skeleton */}
      <Card variant="subtle" className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-[var(--cp-surface-2)]" />
          <div className="h-3 w-32 animate-pulse rounded bg-[var(--cp-surface-2)]" />
        </div>
        <div className="h-10 w-40 animate-pulse rounded-full bg-[var(--cp-surface-2)]" />
      </Card>

      {/* Content sections skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-pulse rounded bg-[var(--cp-surface-2)]" />
            <div className="h-6 w-48 animate-pulse rounded bg-[var(--cp-surface-2)]" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-[var(--cp-surface-2)]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--cp-surface-2)]" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-[var(--cp-surface-2)]" />
          </div>
        </Card>
      ))}
    </div>
  );
}
