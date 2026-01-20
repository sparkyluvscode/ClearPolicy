"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import DisambiguatorChips from "@/components/DisambiguatorChips";
import FeatureGrid from "@/components/FeatureGrid";
import TourOverlay from "@/components/TourOverlay";
import { Badge, Button, Card, SearchInput } from "@/components/ui";


export const dynamic = "force-dynamic";

function HomePageContent() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const [chips, setChips] = useState<{ label: string; hint: string; slug?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ ca?: { results?: any[] }; us?: { bills?: any[]; data?: { bills?: any[] } }; fallbacks?: any[]; aiFallback?: any | null }>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<{ label: string; hint: string; slug?: string }[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestAbort = useRef<AbortController | null>(null);
  const suggestTimeout = useRef<number | null>(null);

  const queryParam = searchParams?.get("q") || "";
  useEffect(() => {
    if (typeof window === "undefined") return;
    const trimmed = queryParam.trim();
    if (!trimmed) return;
    if (trimmed !== q.trim()) {
      setQ(trimmed);
    }
    doSearch(trimmed).catch((err) => {
      console.error("Initial search failed:", err);
    });
  }, [queryParam]);

  async function doSearch(query: string) {
    if (typeof window === "undefined") return;
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      console.log("Empty query, skipping search");
      return;
    }
    setHasSearched(true);

    setLoading(true);

    try {
      const url = new URL("/api/search", window.location.origin);
      url.searchParams.set("q", trimmedQuery);
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Search failed: ${res.status}`);
      }

      const data = await res.json();

      // Handle ZIP code redirect - auto-populate ZIP panel if available
      if (data.redirectToZip && data.zipCode) {
        // Try to find and populate the ZIP input, then trigger lookup
        setTimeout(() => {
          const zipInput = document.getElementById("zip-input") as HTMLInputElement;
          if (zipInput) {
            zipInput.value = data.zipCode;
            zipInput.dispatchEvent(new Event("input", { bubbles: true }));
            // Trigger the ZIP lookup by submitting the form
            const zipForm = zipInput.closest("form");
            if (zipForm) {
              const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
              zipForm.dispatchEvent(submitEvent);
            }
            // Scroll to ZIP panel
            zipInput.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
        // Clear search results for ZIP queries
        setChips([]);
        setResults({ ca: { results: [] }, us: { data: { bills: [] } }, fallbacks: [] });
        return;
      }

      // Normalize CA results
      const caResults = Array.isArray(data.ca?.results)
        ? data.ca.results
        : (data.ca && typeof data.ca === 'object' && Array.isArray(data.ca.results))
          ? data.ca.results
          : [];

      // Normalize US bills - check both possible locations
      const usBillsData = Array.isArray(data.us?.bills)
        ? data.us.bills
        : Array.isArray(data.us?.data?.bills)
          ? data.us.data.bills
          : [];

      // Update state - ensure we're setting the query too
      const newResults = {
        ca: { results: caResults },
        us: { bills: usBillsData, data: { bills: usBillsData } },
        fallbacks: data.fallbacks || [],
        aiFallback: data.aiFallback || null
      };

      // Update all state together - React will batch these
      // Use functional updates to ensure we have the latest state
      setChips(data.chips || []);
      setResults(newResults);
      // Always update q to ensure it matches what we searched for
      setQ(trimmedQuery);

      // Force a re-render by updating a dummy state if needed
      // Actually, the state updates above should trigger a re-render

    } catch (error) {
      console.error("Search error:", error);
      setChips([]);
      setResults({ ca: { results: [] }, us: { data: { bills: [] } }, fallbacks: [] });
    } finally {
      setLoading(false);
    }
  }

  function requestSuggestions(query: string) {
    if (typeof window === "undefined") return;
    if (suggestAbort.current) suggestAbort.current.abort();
    if (suggestTimeout.current) window.clearTimeout(suggestTimeout.current);
    if (!query.trim()) { setSuggestions([]); setShowSuggest(false); return; }
    suggestTimeout.current = window.setTimeout(async () => {
      suggestAbort.current = new AbortController();
      try {
        const url = new URL("/api/search", window.location.origin);
        url.searchParams.set("q", query);
        const res = await fetch(url.toString(), { signal: suggestAbort.current.signal });
        const data = await res.json();
        const opts: { label: string; hint: string; slug?: string }[] = data.chips || [];
        setSuggestions(opts.slice(0, 6));
        setShowSuggest(true);
      } catch (error) {
        console.error("Suggestion error:", error);
      }
    }, 220);
  }

  const quickLinks = useMemo(() => [
    { label: "Proposition 17 (2020)", slug: "ca-prop-17-2020" },
    { label: "Proposition 47 (2014)", slug: "ca-prop-47-2014" },
  ], []);

  const federalSamples = useMemo(() => [
    { label: "H.R. 50 (example)", id: "118:hr:50" },
    { label: "S. 50 (example)", id: "118:s:50" },
  ], []);

  // Calculate results - ensure we check all possible data structures
  // Use useMemo to recalculate when results change
  const { caResultsArray, usBillsArray, fallbacksArray, hasCaResults, hasUsResults, hasFallbacks } = useMemo(() => {
    const ca = Array.isArray(results.ca?.results) ? results.ca.results : [];
    const us = Array.isArray(results.us?.bills)
      ? results.us.bills
      : Array.isArray(results.us?.data?.bills)
        ? results.us.data.bills
        : [];
    const fb = Array.isArray(results.fallbacks) ? results.fallbacks : [];
    return {
      caResultsArray: ca,
      usBillsArray: us,
      fallbacksArray: fb,
      hasCaResults: ca.length > 0,
      hasUsResults: us.length > 0,
      hasFallbacks: fb.length > 0
    };
  }, [results]);

  // Calculate showResults - ensure we check the actual state values
  const currentQ = q.trim();
  const showResults = Boolean(currentQ && (hasCaResults || hasUsResults || hasFallbacks || chips.length > 0 || hasSearched));

  // Keep derived state lean; avoid console noise in production

  const isLikelyFederal = /\b(hr|s|senate|house|congress|federal)\b/i.test(q);
  const caDirect = useMemo(() => caResultsArray.filter((r: any) => r._direct), [caResultsArray]);
  const caRelated = useMemo(() => caResultsArray.filter((r: any) => !r._direct), [caResultsArray]);

  return (
    <div className="space-y-10">
      <TourOverlay />
      <section id="home-search-section" className="space-y-4">
        <div className="space-y-2">
          <h1 className="page-title text-glow" data-testid="home-title">Find a bill or proposition</h1>
          <p className="page-subtitle" data-testid="home-subtitle">
            Search a bill number, proposition, or topic. We explain it in plain language with sources you can check.
          </p>
        </div>
        <Card className="space-y-4">
          <form
            id="home-search-form"
            className="flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const input = form.querySelector("input") as HTMLInputElement | null;
              const query = input?.value?.trim() || q.trim();
              if (query) {
                setShowSuggest(false);
                setQ(query);
                await doSearch(query).catch(err => {
                  console.error("Search failed in form submit:", err);
                });
              }
            }}
            role="search"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <label htmlFor="home-search" className="sr-only">Search</label>
              <SearchInput
                id="home-search"
                name="q"
                type="search"
                data-testid="search-input"
                value={q}
                onChange={(e) => {
                  const value = e.target.value;
                  setQ(value);
                  requestSuggestions(value);
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
                placeholder="Try: Prop 17 retail theft"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showSuggest && suggestions.length > 0}
                aria-haspopup="listbox"
                aria-controls={showSuggest && suggestions.length > 0 ? "search-suggestions" : undefined}
              />
              <Button
                type="submit"
                size="md"
                disabled={loading}
                aria-busy={loading}
                data-testid="search-submit"
              >
                {loading ? "Searching…" : "Search"}
              </Button>
            </div>

            {showSuggest && suggestions.length > 0 && (
              <ul id="search-suggestions" role="listbox" className="mt-1 rounded-2xl glass-card p-2 text-sm">
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    role="option"
                    aria-selected="false"
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 hover:bg-[var(--cp-surface-2)]"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (s.slug) { window.location.href = `/measure/${s.slug}`; } else { setQ(s.label); doSearch(s.label); }
                    }}
                  >
                    <span className="text-[var(--cp-text)]">{s.label}</span>
                    <span className="text-[var(--cp-muted)]">{s.hint}</span>
                  </li>
                ))}
              </ul>
            )}
          </form>
          {chips.length > 0 && (
            <div>
              <DisambiguatorChips chips={chips} />
            </div>
          )}
        </Card>
      </section>

      {showResults && (
        <section className="space-y-4" id="search-results-section" data-testid="search-results">
          <div className="flex items-center justify-between">
            <h2 className="section-heading" role="heading" aria-level={2}>Search Results</h2>
          </div>
          {!hasCaResults && !hasUsResults && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              <p>No results for “{q}”. Try one of these:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" className="rounded-full" onClick={() => { setQ("prop 17"); doSearch("prop 17"); }}>Prop 17</Button>
                <Button variant="secondary" size="sm" className="rounded-full" onClick={() => { setQ("retail theft"); doSearch("retail theft"); }}>Retail theft</Button>
                <Button variant="secondary" size="sm" className="rounded-full" onClick={() => { setQ("campaign finance"); doSearch("campaign finance"); }}>Campaign finance</Button>
              </div>
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-[var(--cp-text)]">California (Open States)</div>
              {hasCaResults ? (
                <>
                  {caDirect.length > 0 && (
                    <ul className="space-y-2 text-sm">
                      {caDirect.slice(0, 1).map((r: any, i: number) => {
                        const osId = r.id || r.identifier || "";
                        const href = (r as any)._virtual === "prop" && (r as any).propNum
                          ? `/measure/prop/${encodeURIComponent((r as any).propNum)}`
                          : (r as any).externalUrl || `/measure/live?source=os&id=${encodeURIComponent(osId)}`;
                        const isExternal = Boolean((r as any).externalUrl) && !((r as any)._virtual === "prop");
                        return (
                          <li key={i}>
                            <a
                              href={href}
                              target={isExternal ? "_blank" : undefined}
                              rel={isExternal ? "noreferrer noopener" : undefined}
                              className="block focus-ring rounded-2xl"
                            >
                              <Card className="p-4 border-emerald-400/30 bg-emerald-500/10 transition hover:bg-emerald-500/15 surface-lift">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-[var(--cp-text)]" data-testid="result-title">{r.title || r.identifier}</span>
                                  <Badge variant="supported">Top pick</Badge>
                                </div>
                                {r._reason && <div className="mt-1 text-xs text-[var(--cp-muted)]">{r._reason}</div>}
                                {r._preview && <div className="mt-1 text-xs text-[var(--cp-muted)]">{r._preview}</div>}
                                {r.classification && <div className="text-xs text-[var(--cp-muted)]">{r.classification?.join?.(", ")}</div>}
                                <div className="mt-2 text-xs text-accent">{isExternal ? "Open overview →" : "Open summary →"}</div>
                              </Card>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {caDirect.length > 1 && (
                    <ul className="space-y-2 text-sm">
                      {caDirect.slice(1, 5).map((r: any, i: number) => {
                        const osId = r.id || r.identifier || "";
                        const href = (r as any)._virtual === "prop" && (r as any).propNum
                          ? `/measure/prop/${encodeURIComponent((r as any).propNum)}`
                          : (r as any).externalUrl || `/measure/live?source=os&id=${encodeURIComponent(osId)}`;
                        const isExternal = Boolean((r as any).externalUrl) && !((r as any)._virtual === "prop");
                        return (
                          <li key={i}>
                            <a
                              href={href}
                              target={isExternal ? "_blank" : undefined}
                              rel={isExternal ? "noreferrer noopener" : undefined}
                              className="block focus-ring rounded-2xl"
                            >
                              <Card className="p-4 transition hover:bg-[var(--cp-surface-2)] surface-lift">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-[var(--cp-text)]" data-testid="result-title">{r.title || r.identifier}</span>
                                  <Badge variant="primary">Direct</Badge>
                                </div>
                                {r._reason && <div className="mt-1 text-xs text-[var(--cp-muted)]">{r._reason}</div>}
                                <div className="mt-2 text-xs text-accent">{isExternal ? "Open overview →" : "Open summary →"}</div>
                              </Card>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {caRelated.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[var(--cp-muted)]">See also</div>
                      <ul className="space-y-2 text-sm">
                        {caRelated.slice(0, 5).map((r: any, i: number) => {
                          const osId = r.id || r.identifier || "";
                          const href = (r as any)._virtual === "prop" && (r as any).propNum
                            ? `/measure/prop/${encodeURIComponent((r as any).propNum)}`
                            : (r as any).externalUrl || `/measure/live?source=os&id=${encodeURIComponent(osId)}`;
                          const isExternal = Boolean((r as any).externalUrl) && !((r as any)._virtual === "prop");
                          return (
                          <li key={i}>
                            <a
                              href={href}
                              target={isExternal ? "_blank" : undefined}
                              rel={isExternal ? "noreferrer noopener" : undefined}
                              className="block focus-ring rounded-2xl"
                            >
                              <Card className="p-4 transition hover:bg-[var(--cp-surface-2)] surface-lift">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-[var(--cp-text)]" data-testid="result-title">{r.title || r.identifier}</span>
                                  <Badge variant="neutral">Related</Badge>
                                </div>
                                {r._reason && <div className="mt-1 text-xs text-[var(--cp-muted)]">{r._reason}</div>}
                                {r._preview && <div className="mt-1 text-xs text-[var(--cp-muted)]">{r._preview}</div>}
                                <div className="mt-2 text-xs text-accent">{isExternal ? "Open overview →" : "Open summary →"}</div>
                              </Card>
                            </a>
                          </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[var(--cp-muted)]">No California results</p>
              )}
            </div>
            <div className="space-y-3">
              <div className="text-sm font-semibold text-[var(--cp-text)]">Federal (Congress.gov)</div>
              {hasUsResults ? (
                <ul className="space-y-2 text-sm">
                  {usBillsArray.slice(0, 5).map((b: any, i: number) => {
                    const id = `${b.congress || b.congressdotgovUrl?.match(/congress=(\d+)/)?.[1] || "118"}:${b.type || b.billType || "hr"}:${b.number?.replace(/\D/g, "") || "0"}`;
                    return (
                      <li key={i}>
                        <a
                          href={`/measure/live?source=congress&id=${encodeURIComponent(id)}`}
                          className="block focus-ring rounded-2xl"
                        >
                          <Card className="p-4 transition hover:bg-[var(--cp-surface-2)] surface-lift">
                            <div className="font-medium text-[var(--cp-text)]" data-testid="result-title">{b.title || b.number}</div>
                            {b.latestAction?.text && <div className="mt-1 text-xs text-[var(--cp-muted)]">{b.latestAction.text}</div>}
                            <div className="mt-2 text-xs text-accent">Open summary →</div>
                          </Card>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm text-[var(--cp-muted)]">
                  No federal results
                  {isLikelyFederal && (
                    <>
                      {" — try a format like "}
                      <span className="font-medium text-[var(--cp-text)]">H.R. 50</span>
                      {" or "}
                      <span className="font-medium text-[var(--cp-text)]">S. 50</span>
                      {". Or open a demo:"}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {federalSamples.map((f) => (
                          <a key={f.id} href={`/measure/live?source=congress&id=${encodeURIComponent(f.id)}`} className="rounded-full border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1 text-xs focus-ring hover:bg-[var(--cp-surface-2)]">{f.label}</a>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {showResults && !hasCaResults && !hasUsResults && results.aiFallback && (
        <section className="space-y-4">
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="section-heading">AI fallback summary</h2>
              <Badge variant="analysis">AI</Badge>
            </div>
            <p className="text-sm text-[var(--cp-muted)]">
              We couldn&apos;t find an exact bill match. This is a best-effort neutral summary for your query.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const encoded = encodeURIComponent(q.trim());
                  window.location.href = `/measure/ai?query=${encoded}`;
                }}
              >
                Open AI summary →
              </Button>
            </div>
          </Card>
        </section>
      )}

      <FeatureGrid />

      <Card>
        <h2 className="section-heading">Why ClearPolicy?</h2>
        <p className="mt-2 text-sm text-[var(--cp-muted)]">
          We turn primary sources into neutral summaries you can verify—no ads, no spin, just the facts and citations.
        </p>
      </Card>

      <Card id="privacy">
        <h2 className="section-heading">Privacy</h2>
        <p className="mt-1 text-sm text-[var(--cp-muted)]">
          See our full policy on the <a className="inline-link" href="/privacy">Privacy page</a>.
        </p>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-sm text-[var(--cp-muted)]">Loading…</div>}>
      <HomePageContent />
    </Suspense>
  );
}
