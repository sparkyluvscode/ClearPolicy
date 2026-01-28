"use client";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Disclosure, Input } from "@/components/ui";

type Official = { name: string; party?: string; office?: string; urls?: string[]; context?: string; vote?: string; voteUrl?: string; image?: string };
type PlaceInfo = { city?: string; state?: string; county?: string };
type DistrictInfo = { senate?: string; assembly?: string };
type LocalImpactContext = {
  source?: "os" | "congress" | "seeded";
  jurisdiction?: "CA" | "US";
  title?: string;
  id?: string;
  subjects?: string[];
  policyArea?: string;
};

const TOPIC_MAP: { label: string; re: RegExp }[] = [
  { label: "Education", re: /(education|school|student|college|university|teacher)/i },
  { label: "Healthcare", re: /(health|medical|medicaid|medicare|hospital|patient)/i },
  { label: "Housing", re: /(housing|rent|homeless|tenant|mortgage)/i },
  { label: "Public safety", re: /(crime|police|justice|safety|sentenc|law enforcement)/i },
  { label: "Environment", re: /(climate|environment|water|energy|emissions|pollution)/i },
  { label: "Transportation", re: /(transport|transit|rail|road|highway)/i },
  { label: "Labor", re: /(labor|worker|wage|employment|workforce)/i },
  { label: "Taxes & budget", re: /(tax|revenue|budget|fund|appropriation)/i },
];

const normalizeLabel = (value: string) => value.replace(/\s+/g, " ").trim();

