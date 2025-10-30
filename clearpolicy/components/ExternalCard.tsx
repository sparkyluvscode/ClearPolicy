export default function ExternalCard({ label, url, hint, kind, top = false }: { label: string; url: string; hint: string; kind: "overview" | "official" | "analysis"; top?: boolean }) {
  const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
  const badge = top ? "Top pick" : kind === "official" ? "Official" : kind === "analysis" ? "Analysis" : "Overview";
  const cls = top
    ? "border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-900/10"
    : "border border-gray-200 dark:border-gray-700";
  return (
    <li className={`rounded-md p-4 ${cls}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{label}</div>
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{hint}{host ? ` — ${host}` : ""}</div>
        </div>
        <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] border bg-gray-100 text-gray-700 border-gray-200" title={badge}>{badge}</span>
      </div>
      <div className="mt-3">
        <a href={url} target="_blank" rel="noreferrer noopener" className="text-sm text-accent hover:underline focus-ring rounded">Open →</a>
      </div>
    </li>
  );
}
