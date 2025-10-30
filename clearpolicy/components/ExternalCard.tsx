export default function ExternalCard({ label, url, hint, kind, top = false }: { label: string; url: string; hint: string; kind: "overview" | "official" | "analysis"; top?: boolean }) {
  const badge = kind === "official" ? "Official" : kind === "analysis" ? "Analysis" : "Overview";
  const badgeClass = kind === "official"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : kind === "analysis"
    ? "bg-sky-50 text-sky-700 border-sky-200"
    : "bg-gray-100 text-gray-700 border-gray-200";
  const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
  return (
    <li className={"rounded-md p-4 " + (top ? "border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-900/10" : "border border-gray-200 dark:border-gray-700") }>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{label}</div>
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{hint}{host ? ` — ${host}` : ""}</div>
        </div>
        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] border ${badgeClass}`} title={badge}>{top ? "Top pick" : badge}</span>
      </div>
      <div className="mt-3">
        <a href={url} target="_blank" rel="noreferrer noopener" className="text-sm text-accent hover:underline focus-ring rounded">Open →</a>
      </div>
    </li>
  );
}


