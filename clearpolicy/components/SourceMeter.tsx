export default function SourceMeter({ ratio, count, total }: { ratio: number; count?: number; total?: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--cp-muted)]">
        <span>Source Meter</span>
        <span
          className="cursor-help text-[10px] font-normal"
          title={
            `Percent of sections (TL;DR, What, Who, Pros, Cons) with at least one non-generic citation link.` +
            (typeof count === "number" && typeof total === "number" ? ` (${count} of ${total} sections cited)` : "")
          }
        >
          ?
        </span>
        <a href="/about#trust" className="inline-link text-[10px] font-normal focus-ring rounded" title="Why trust this? How we pick sources.">
          Why trust this?
        </a>
      </div>
      <div className="flex items-center gap-2" aria-label={`Source meter ${pct} percent`}>
        <div className="h-2 flex-1 rounded-full bg-[var(--cp-surface-2)]">
          <div className="h-2 rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <div className="w-12 text-right text-sm text-[var(--cp-text)] tabular-nums">{pct}%</div>
        {typeof count === "number" && typeof total === "number" && (
          <div className="w-14 text-right text-xs text-[var(--cp-muted)]">{count}/{total}</div>
        )}
      </div>
    </div>
  );
}


