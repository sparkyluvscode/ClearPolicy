"use client";
import { useState } from "react";

type Official = { name: string; party?: string; office?: string; urls?: string[] };

export default function ZipPanel() {
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
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "lookup failed");
      const offices: any[] = Array.isArray(data.offices) ? data.offices : [];
      const ocials: any[] = Array.isArray(data.officials) ? data.officials : [];
      const mapped: Official[] = ocials.map((o: any) => ({ name: o?.name || "", party: o?.party, urls: o?.urls }));
      // Some responses provide divisions mapping: map offices by officialIndices
      offices.forEach((off) => {
        const idxs: number[] = Array.isArray(off?.officialIndices) ? off.officialIndices : [];
        idxs.forEach((idx) => {
          if (mapped[idx]) (mapped[idx] as any).office = off?.name || (off?.roles?.[0] || "Official");
        });
      });
      setOfficials(mapped);
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
          {officials.length === 0 && <li className="text-sm text-gray-600">No officials found for this ZIP. Try a different one.</li>}
          {officials.map((o, i) => (
            <li key={i} className="rounded-md border border-gray-200 p-3">
              {(o as any).office && <div className="text-xs text-gray-500" title="Official role">{(o as any).office}</div>}
              <div className="font-medium text-gray-900">{o.name}</div>
              {o.party && <div className="text-sm text-gray-600">{o.party}</div>}
              {o.urls?.[0] && (
                <a href={o.urls[0]} target="_blank" rel="noreferrer noopener" className="text-xs text-accent hover:underline focus-ring rounded">
                  Official page
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}


