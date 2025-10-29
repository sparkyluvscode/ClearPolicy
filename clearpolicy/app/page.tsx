"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import DisambiguatorChips from "@/components/DisambiguatorChips";
import TourOverlay from "@/components/TourOverlay";
import Link from "next/link";
import HomeDemo from "@/components/HomeDemo";
import FeatureGrid from "@/components/FeatureGrid";
import Testimonials from "@/components/Testimonials";

export default function HomePage() {
  const [q, setQ] = useState("");
  const [chips, setChips] = useState<{ label: string; hint: string; slug?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ ca?: any; us?: any }>({});
  const [suggestions, setSuggestions] = useState<{ label: string; hint: string; slug?: string }[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestAbort = useRef<AbortController | null>(null);
  const suggestTimeout = useRef<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    if (query) {
      setQ(query);
      void doSearch(query);
    }
  }, []);

  async function doSearch(query: string) {
    setLoading(true);
    try {
      const url = new URL("/api/search", window.location.origin);
      url.searchParams.set("q", query);
      const res = await fetch(url.toString());
      const data = await res.json();
      setChips(data.chips || []);
      setResults({ ca: data.ca, us: data.us });
    } finally {
      setLoading(false);
    }
  }

  function requestSuggestions(query: string) {
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
      } catch {}
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

  const hasCaResults = (results.ca?.results || []).length > 0;
  const hasUsResults = (results.us?.data?.bills || []).length > 0;
  const showResults = q && (hasCaResults || hasUsResults || chips.length > 0);

  const isLikelyFederal = /\b(hr|s|senate|house|congress|federal)\b/i.test(q);

  return (
    <div className="grid grid-cols-1 gap-6">
      <TourOverlay />
      {/* Hero */}
      <section className="card p-8" id="about">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Clarity on every ballot.</h1>
        <p className="mt-2 text-lg text-gray-700 dark:text-gray-300">Empowering voters, parents, and students to understand policy at a glance.</p>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Instant plain‑English summaries of every ballot measure and law. Neutral. Sourced. Searchable. Accessible.</p>
        <div className="mt-5 flex items-center gap-3">
          <a href="#home-search" className="liquid-button px-5 py-2">Get started</a>
          <a href="#how" className="text-sm text-accent hover:underline focus-ring rounded">How it works</a>
          <a href="#demo" className="text-sm text-accent hover:underline focus-ring rounded">Watch demo</a>
        </div>
      </section>
      <HomeDemo />
      <section className="card p-6" id="demo">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Find a bill or proposition</h2>
        <form
          className="mt-4 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) { setShowSuggest(false); doSearch(q); }
          }}
          role="combobox"
          aria-expanded={showSuggest}
          aria-owns="search-suggestions"
          aria-haspopup="listbox"
        >
          <div className="flex gap-2 items-start">
            <label htmlFor="home-search" className="sr-only">Search</label>
            <input
              id="home-search"
              value={q}
              onChange={(e) => { setQ(e.target.value); requestSuggestions(e.target.value); }}
              onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
              placeholder="Try: prop 17 retail theft"
              className="glass-input w-full px-3 py-2 text-sm"
              aria-autocomplete="list"
              aria-controls="search-suggestions"
            />
            <button className="liquid-button px-4 py-2 text-sm font-medium min-w-24" disabled={loading} aria-busy={loading}>
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
                  <span className="text-gray-900 dark:text-gray-100">{s.label}</span>
                  <span className="text-gray-600 dark:text-gray-400">{s.hint}</span>
                </li>
              ))}
            </ul>
          )}
        </form>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <button onClick={() => { setQ("prop 47"); doSearch("prop 47"); } } className="rounded-full border px-3 py-1 focus-ring hover:bg-gray-50 dark:hover:bg-gray-800">“What does Prop 47 change?”</button>
          <button onClick={() => { setQ("95014"); doSearch("95014"); }} className="rounded-full border px-3 py-1 focus-ring hover:bg-gray-50 dark:hover:bg-gray-800">“Who’s my rep for 95014?”</button>
        </div>
        {chips.length > 0 && (
          <div className="mt-4">
            <DisambiguatorChips chips={chips} />
          </div>
        )}
      </section>

      <FeatureGrid />

      {showResults && (
        <section className="card p-6">
          <h2 className="section-title">Search Results</h2>
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
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">California (Open States)</div>
              {hasCaResults ? (
                <ul className="mt-2 space-y-2 text-sm">
                  {(results.ca?.results || []).slice(0, 5).map((r: any, i: number) => {
                    const osId = r.id || r.identifier || "";
                    return (
                      <li key={i} className="border border-gray-200 dark:border-gray-700 rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <a href={`/measure/live?source=os&id=${encodeURIComponent(osId)}`} className="focus-ring rounded block">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{r.title || r.identifier}</div>
                          {r.classification && <div className="text-gray-600 dark:text-gray-400">{r.classification?.join?.(", ")}</div>}
                          <div className="mt-1 text-xs text-accent">Open summary →</div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">No California results</p>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Federal (Congress.gov)</div>
              {hasUsResults ? (
                <ul className="mt-2 space-y-2 text-sm">
                  {(results.us?.data?.bills || []).slice(0, 5).map((b: any, i: number) => {
                    const id = `${b.congress || b.congressdotgovUrl?.match(/congress=(\d+)/)?.[1] || "118"}:${b.type || b.billType || "hr"}:${b.number?.replace(/\D/g, "") || "0"}`;
                    return (
                      <li key={i} className="border border-gray-200 dark:border-gray-700 rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <a href={`/measure/live?source=congress&id=${encodeURIComponent(id)}`} className="focus-ring rounded block">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{b.title || b.number}</div>
                          {b.latestAction?.text && <div className="text-gray-600 dark:text-gray-400">{b.latestAction.text}</div>}
                          <div className="mt-1 text-xs text-accent">Open summary →</div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  No federal results
                  {isLikelyFederal && (
                    <>
                      {" — try a format like "}
                      <span className="font-medium text-gray-800 dark:text-gray-200">H.R. 50</span>
                      {" or "}
                      <span className="font-medium text-gray-800 dark:text-gray-200">S. 50</span>
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

      {/* How it works */}
      <section id="how" className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">How it works</h2>
        <ol className="mt-3 grid gap-4 md:grid-cols-3 text-sm">
          <li className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="font-medium">1. Type a law or ZIP</div>
            <div className="mt-1 text-gray-600 dark:text-gray-400">Search any bill, proposition, or your ZIP for local officials.</div>
          </li>
          <li className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="font-medium">2. See a plain‑English summary</div>
            <div className="mt-1 text-gray-600 dark:text-gray-400">Sections include TL;DR, What, Who, Pros, Cons with citations.</div>
          </li>
          <li className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="font-medium">3. Verify and choose</div>
            <div className="mt-1 text-gray-600 dark:text-gray-400">Show cited lines, adjust reading level, and explore official sources.</div>
          </li>
        </ol>
      </section>

      <section className="card p-6">
        <h2 className="section-title">Sample measures</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Explore these fully-featured measure cards with reading levels, citations, and sources.</p>
        <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
          {quickLinks.map((l) => (
            <li key={l.slug} className="py-3">
              <Link href={`/measure/${l.slug}`} className="text-accent hover:underline focus-ring rounded">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Testimonials />

      {/* Privacy */}
      <section id="privacy" className="card p-6">
        <h2 className="section-title">Privacy</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">We do not sell personal data. This app stores only basic preferences (like theme) in your browser. Contact us for any concerns.</p>
      </section>
    </div>
  );
}
