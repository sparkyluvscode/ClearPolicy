import { Badge, Card } from "@/components/ui";

export default function ExternalCard({ label, url, hint, kind, top = false }: { label: string; url: string; hint: string; kind: "overview" | "official" | "analysis"; top?: boolean }) {
  const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
  const badge = top ? "Top pick" : kind === "official" ? "Official" : kind === "analysis" ? "Analysis" : "Overview";
  const cls = top
    ? "border-2 border-emerald-300/60 bg-emerald-50/40 dark:border-emerald-700/60 dark:bg-emerald-900/10"
    : "border border-[var(--cp-border)] bg-[var(--cp-surface)]";
  return (
    <li>
      <Card className={`p-4 surface-lift ${cls}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-medium text-[var(--cp-text)]">{label}</div>
            <div className="mt-1 text-xs text-[var(--cp-muted)]">{hint}{host ? ` — ${host}` : ""}</div>
          </div>
          <Badge variant={kind === "official" ? "official" : kind === "analysis" ? "analysis" : "neutral"}>{badge}</Badge>
        </div>
        <div className="mt-3">
          <a href={url} target="_blank" rel="noreferrer noopener" className="text-sm text-accent hover:underline focus-ring rounded">Open →</a>
        </div>
      </Card>
    </li>
  );
}
