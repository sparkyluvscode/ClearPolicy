"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import DisambiguatorChips from "@/components/DisambiguatorChips";
import TourOverlay from "@/components/TourOverlay";
import Link from "next/link";
import HomeDemo from "@/components/HomeDemo";
import Illustration from "@/components/Illustration";
import HeroGraphic from "@/components/HeroGraphic";


export default function HomePage() {
  const [q, setQ] = useState("");
  const [chips, setChips] = useState<{ label: string; hint: string; slug?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ ca?: { results?: any[] }; us?: { bills?: any[]; data?: { bills?: any[] } }; fallbacks?: any[] }>({});
  const [suggestions, setSuggestions] = useState<{ label: string; hint: string; slug?: string }[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestAbort = useRef<AbortController | null>(null);
  const suggestTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    if (query && query.trim()) {
      const trimmed = query.trim();
      console.log("Initial query from URL:", trimmed);
      // Set query state first
      setQ(trimmed);
      // Then trigger search - use a small delay to ensure state is set
      setTimeout(() => {
        doSearch(trimmed).catch((err) => {
          console.error("Initial search failed:", err);
        });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doSearch(query: string) {
    if (typeof window === "undefined") return;
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      console.log("Empty query, skipping search");
      return;
    }

    console.log("doSearch called with:", trimmedQuery);
    setLoading(true);

    try {
      const url = new URL("/api/search", window.location.origin);
      url.searchParams.set("q", trimmedQuery);
      console.log("Fetching from:", url.toString());

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

      console.log("Search API response:", {
        caCount: data.ca?.results?.length || 0,
        usCount: data.us?.bills?.length || data.us?.data?.bills?.length || 0,
        chipsCount: data.chips?.length || 0,
        fallbacksCount: data.fallbacks?.length || 0,
        query: trimmedQuery,
        rawData: data
      });

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

      console.log("Normalized results:", {
        caResults: caResults.length,
        usBills: usBillsData.length,
        caResultsSample: caResults[0],
        usBillsSample: usBillsData[0]
      });

      // Update state - ensure we're setting the query too
      const newResults = {
        ca: { results: caResults },
        us: { bills: usBillsData, data: { bills: usBillsData } },
        fallbacks: data.fallbacks || []
      };

      console.log("About to update state with:", {
        caResultsCount: caResults.length,
        usBillsCount: usBillsData.length,
        fallbacksCount: (data.fallbacks || []).length,
        chipsCount: (data.chips || []).length,
        newResults
      });

      // Update all state together - React will batch these
      // Use functional updates to ensure we have the latest state
      setChips(data.chips || []);
      setResults(newResults);
      // Always update q to ensure it matches what we searched for
      setQ(trimmedQuery);

      // Force a re-render by updating a dummy state if needed
      // Actually, the state updates above should trigger a re-render

      console.log("State updated - q:", trimmedQuery, "results:", {
        ca: caResults.length,
        us: usBillsData.length,
        fallbacks: (data.fallbacks || []).length,
        chips: (data.chips || []).length,
        willShowResults: Boolean(trimmedQuery && (caResults.length > 0 || usBillsData.length > 0 || (data.fallbacks || []).length > 0 || (data.chips || []).length > 0))
      });
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
  const showResults = Boolean(currentQ && (hasCaResults || hasUsResults || hasFallbacks || chips.length > 0));

  // Additional debug - log when showResults should be true but isn't showing
  useEffect(() => {
    if (currentQ && typeof window !== "undefined") {
      const shouldShow = hasCaResults || hasUsResults || hasFallbacks || chips.length > 0;
      if (shouldShow && !showResults) {
        console.warn("Results available but showResults is false:", {
          currentQ,
          hasCaResults,
          hasUsResults,
          hasFallbacks,
          chipsCount: chips.length,
          showResults,
          results
        });
      }
    }
  }, [currentQ, hasCaResults, hasUsResults, hasFallbacks, chips.length, showResults, results]);

  // Debug logging in useEffect to avoid running on every render
  useEffect(() => {
    if (q.trim() && typeof window !== "undefined") {
      const caCount = (results.ca?.results || []).length;
      const usCount = (results.us?.bills || results.us?.data?.bills || []).length;
      const fallbacksCount = (results.fallbacks || []).length;
      console.log("Search state updated:", {
        q,
        hasCaResults,
        hasUsResults,
        hasFallbacks,
        chipsCount: chips.length,
        showResults,
        caResultsCount: caCount,
        usBillsCount: usCount,
        fallbacksCount: fallbacksCount,
        resultsStructure: {
          ca: results.ca ? Object.keys(results.ca) : null,
          us: results.us ? Object.keys(results.us) : null,
          hasFallbacks: 'fallbacks' in results
        }
      });
    }
  }, [q, hasCaResults, hasUsResults, hasFallbacks, chips.length, showResults, results]);

  const isLikelyFederal = /\b(hr|s|senate|house|congress|federal)\b/i.test(q);
  const caDirect = useMemo(() => caResultsArray.filter((r: any) => r._direct), [caResultsArray]);
  const caRelated = useMemo(() => caResultsArray.filter((r: any) => !r._direct), [caResultsArray]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:gap-10">
      <TourOverlay />
      <section className="card p-8 animate-fade-in-up relative overflow-hidden" id="about">
        <h1 className="text-3xl font-semibold text-gray-100 dark:text-gray-900">Clarity on every ballot.</h1>
        <p className="mt-2 text-lg text-gray-300 dark:text-gray-700">Empowering voters, parents, and students to understand policy at a glance.</p>
        <p className="mt-3 text-sm text-gray-400 dark:text-gray-600">Instant plain‑English summaries of every ballot measure and law. Neutral. Sourced. Searchable. Accessible.</p>
        <div className="mt-5 flex items-center gap-3">
          <a href="#home-search" className="liquid-button px-6 py-2.5 font-semibold">Get started</a>
          <a href="/about" className="text-sm text-accent hover:underline focus-ring rounded">How it works</a>
        </div>
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="mt-6">
          <HeroGraphic />
        </div>
      </section>
      <section className="card p-6 animate-fade-in-up">
        <h2 className="text-2xl font-semibold text-gray-100 dark:text-gray-900">Why ClearPolicy?</h2>
        <p className="mt-2 text-sm text-gray-300 dark:text-gray-700">
          Most voters feel lost, overwhelmed, and uncertain—ballot measures are pages long, packed with legal jargon, while search engines and AI tools often deliver biased, campaign-driven summaries and paid perspectives.
        </p>
        <p className="mt-3 text-sm text-gray-300 dark:text-gray-700">
          ClearPolicy exists to cut through the confusion.
        </p>
        <p className="mt-3 text-sm text-gray-300 dark:text-gray-700">
          Unlike Google, news feeds, or government pamphlets, we instantly give you neutral, easy-to-understand summaries—sourced directly from nonpartisan records. No ads, no sponsored messages, no political spin. Just the facts and unbiased context to help you make real choices for your community.
        </p>
        <p className="mt-3 text-sm text-gray-300 dark:text-gray-700">
          You deserve clarity. You deserve trustworthy information. You deserve the power to decide for yourself.
        </p>
      </section>
      <HomeDemo />
      <Illustration label="App in action" />
      <section className="card p-6 animate-fade-in-up">
        <h2 className="text-2xl font-semibold text-gray-100 dark:text-gray-900">Find a bill or proposition</h2>
        <form
          id="home-search-form"
          className="mt-4 flex flex-col gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            // Get the value directly from the form to ensure we have the latest value
            const form = e.currentTarget;
            const input = form.querySelector('input[type="text"]') as HTMLInputElement;
            const query = input?.value?.trim() || q.trim();
            console.log("Form submitted with query:", query, "from input:", input?.value, "from state q:", q);
            if (query) {
              setShowSuggest(false);
              // Update q state immediately, then search
              setQ(query);
              // Use await to ensure state is set, but doSearch will also set q
              await doSearch(query).catch(err => {
                console.error("Search failed in form submit:", err);
              });
            } else {
              console.log("Empty query, not searching");
            }
          }}
          role="search"
        >
          <div className="flex gap-2 items-start">
            <label htmlFor="home-search" className="sr-only">Search</label>
            <input
              id="home-search"
              type="text"
              value={q}
              onChange={(e) => {
                const value = e.target.value;
                setQ(value);
                requestSuggestions(value);
              }}
              onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
              placeholder="Try: prop 17 retail theft"
              className="glass-input w-full px-4 py-3 text-base animate-input-pulse"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSuggest && suggestions.length > 0}
              aria-haspopup="listbox"
              aria-controls={showSuggest && suggestions.length > 0 ? "search-suggestions" : undefined}
            />
            <button
              type="submit"
              className="liquid-button px-4 py-2 text-sm font-medium min-w-24"
              disabled={loading}
              aria-busy={loading}
              onClick={(e) => {
                // Ensure form submission happens
                const form = e.currentTarget.closest('form');
                if (form && q.trim()) {
                  console.log("Button clicked, triggering search for:", q.trim());
                }
              }}
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>

          {showSuggest && suggestions.length > 0 && (
            <ul id="search-suggestions" role="listbox" className="glass-popover mt-2 p-2 text-sm">
              {suggestions.map((s, i) => (
                <li key={i} role="option" className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/60 dark:hover:bg-white/5 cursor-pointer"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (s.slug) { window.location.href = `/measure/${s.slug}`; } else { setQ(s.label); doSearch(s.label); }
                  }}
                >
                  <span className="text-gray-100 dark:text-gray-900">{s.label}</span>
                  <span className="text-gray-400 dark:text-gray-600">{s.hint}</span>
                </li>
              ))}
            </ul>
          )}
        </form>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <button onClick={() => { setQ("prop 47"); doSearch("prop 47"); }} className="rounded-full border px-3 py-1 focus-ring hover:bg-gray-50 dark:hover:bg-gray-800">“What does Prop 47 change?”</button>
          <button onClick={() => { setQ("95014"); doSearch("95014"); }} className="rounded-full border px-3 py-1 focus-ring hover:bg-gray-50 dark:hover:bg-gray-800">“Who’s my rep for 95014?”</button>
        </div>
        {chips.length > 0 && (
          <div className="mt-4">
            <DisambiguatorChips chips={chips} />
          </div>
        )}
      </section>

      {showResults && (
        <section className="card p-6 animate-fade-in-up" id="search-results-section">
          <h2 className="section-title" role="heading" aria-level={2}>Search Results</h2>
          {!hasCaResults && !hasUsResults && (
            <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-md">
              <p className="text-sm text-amber-900 dark:text-amber-200">No results for “{q}”. Try one of these:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => { setQ("prop 17"); doSearch("prop 17"); }} className="rounded-full border px-3 py-1 focus-ring hover:bg-gray-50 dark:hover:bg-gray-800">Prop 17</button>
                <button onClick={() => { setQ("retail theft"); doSearch("retail theft"); }} className="rounded-full border px-3 py-1 focus-ring hover:bg-gray-50 dark:hover:bg-gray-800">Retail theft</button>
                <button onClick={() => { setQ("campaign finance"); doSearch("campaign finance"); }} className="rounded-full border px-3 py-1 focus-ring hover:bg-gray-50 dark:hover:bg-gray-800">Campaign finance</button>
              </div>
            </div>
          )}
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-gray-100 dark:text-gray-900">California (Open States)</div>
              {hasCaResults ? (
                <>
                  {caDirect.length > 0 && (
                    <ul className="mt-2 space-y-2 text-sm">
                      {caDirect.slice(0, 1).map((r: any, i: number) => {
                        const osId = r.id || r.identifier || "";
                        const href = (r as any)._virtual === "prop" && (r as any).propNum
                          ? `/measure/prop/${encodeURIComponent((r as any).propNum)}`
                          : (r as any).externalUrl || `/measure/live?source=os&id=${encodeURIComponent(osId)}`;
                        const isExternal = Boolean((r as any).externalUrl) && !((r as any)._virtual === "prop");
                        return (
                          <li key={i} className="border-2 border-emerald-300 dark:border-emerald-700 rounded-md p-3 bg-emerald-50/40 dark:bg-emerald-900/10">
                            <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer noopener" : undefined} className="focus-ring rounded block">
                              <div className="font-medium text-gray-100 dark:text-gray-900">{r.title || r.identifier}</div>
                              <div className="mt-1 flex items-center gap-2 text-xs">
                                <span className="inline-flex items-center rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200">Top pick</span>
                                {r._reason && <span className="text-gray-300 dark:text-gray-700">{r._reason}</span>}
                              </div>
                              {r._preview && <div className="mt-1 text-xs text-gray-400 dark:text-gray-600">{r._preview}</div>}
                              {r.classification && <div className="text-gray-400 dark:text-gray-600">{r.classification?.join?.(", ")}</div>}
                              <div className="mt-1 text-xs text-accent">{isExternal ? "Open overview →" : "Open summary →"}</div>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {caDirect.length > 1 && (
                    <ul className="mt-2 space-y-2 text-sm">
                      {caDirect.slice(1, 5).map((r: any, i: number) => {
                        const osId = r.id || r.identifier || "";
                        const href = (r as any)._virtual === "prop" && (r as any).propNum
                          ? `/measure/prop/${encodeURIComponent((r as any).propNum)}`
                          : (r as any).externalUrl || `/measure/live?source=os&id=${encodeURIComponent(osId)}`;
                        const isExternal = Boolean((r as any).externalUrl) && !((r as any)._virtual === "prop");
                        return (
                          <li key={i} className="border border-gray-200 dark:border-gray-700 rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer noopener" : undefined} className="focus-ring rounded block">
                              <div className="font-medium text-gray-100 dark:text-gray-900">{r.title || r.identifier}</div>
                              <div className="mt-1 flex items-center gap-2 text-xs">
                                <span className="inline-flex items-center rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200">Direct</span>
                                {r._reason && <span className="text-gray-400 dark:text-gray-600">{r._reason}</span>}
                              </div>
                              <div className="mt-1 text-xs text-accent">{isExternal ? "Open overview →" : "Open summary →"}</div>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {caRelated.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs uppercase tracking-wider text-gray-500">See also</div>
                      <ul className="mt-2 space-y-2 text-sm">
                        {caRelated.slice(0, 5).map((r: any, i: number) => {
                          const osId = r.id || r.identifier || "";
                          const href = (r as any)._virtual === "prop" && (r as any).propNum
                            ? `/measure/prop/${encodeURIComponent((r as any).propNum)}`
                            : (r as any).externalUrl || `/measure/live?source=os&id=${encodeURIComponent(osId)}`;
                          const isExternal = Boolean((r as any).externalUrl) && !((r as any)._virtual === "prop");
                          return (
                            <li key={i} className="border border-gray-200 dark:border-gray-700 rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer noopener" : undefined} className="focus-ring rounded block">
                                <div className="font-medium text-gray-100 dark:text-gray-900">{r.title || r.identifier}</div>
                                <div className="mt-1 flex items-center gap-2 text-xs">
                                  <span className="inline-flex items-center rounded bg-gray-100 text-gray-700 px-2 py-0.5 border border-gray-200">Related</span>
                                  {r._reason && <span className="text-gray-400 dark:text-gray-600">{r._reason}</span>}
                                </div>
                                {r._preview && <div className="mt-1 text-xs text-gray-400 dark:text-gray-600">{r._preview}</div>}
                                <div className="mt-1 text-xs text-accent">{isExternal ? "Open overview →" : "Open summary →"}</div>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-600">No California results</p>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-100 dark:text-gray-900">Federal (Congress.gov)</div>
              {hasUsResults ? (
                <ul className="mt-2 space-y-2 text-sm">
                  {usBillsArray.slice(0, 5).map((b: any, i: number) => {
                    const id = `${b.congress || b.congressdotgovUrl?.match(/congress=(\d+)/)?.[1] || "118"}:${b.type || b.billType || "hr"}:${b.number?.replace(/\D/g, "") || "0"}`;
                    return (
                      <li key={i} className="border border-gray-200 dark:border-gray-700 rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <a href={`/measure/live?source=congress&id=${encodeURIComponent(id)}`} className="focus-ring rounded block">
                          <div className="font-medium text-gray-100 dark:text-gray-900">{b.title || b.number}</div>
                          {b.latestAction?.text && <div className="text-gray-400 dark:text-gray-600">{b.latestAction.text}</div>}
                          <div className="mt-1 text-xs text-accent">Open summary →</div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-2 text-sm text-gray-400 dark:text-gray-600">
                  No federal results
                  {isLikelyFederal && (
                    <>
                      {" — try a format like "}
                      <span className="font-medium text-gray-200 dark:text-gray-800">H.R. 50</span>
                      {" or "}
                      <span className="font-medium text-gray-200 dark:text-gray-800">S. 50</span>
                      {". Or open a demo:"}
                      <div className="mt-2 flex gap-2">
                        {federalSamples.map((f) => (
                          <a key={f.id} href={`/measure/live?source=congress&id=${encodeURIComponent(f.id)}`} className="rounded-full border px-3 py-1 focus-ring hover:bg-gray-50 dark:hover:bg-gray-800">{f.label}</a>
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

      {null}

      <section id="privacy" className="card p-6 animate-fade-in-up">
        <h2 className="section-title">Privacy</h2>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-600">See our full policy on the <a className="text-accent underline" href="/privacy">Privacy page</a>.</p>
      </section>

      {null}
    </div>
  );
}
