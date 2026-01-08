"use client";
import { useState } from "react";

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
    if (!ZIP_RE.test(trimmed)) {
      setError("Enter a 5-digit ZIP code (e.g., 95014).");
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
      if (mapped.length === 0 && data?.finderUrl) {
        setError("No officials found for this ZIP. Try the official CA finder.");
        (window as any).lastZipFinderUrl = data.finderUrl;
      }
    } catch (e: any) {
      setError("ZIP lookup failed. Check your ZIP or try later.");
      setOfficials([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="card p-4" aria-label="Local lens by ZIP code">
      <h3 className="section-title">Local lens</h3>
      <form className="mt-2 flex items-center gap-2" onSubmit={lookup} noValidate>
        <label htmlFor="zip-input" className="sr-only">ZIP code</label>
        <input
          id="zip-input"
          inputMode="numeric"
          placeholder="Enter ZIP (e.g., 95014)"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          className="glass-input flex-1 px-3 py-2 text-sm"
          aria-invalid={!!error}
          title="Enter a 5-digit ZIP code"
        />
        <button type="submit" className="liquid-button px-3 py-2 text-sm font-medium disabled:opacity-50" disabled={loading || !zip}
          aria-busy={loading}
          aria-live="polite">
          {loading ? "Looking…" : "Look up"}
        </button>
      </form>
      <p className="mt-1 text-xs text-gray-500">Hint: Try a California ZIP like 95014 or 90001</p>
      {/* District labels (if API returns them in future) */}
      {/* Intentionally minimal; server currently returns just officials */}
      {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
      {officials && (
        <ul className="mt-3 space-y-2" aria-live="polite">
          {officials.map((o, i) => (
            <li key={i} className="rounded-md border border-gray-200 p-3">
              {(o as any).office && <div className="text-xs text-gray-500" title="Official role">{(o as any).office}</div>}
              <div className="font-medium text-gray-900 dark:text-gray-100">{o.name}</div>
              {o.party && <div className="text-sm text-gray-600 dark:text-gray-400">{o.party}</div>}
              {o.context && <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{o.context}</div>}
              {o.vote && (
                <div className="mt-1 text-xs">
                  <span className="inline-flex items-center rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5">{o.vote}</span>
                  {o.voteUrl && (
                    <a href={o.voteUrl} target="_blank" rel="noreferrer noopener" className="ml-2 text-accent hover:underline focus-ring rounded">Details</a>
                  )}
                </div>
              )}
              <div className="mt-1 flex items-center gap-3">
                {o.urls?.[0] && (
                  <a href={o.urls[0]} target="_blank" rel="noreferrer noopener" className="text-xs text-accent hover:underline focus-ring rounded">
                    Official page
                  </a>
                )}
                {contextId && o.name && (
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${o.name} votes ${contextId} site:openstates.org`)}`}
                    target="_blank" rel="noreferrer noopener"
                    className="text-xs text-accent hover:underline focus-ring rounded"
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
        <div className="mt-3 text-xs text-gray-600">
          <a href={(window as any)?.lastZipAnalysisUrl || "#"} onClick={(e) => { e.preventDefault(); const url = (e as any)?.target?.dataset?.u || (window as any)?.lastZipAnalysisUrl; if (url) window.open(url, '_blank'); }} data-u={(typeof window !== "undefined" ? (window as any).lastZipAnalysisUrl : undefined)} className="text-accent hover:underline">Local analysis (news)</a>
          {(window as any)?.lastZipFinderUrl && (
            <>
              <span className="mx-2">·</span>
              <a href={(window as any).lastZipFinderUrl} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline">Find your rep (official)</a>
            </>
          )}
        </div>
      )}
    </aside>
  );
}


