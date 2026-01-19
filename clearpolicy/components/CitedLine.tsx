export default function CitedLine({ quote, sourceName, url, location }: { quote: string; sourceName: string; url?: string; location?: string }) {
  return (
    <blockquote className="rounded-md border border-[var(--cp-border)] bg-[var(--cp-quote)] p-3 text-sm text-[var(--cp-text)]">
      <p className="border-l-2 border-emerald-500/40 pl-3 font-mono text-xs leading-relaxed">“{quote}”</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 inline-flex items-center gap-1 text-xs inline-link focus-ring rounded"
        >
          {sourceName}
          {location ? ` — ${location}` : ""}
        </a>
      ) : (
        <div className="mt-2 text-xs text-[var(--cp-muted)]">
          {sourceName}
          {location ? ` — ${location}` : ""}
        </div>
      )}
    </blockquote>
  );
}