export default function ZipPanel({ contextId, context }: { contextId?: string; context?: LocalImpactContext }) {
  const [zip, setZip] = useState("");
  const [officials, setOfficials] = useState<Official[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localInfo, setLocalInfo] = useState<{ place?: PlaceInfo; districts?: DistrictInfo } | null>(null);
  const [analysisUrl, setAnalysisUrl] = useState<string | null>(null);
  const [finderUrl, setFinderUrl] = useState<string | null>(null);
  const [impactOpen, setImpactOpen] = useState(true);

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
    setLocalInfo(null);
    setAnalysisUrl(null);
    setFinderUrl(null);
    try {
      const url = new URL("/api/zip", window.location.origin);
      url.searchParams.set("zip", trimmed);
      if (contextId) url.searchParams.set("osid", contextId);
      url.searchParams.set("include_meta", "1");
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "lookup failed");
      const ocials: any[] = Array.isArray(data.officials) ? data.officials : [];
      const mapped: Official[] = ocials.map((o: any) => ({
        name: o?.name || "",
        party: o?.party,
        urls: o?.urls,
        office: o?.office,
        vote: o?.vote,
        voteUrl: o?.voteUrl,
        image: o?.image,
      }));
      setOfficials(mapped);
      setLocalInfo(data?.place || data?.districts ? { place: data?.place || undefined, districts: data?.districts || undefined } : null);
      setAnalysisUrl(typeof data?.analysisUrl === "string" ? data.analysisUrl : null);
      setFinderUrl(typeof data?.finderUrl === "string" ? data.finderUrl : null);
      if (mapped.length === 0) {
        const suffix = data?.finderUrl ? " Try the official CA finder." : "";
        setError(`ZIP code not found.${suffix}`);
      }
    } catch (e: any) {
      setError("ZIP code not found. Check your ZIP or try later.");
      setOfficials([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const handle = () => setImpactOpen(!media.matches);
    handle();
    media.addEventListener("change", handle);
    return () => media.removeEventListener("change", handle);
  }, []);

  const focusTopics = useMemo(() => {
    const topics: string[] = [];
    const subjects = Array.isArray(context?.subjects) ? context?.subjects : [];
    subjects.forEach((s) => {
      const cleaned = normalizeLabel(String(s));
      if (cleaned) topics.push(cleaned);
    });
    if (context?.policyArea) topics.push(normalizeLabel(context.policyArea));
    if (topics.length === 0 && context?.title) {
      TOPIC_MAP.forEach((t) => {
        if (t.re.test(context.title || "")) topics.push(t.label);
      });
    }
    const unique = Array.from(new Set(topics)).filter(Boolean);
    return unique.slice(0, 3);
  }, [context?.policyArea, context?.subjects, context?.title]);

  const placeLabel = useMemo(() => {
    const city = localInfo?.place?.city || "";
    const state = localInfo?.place?.state || "";
    const label = [city, state].filter(Boolean).join(", ");
    return label || "";
  }, [localInfo]);

  const districtLabel = useMemo(() => {
    const sd = localInfo?.districts?.senate ? `SD ${localInfo.districts.senate}` : null;
    const ad = localInfo?.districts?.assembly ? `AD ${localInfo.districts.assembly}` : null;
    return [sd, ad].filter(Boolean).join(" / ");
  }, [localInfo]);

  const focusItems = useMemo(() => {
    const items: string[] = [];
    if (!officials) {
      items.push("Enter a ZIP to see a focused local impact summary.");
      return items;
    }
    if (context?.jurisdiction === "US") {
      items.push("Federal measure; impact applies nationwide.");
    } else if (context?.jurisdiction === "CA" || context?.source === "os") {
      items.push("California measure; impact applies statewide.");
    }
    if (placeLabel) items.push(`Local area: ${placeLabel}`);
    if (districtLabel) items.push(`Your districts: ${districtLabel}`);
    if (context?.title) items.push(`Measure context: ${context.title}`);
    return items;
  }, [context?.jurisdiction, context?.source, context?.title, districtLabel, placeLabel, officials]);

  return (
    <Card variant="subtle" className="space-y-4" role="complementary" aria-label="Local lens" data-testid="zip-panel">
      <div>
        <h3 className="text-sm font-semibold text-[var(--cp-text)]">Local lens</h3>
        <p className="mt-1 text-xs text-[var(--cp-muted)]" data-testid="zip-helper">Find your representatives and local voting context.</p>
      </div>
      <form className="flex items-center gap-2" onSubmit={lookup} noValidate>
        <label htmlFor="zip-input" className="sr-only">ZIP code</label>
        <Input
          id="zip-input"
          data-testid="zip-input"
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
          data-testid="zip-submit"
        >
          {loading ? "Looking…" : "Look up"}
        </Button>
      </form>
      <p className="text-xs text-[var(--cp-muted)]">Hint: Try a California ZIP like 95014 or 90001</p>
      {/* District labels (if API returns them in future) */}
      {/* Intentionally minimal; server currently returns just officials */}
      {error && <p className="text-sm text-amber-700 dark:text-amber-200" role="alert">{error}</p>}
      {officials && (
        <ul className="space-y-2" aria-live="polite" aria-label="ZIP officials" data-testid="zip-officials">
          {officials.map((o, i) => (
            <li key={i} className="rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] p-3">
              <div className="flex items-center gap-3">
                {o.image && (
                  <img
                    src={o.image}
                    alt={`${o.name} portrait`}
                    className="h-10 w-10 rounded-full object-cover border border-[var(--cp-border)]"
                    loading="lazy"
                  />
                )}
                <div>
                  {(o as any).office && <div className="text-xs text-[var(--cp-muted)]" title="Official role">{(o as any).office}</div>}
                  <div className="font-medium text-[var(--cp-text)]">{o.name}</div>
                  {o.party && <div className="text-sm text-[var(--cp-muted)]">{o.party}</div>}
                </div>
              </div>
              {o.context && <div className="mt-1 text-xs text-[var(--cp-muted)]">{o.context}</div>}
              {o.vote && (
                <div className="mt-1 text-xs">
                  <Badge variant="supported">{o.vote}</Badge>
                  {o.voteUrl && (
                    <a href={o.voteUrl} target="_blank" rel="noreferrer noopener" className="ml-2 inline-link focus-ring rounded">Details</a>
                  )}
                </div>
              )}
              {!o.vote && contextId && (
                <div className="mt-1 text-xs text-[var(--cp-muted)]">
                  Vote unknown — no roll-call vote found for this bill yet.
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
      <Card variant="subtle" className="space-y-2 text-xs text-[var(--cp-muted)]" data-testid="local-impact">
        <Disclosure
          open={impactOpen}
          onToggle={() => setImpactOpen((prev) => !prev)}
          label="Focused impact"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[var(--cp-text)] font-semibold uppercase tracking-wide text-[11px]">
                Focused impact
              </div>
              {placeLabel && (
                <Badge variant="neutral">{placeLabel}</Badge>
              )}
            </div>
            <ul className="space-y-1">
              {focusItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            {focusTopics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {focusTopics.map((topic) => (
                  <Badge key={topic} variant="neutral" data-testid="local-impact-topic">{topic}</Badge>
                ))}
              </div>
            )}
          </div>
        </Disclosure>
      </Card>
      {/* Local analysis */}
      {officials && analysisUrl && (
        <div className="text-xs text-[var(--cp-muted)]">
          <a
            href={analysisUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-link"
          >
            Local analysis (news)
          </a>
          {finderUrl && (
            <>
              <span className="mx-2">·</span>
              <a href={finderUrl} target="_blank" rel="noreferrer noopener" className="inline-link">
                Find your rep (official)
              </a>
            </>
          )}
        </div>
      )}
    </Card>
  );
}


