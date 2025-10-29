export default function SourceMeter({ ratio, count, total }: { ratio: number; count?: number; total?: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return (
    <div>
      <div className="section-title mb-1 flex items-center gap-2">
        <span>Source Meter</span>
        <span
          className="text-[10px] text-gray-500 dark:text-gray-400 cursor-help"
          title={
            `Percent of sections (TL;DR, What, Who, Pros, Cons) with at least one non-generic citation link.` +
            (typeof count === "number" && typeof total === "number" ? ` (${count} of ${total} sections cited)` : "")
          }
        >
          ?
        </span>
      </div>
      <div className="flex items-center gap-2" aria-label={`Source meter ${pct} percent`}>
        <div className="h-2 flex-1 rounded-full bg-gray-200">
          <div className="h-2 rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-sm text-gray-700 tabular-nums w-12 text-right">{pct}%</div>
        {typeof count === "number" && typeof total === "number" && (
          <div className="text-xs text-gray-600 w-14 text-right">{count}/{total}</div>
        )}
      </div>
    </div>
  );
}


