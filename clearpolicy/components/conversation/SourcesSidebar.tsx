"use client";

type SourceItem = {
  id: string;
  url: string;
  title: string | null;
  domain: string | null;
  sourceType: string | null;
  verified: boolean;
  citationNumber: number | null;
};

export function SourcesSidebar({
  sources,
  onSourceClick,
}: {
  sources: SourceItem[];
  onSourceClick?: (url: string) => void;
}) {
  if (sources.length === 0) return null;

  return (
    <aside className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
      <h3
        className="mb-4 text-lg font-semibold text-[var(--text-primary)]"
        style={{ fontFamily: "var(--font-heading-display)" }}
      >
        Sources ({sources.length})
      </h3>
      <ul className="space-y-2">
        {sources.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSourceClick?.(s.url)}
              className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/30"
            >
              <span className="mr-2 text-xs font-semibold text-[var(--accent-blue)]">
                {s.citationNumber ?? i + 1}.
              </span>
              <span className="text-sm text-[var(--text-primary)]">
                {s.title || s.url}
              </span>
              <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {s.domain || "Web"}
                {s.sourceType && ` · ${s.sourceType}`}
                {s.verified && (
                  <span className="ml-1 text-[var(--accent-green)]">✓</span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
