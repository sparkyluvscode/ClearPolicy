import { Card } from "@/components/ui";

export default function MeasureLoading() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2.2fr,1fr]" data-testid="measure-loading">
      <div className="space-y-6">
        <Card className="space-y-3">
          <div className="h-8 w-3/4 animate-pulse rounded bg-[var(--cp-surface-2)]" />
          <div className="h-4 w-full animate-pulse rounded bg-[var(--cp-surface-2)]" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--cp-surface-2)]" />
        </Card>
        <Card variant="document" className="space-y-6">
          <div className="flex justify-between">
            <div className="h-6 w-24 animate-pulse rounded bg-[var(--cp-surface-2)]" />
            <div className="h-9 w-48 animate-pulse rounded-full bg-[var(--cp-surface-2)]" />
          </div>
          <div className="h-4 w-full animate-pulse rounded bg-[var(--cp-surface-2)]" />
          <div className="h-4 w-full animate-pulse rounded bg-[var(--cp-surface-2)]" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--cp-surface-2)]" />
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-[var(--cp-surface-2)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--cp-surface-2)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--cp-surface-2)]" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-[var(--cp-surface-2)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--cp-surface-2)]" />
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="h-48 animate-pulse rounded-lg bg-[var(--cp-surface-2)]" />
      </div>
    </div>
  );
}
