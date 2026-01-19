"use client";
import { useState } from "react";
import { Badge, Button, Card, Input } from "@/components/ui";

type Official = { name: string; party?: string; office?: string; urls?: string[]; context?: string; vote?: string; voteUrl?: string };

export default function ZipPanel({ contextId }: { contextId?: string }) {
  const [zip, setZip] = useState("");
  const [officials, setOfficials] = useState<Official[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = zip.trim();
    const ZIP_RE = /^\d{5}(-\d{4})?$/;
    const ZERO_ZIP_RE = /^0{5}(-0{4})?$/;
    if (!ZIP_RE.test(trimmed)) {
      setError("Enter a 5-digit ZIP code (e.g., 95014).");
      setOfficials([]);
      return;
    }
    if (ZERO_ZIP_RE.test(trimmed)) {
      setError("ZIP code not found.");
      setOfficials([]);
      return;
    }
    setLoading(true);
    setError(null);
    setOfficials(null);
    try {
      const url = new URL("/api/zip", window.location.origin);
      url.searchParams.set("zip", trimmed);
      if (contextId) url.searchParams.set("osid", contextId);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (typeof window !== "undefined" && data?.analysisUrl) {
        (window as any).lastZipAnalysisUrl = data.analysisUrl;
      }
      if (!res.ok) throw new Error(data?.error || "lookup failed");
      const ocials: any[] = Array.isArray(data.officials) ? data.officials : [];
      const mapped: Official[] = ocials.map((o: any) => ({ name: o?.name || "", party: o?.party, urls: o?.urls, office: o?.office, vote: o?.vote, voteUrl: o?.voteUrl }));
      setOfficials(mapped);
      if (mapped.length === 0) {
        const suffix = data?.finderUrl ? " Try the official CA finder." : "";
        setError(`ZIP code not found.${suffix}`);
        (window as any).lastZipFinderUrl = data.finderUrl;
      }
    } catch (e: any) {
      setError("ZIP code not found. Check your ZIP or try later.");
      setOfficials([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card variant="subtle" className="space-y-4" role="complementary" aria-label="Local lens">
      <div>
        <h3 className="text-sm font-semibold text-[var(--cp-text)]">Local lens</h3>
        <p className="mt-1 text-xs text-[var(--cp-muted)]">Find your representatives and local voting context.</p>
      </div>
      <form className="flex items-center gap-2" onSubmit={lookup} noValidate>
        <label htmlFor="zip-input" className="sr-only">ZIP code</label>
        <Input
          id="zip-input"
          inputMode="numeric"
          placeholder="Enter ZIP (e.g., 95014)"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          aria-invalid={!!error}
          title="Enter a 5-digit ZIP code"
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={loading || !zip}
          aria-busy={loading}
          aria-live="polite"
        >
          {loading ? "Looking…" : "Look up"}
        </Button>
      </form>
      <p className="text-xs text-[var(--cp-muted)]">Hint: Try a California ZIP like 95014 or 90001</p>
      {/* District labels (if API returns them in future) */}
      {/* Intentionally minimal; server currently returns just officials */}
      {error && <p className="text-sm text-amber-700 dark:text-amber-200">{error}</p>}
      {officials && (
        <ul className="space-y-2" aria-live="polite" aria-label="ZIP officials">
          {officials.map((o, i) => (
            <li key={i} className="rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] p-3">
              {(o as any).office && <div className="text-xs text-[var(--cp-muted)]" title="Official role">{(o as any).office}</div>}
              <div className="font-medium text-[var(--cp-text)]">{o.name}</div>
              {o.party && <div className="text-sm text-[var(--cp-muted)]">{o.party}</div>}
              {o.context && <div className="mt-1 text-xs text-[var(--cp-muted)]">{o.context}</div>}
              {o.vote && (
                <div className="mt-1 text-xs">
                  <Badge variant="supported">{o.vote}</Badge>
                  {o.voteUrl && (
                    <a href={o.voteUrl} target="_blank" rel="noreferrer noopener" className="ml-2 inline-link focus-ring rounded">Details</a>
                  )}
                </div>
              )}
              <div className="mt-1 flex items-center gap-3">
                {o.urls?.[0] && (
                  <a href={o.urls[0]} target="_blank" rel="noreferrer noopener" className="text-xs inline-link focus-ring rounded">
                    Official page
                  </a>
                )}
                {contextId && o.name && (
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${o.name} votes ${contextId} site:openstates.org`)}`}
                    target="_blank" rel="noreferrer noopener"
                    className="text-xs inline-link focus-ring rounded"
                    title="Search their votes on this bill"
                  >
                    Search votes →
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* Local analysis */}
      {officials && (
        <div className="text-xs text-[var(--cp-muted)]">
          <a
            href={(window as any)?.lastZipAnalysisUrl || "#"}
            onClick={(e) => {
              e.preventDefault();
              const url = (e as any)?.target?.dataset?.u || (window as any)?.lastZipAnalysisUrl;
              if (url) window.open(url, "_blank");
            }}
            data-u={(typeof window !== "undefined" ? (window as any).lastZipAnalysisUrl : undefined)}
            className="inline-link"
          >
            Local analysis (news)
          </a>
          {(window as any)?.lastZipFinderUrl && (
            <>
              <span className="mx-2">·</span>
              <a href={(window as any).lastZipFinderUrl} target="_blank" rel="noreferrer noopener" className="inline-link">
                Find your rep (official)
              </a>
            </>
          )}
        </div>
      )}
    </Card>
  );
}


