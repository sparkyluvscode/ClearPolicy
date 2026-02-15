"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import AnswerCard from "@/components/AnswerCard";
import ExplainThis from "@/components/ExplainThis";
import type {
  OmniResponse, Source, AnswerSection, PerspectiveView, RhetoricCheck, Persona,
} from "@/lib/omni-types";
import { PERSONA_LABELS } from "@/lib/omni-types";

const ALL_PERSONAS: Persona[] = [
  "general", "student", "homeowner", "small_biz", "renter", "immigrant", "parent",
];

interface ConversationCard {
  id: string;
  userQuery?: string;
  heading: string;
  cardType: "general" | "verified" | "debate" | "document";
  sections: AnswerSection[];
  followUpSuggestions: string[];
  perspectives?: PerspectiveView[];
  rhetoricCheck?: RhetoricCheck;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/* ================================================================
   Full-screen immersive search experience.
   Uses createPortal to render directly on document.body, bypassing
   all layout wrappers and stacking contexts.
   ================================================================ */
function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cards, setCards] = useState<ConversationCard[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [policyName, setPolicyName] = useState("");
  const [policyLevel, setPolicyLevel] = useState("");
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);

  const [loading, setLoading] = useState(true);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [mobileSourcesOpen, setMobileSourcesOpen] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [persona, setPersona] = useState<Persona>("general");
  const [personaLoading, setPersonaLoading] = useState(false);
  const [entered, setEntered] = useState(false);
  const [mounted, setMounted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Portal needs client-side mount check
  useEffect(() => { setMounted(true); }, []);

  // Entrance animation — slight delay so portal renders first
  useEffect(() => {
    if (mounted) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
    }
  }, [mounted]);

  // Activate immersive mode: hide overflow, hide site header/footer
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.classList.add("cp-immersive");
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("cp-immersive");
    };
  }, []);

  // Initial search
  useEffect(() => {
    const q = searchParams?.get("q");
    const zip = searchParams?.get("zip");
    const debate = searchParams?.get("debate") === "1";
    const p = searchParams?.get("persona") as Persona | null;
    const hasDoc = searchParams?.get("doc") === "1";
    if (!q) { router.push("/"); return; }
    if (p && ALL_PERSONAS.includes(p)) setPersona(p);

    let docText: string | undefined;
    let docName: string | undefined;
    if (hasDoc) {
      try { docText = sessionStorage.getItem("cp-doc-text") || undefined; } catch {}
      try { docName = sessionStorage.getItem("cp-doc-name") || undefined; } catch {}
      try { sessionStorage.removeItem("cp-doc-text"); sessionStorage.removeItem("cp-doc-name"); } catch {}
    }
    performSearch(q, zip || undefined, debate, p || "general", docText, docName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const performSearch = useCallback(
    async (q: string, zip?: string, debate?: boolean, p?: Persona, documentText?: string, documentFilename?: string) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true); setError(null); setCards([]); setSources([]);
      setConversationHistory([]);

      try {
        const body: Record<string, unknown> = {
          query: q, zip, debateMode: debate,
          persona: p || persona, readingLevel: "8",
        };
        if (documentText) { body.documentText = documentText; body.documentFilename = documentFilename; }
        const res = await fetch("/api/omni", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body), signal: controller.signal,
        });
        const text = await res.text();
        let data: { success?: boolean; error?: string; data?: OmniResponse };
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(res.ok ? "Invalid response from server" : "Server returned an error. Please try again.");
        }
        if (!data.success) throw new Error(data.error || "Search failed");
        if (!data.data) throw new Error("No data returned");

        const result: OmniResponse = data.data;
        setSources(result.sources);
        setPolicyName(result.title);
        setPolicyLevel(
          result.sources.some(s => s.jurisdiction === "federal") ? "Federal" :
          result.sources.some(s => s.jurisdiction === "state") ? "State" : ""
        );

        const verified = result.sections.filter(s => s.confidence === "verified").length;
        const total = result.sections.length;
        const cardType = total > 0 && verified === total ? "verified" :
                         result.intent === "debate_prep" ? "debate" :
                         result.intent === "document_analysis" ? "document" : "general";

        const followUps = result.followUps.length > 0 ? result.followUps : [
          zip ? `How does this affect people in ${zip}?` : "What are the local implications?",
          "Show the main arguments for and against",
          "Compare to similar policies",
        ];

        setCards([{
          id: "card-0", heading: result.title, cardType,
          sections: result.sections,
          followUpSuggestions: followUps.slice(0, 3),
          perspectives: result.perspectives,
          rhetoricCheck: result.rhetoricCheck,
        }]);
        setConversationHistory([
          { role: "user", content: q },
          { role: "assistant", content: result.tldr || result.title },
        ]);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally { setLoading(false); setPersonaLoading(false); }
    },
    [persona]
  );

  async function handleFollowUp(q: string) {
    if (!q.trim() || followUpLoading) return;
    setFollowUpLoading(true); setFollowUpQuery("");
    try {
      const zip = searchParams?.get("zip");
      const res = await fetch("/api/followup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q.trim(), policyName, conversationHistory, sources,
          zip: zip || undefined, persona, readingLevel: "8",
        }),
      });
      const text = await res.text();
      let data: { success?: boolean; error?: string; data?: { heading: string; cardType?: string; sections: AnswerSection[]; followUpSuggestions?: string[] } };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(res.ok ? "Invalid response" : "Follow-up request failed. Please try again.");
      }
      if (!data.success) throw new Error(data.error || "Follow-up failed");
      const fd = data.data;
      if (!fd) throw new Error("No data returned");

      const isExplainThis = q.trim().startsWith('Explain this in more detail in plain English: "');
      const displayQuery = isExplainThis ? undefined : q.trim();

      const cardType = (fd.cardType === "verified" || fd.cardType === "debate" || fd.cardType === "document"
        ? fd.cardType
        : "general") as ConversationCard["cardType"];
      setCards(prev => [...prev, {
        id: `card-${prev.length}`, userQuery: displayQuery,
        heading: fd.heading, cardType,
        sections: fd.sections,
        followUpSuggestions: fd.followUpSuggestions || [],
      }]);
      setConversationHistory(prev => [
        ...prev,
        { role: "user", content: q.trim() },
        { role: "assistant", content: fd.heading },
      ]);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 150);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Follow-up failed");
    } finally { setFollowUpLoading(false); }
  }

  function handleExplainThis(selectedText: string) {
    const internalQuery = `Explain this in more detail in plain English: "${selectedText}"`;
    handleFollowUp(internalQuery);
  }

  function handlePersonaChange(p: Persona) {
    setPersona(p); setPersonaLoading(true);
    const q = searchParams?.get("q"); const zip = searchParams?.get("zip");
    const debate = searchParams?.get("debate") === "1";
    if (q) performSearch(q, zip || undefined, debate, p);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (followUpQuery.trim()) handleFollowUp(followUpQuery.trim());
  }

  function goBack() { router.push("/"); }

  const latestCard = cards[cards.length - 1];
  const allVerified = cards.flatMap(c => c.sections).filter(s => s.confidence === "verified").length;
  const totalSections = cards.flatMap(c => c.sections).length;

  // ── The immersive UI: left = content, right = sources always visible ──
  const immersiveUI = (
    <div
      className="fixed inset-0 flex"
      style={{ zIndex: 99999, background: "var(--cp-bg)" }}
    >
      {/* ── Left: main content (top bar + scroll + input) ── */}
      <div className="flex-1 min-w-0 flex flex-col">
      {/* ── Top Bar ── */}
      <div className={`flex-shrink-0 border-b border-[var(--cp-border)] bg-[var(--cp-bg)] px-4 sm:px-6 transition-all duration-500 ease-out ${entered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
        <div className="flex items-center justify-between h-12 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            {policyName && !loading && (
              <>
                <span className="text-[var(--cp-border-medium)]">|</span>
                <span className="text-sm text-[var(--cp-text)] font-medium truncate">{policyName}</span>
                {policyLevel && <span className="text-[11px] text-[var(--cp-tertiary)]">{policyLevel}</span>}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!loading && cards.length > 0 && (
              <div className="hidden sm:flex items-center gap-1">
                {ALL_PERSONAS.slice(0, 4).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePersonaChange(p)}
                    disabled={personaLoading}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition-all ${
                      persona === p ? "bg-[var(--cp-accent-soft)] text-[var(--cp-accent)] font-medium" : "text-[var(--cp-tertiary)] hover:text-[var(--cp-muted)]"
                    }`}
                  >
                    {PERSONA_LABELS[p]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable Content Area ── */}
      <div ref={scrollRef} data-scroll-container className="flex-1 overflow-y-auto">
        <div ref={contentRef} className={`max-w-3xl mx-auto px-5 sm:px-8 py-8 transition-all duration-500 ease-out delay-100 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>

          {/* Loading state — ALWAYS shown during search */}
          {loading && (
            <div className="animate-fade-in pt-8">
              <p className="text-sm text-[var(--cp-tertiary)] mb-8">{searchParams?.get("q")}</p>
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="h-7 w-3/4 rounded-lg bg-[var(--cp-surface-2)] animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-[var(--cp-surface-2)] animate-pulse" style={{ animationDelay: "100ms" }} />
                </div>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2.5" style={{ animationDelay: `${200 + i * 150}ms` }}>
                    <div className="h-3 w-24 rounded bg-[var(--cp-surface-2)] animate-pulse" />
                    <div className="h-4 w-full rounded bg-[var(--cp-surface-2)] animate-pulse" />
                    <div className="h-4 w-full rounded bg-[var(--cp-surface-2)] animate-pulse" />
                    <div className="h-4 w-2/3 rounded bg-[var(--cp-surface-2)] animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="mt-10 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-[var(--cp-accent)]/30 border-t-[var(--cp-accent)] rounded-full animate-spin" />
                <LoadingSteps />
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="pt-16 text-center animate-fade-up">
              <h2 className="font-heading text-xl font-semibold text-[var(--cp-text)] mb-2">Something went wrong</h2>
              <p className="text-[var(--cp-muted)] mb-6">{error}</p>
              <button onClick={goBack} className="text-sm text-[var(--cp-accent)] hover:underline">&larr; Try a different query</button>
            </div>
          )}

          {/* Content dims during persona reload */}
          <div className={`transition-opacity duration-300 ${personaLoading ? "opacity-30" : ""}`}>

            {/* Trust line */}
            {!loading && cards.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-[var(--cp-tertiary)] mb-2 animate-fade-in">
                <svg className="w-3 h-3 text-[var(--cp-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{allVerified}/{totalSections} cited</span>
                <span className="text-[var(--cp-border-medium)]">&middot;</span>
                <span>{sources.length} sources</span>
              </div>
            )}

            {/* Rhetoric check */}
            {cards[0]?.rhetoricCheck?.severity !== "none" && cards[0]?.rhetoricCheck?.deltaAnalysis && !loading && (
              <div className="mb-8 pb-6 border-b border-[var(--cp-border)] animate-fade-up">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--cp-coral)] mb-2">Rhetoric vs. Reality</p>
                <p className="text-sm text-[var(--cp-text)] mb-1"><span className="text-[var(--cp-muted)]">Pitched as:</span> &ldquo;{cards[0].rhetoricCheck!.officialTitle}&rdquo;</p>
                <p className="text-sm text-[var(--cp-text)] mb-1"><span className="text-[var(--cp-muted)]">Actually does:</span> {cards[0].rhetoricCheck!.actualMechanism}</p>
                <p className="text-sm text-[var(--cp-text)] font-medium mt-2 pl-3 border-l-2 border-[var(--cp-coral)]">{cards[0].rhetoricCheck!.deltaAnalysis}</p>
              </div>
            )}

            {/* Perspectives */}
            {cards[0]?.perspectives && cards[0].perspectives.length > 0 && !loading && (
              <div className="mb-8 pb-6 border-b border-[var(--cp-border)] animate-fade-up">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--cp-muted)] mb-3">Compare Perspectives</p>
                <div className="grid gap-4 md:grid-cols-3">
                  {cards[0].perspectives.map((p, i) => (
                    <div key={i}>
                      <p className="text-sm font-semibold text-[var(--cp-text)] mb-1">{p.label}</p>
                      <p className="text-[13px] text-[var(--cp-muted)] leading-relaxed">{p.summary}</p>
                      {p.thinktank && <p className="text-[10px] text-[var(--cp-tertiary)] mt-1">via {p.thinktank}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Answer cards (conversation thread) */}
            <div className="space-y-10">
              {cards.map((card) => (
                <AnswerCard
                  key={card.id}
                  id={card.id}
                  userQuery={card.userQuery}
                  heading={card.heading}
                  cardType={card.cardType}
                  sections={card.sections}
                  onSourceClick={setActiveSource}
                  sources={sources}
                />
              ))}
            </div>

            {/* Follow-up loading */}
            {followUpLoading && (
              <div className="pt-8 border-t border-[var(--cp-border)] animate-fade-up">
                <div className="space-y-3">
                  <div className="h-6 w-2/3 rounded-lg bg-[var(--cp-surface-2)] animate-pulse" />
                  <div className="h-4 w-full rounded bg-[var(--cp-surface-2)] animate-pulse" />
                  <div className="h-4 w-full rounded bg-[var(--cp-surface-2)] animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-[var(--cp-surface-2)] animate-pulse" />
                </div>
              </div>
            )}

            {/* Follow-up suggestions */}
            {!loading && latestCard && latestCard.followUpSuggestions.length > 0 && !followUpLoading && (
              <div className="mt-8 flex flex-wrap gap-2 animate-fade-up">
                {latestCard.followUpSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleFollowUp(s)}
                    className="text-[13px] px-3.5 py-2 rounded-xl border border-[var(--cp-border)] text-[var(--cp-muted)] hover:text-[var(--cp-text)] hover:border-[var(--cp-accent)]/20 hover:bg-[var(--cp-surface)] transition-all active:scale-[0.97]"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="h-20" />
          </div>
        </div>
      </div>

      {/* ── Fixed Bottom Input ── */}
      {!loading && cards.length > 0 && (
        <div className={`flex-shrink-0 border-t border-[var(--cp-border)] bg-[var(--cp-bg)] transition-all duration-500 ease-out delay-200 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <div className="max-w-3xl mx-auto px-5 sm:px-8 py-3">
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={followUpQuery}
                onChange={(e) => setFollowUpQuery(e.target.value)}
                disabled={followUpLoading}
                placeholder={`Ask a follow-up about ${policyName || "this policy"}...`}
                className="w-full pl-4 pr-12 py-3 rounded-xl glass-input text-[var(--cp-text)] text-[15px] placeholder:text-[var(--cp-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--cp-accent)]/15 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!followUpQuery.trim() || followUpLoading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[var(--cp-accent)] text-white hover:brightness-110 disabled:opacity-20 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
            <p className="text-center text-[10px] text-[var(--cp-tertiary)] mt-2">
              Omni-Search &middot; For informational purposes only
            </p>
          </div>
        </div>
      )}

      </div>
      {/* ── Right: Sources panel (always visible) ── */}
      <aside className="hidden md:flex w-80 flex-shrink-0 flex-col border-l border-[var(--cp-border)] bg-[var(--cp-bg)]">
        <div className="flex-shrink-0 border-b border-[var(--cp-border)] px-4 py-3">
          <h3 className="font-heading text-sm font-bold text-[var(--cp-text)]">Sources{sources.length > 0 ? ` (${sources.length})` : ""}</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {activeSource ? (
            <div className="border-b border-[var(--cp-border)] p-4 animate-fade-in bg-[var(--cp-surface)]/50">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cp-tertiary)] mb-2">Preview</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--cp-muted)]">
                  {activeSource.type === "federal_bill" ? "Federal" :
                   activeSource.type === "state_bill" ? "State" :
                   activeSource.type === "government_site" ? "Gov" :
                   activeSource.type === "news_article" ? "News" : "Web"}
                </span>
                <button onClick={() => setActiveSource(null)} className="p-1 rounded-lg hover:bg-[var(--cp-surface-2)] transition-colors text-[var(--cp-muted)]" aria-label="Close preview">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <h4 className="text-sm font-semibold text-[var(--cp-text)] leading-snug mb-1.5">{activeSource.title}</h4>
              {(() => {
                const pub = activeSource.publisher;
                let domain = "";
                try { if (activeSource.url) domain = new URL(activeSource.url).hostname.replace("www.", ""); } catch {}
                const shown = pub || domain;
                return shown ? <p className="text-[10px] text-[var(--cp-tertiary)] mb-1.5">{shown}</p> : null;
              })()}
              {activeSource.snippet && activeSource.snippet !== activeSource.title && (
                <p className="text-[12px] text-[var(--cp-muted)] leading-relaxed mb-2 line-clamp-3">{activeSource.snippet}</p>
              )}
              {activeSource.publishedDate && (
                <p className="text-[10px] text-[var(--cp-tertiary)] mb-2">{activeSource.publishedDate}</p>
              )}
              {activeSource.url && (
                <a href={activeSource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--cp-accent)] hover:underline font-medium">
                  View source
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              )}
            </div>
          ) : sources.length > 0 && (
            <div className="px-4 py-2 border-b border-[var(--cp-border)]">
              <p className="text-[11px] text-[var(--cp-tertiary)]">Click a source below for a preview.</p>
            </div>
          )}
          {sources.length > 0 ? (
            <div className="p-3 space-y-0.5">
              {sources.map((source, i) => {
                let hostname = "";
                try { if (source.url) hostname = new URL(source.url).hostname.replace("www.", ""); } catch {}
                return (
                  <button
                    key={source.id}
                    onClick={() => setActiveSource(source)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                      activeSource?.id === source.id ? "bg-[var(--cp-accent-soft)]" : "hover:bg-[var(--cp-surface)]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-[11px] font-semibold text-[var(--cp-accent)] mt-0.5 w-4 text-right flex-shrink-0">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-[13px] text-[var(--cp-text)] leading-snug">{source.title}</p>
                        <p className="text-[10px] text-[var(--cp-tertiary)] mt-0.5">
                          {source.publisher || hostname}
                          {" · "}
                          {source.type === "federal_bill" ? "Federal" :
                           source.type === "state_bill" ? "State" :
                           source.type === "government_site" ? "Gov" :
                           source.type === "news_article" ? "News" : "Web"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-5 text-center">
              <p className="text-[13px] text-[var(--cp-tertiary)]">Sources will appear here after your search.</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile: sources drawer (slide from right when opened) ── */}
      {sources.length > 0 && (
        <>
          <button
            onClick={() => setMobileSourcesOpen(true)}
            className="md:hidden fixed bottom-20 right-4 z-[99998] rounded-full p-3 glass-card shadow-elevated text-[var(--cp-muted)] hover:text-[var(--cp-text)]"
            aria-label="Open sources"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </button>
          {mobileSourcesOpen && (
            <>
              <div className="md:hidden fixed inset-0 bg-black/20 z-[100000]" onClick={() => setMobileSourcesOpen(false)} aria-hidden />
              <aside className="md:hidden fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[var(--cp-bg)] border-l border-[var(--cp-border)] shadow-elevated z-[100001] flex flex-col animate-slide-in">
                <div className="flex-shrink-0 flex items-center justify-between border-b border-[var(--cp-border)] px-4 py-3">
                  <h3 className="font-heading text-sm font-bold text-[var(--cp-text)]">Sources ({sources.length})</h3>
                  <button onClick={() => setMobileSourcesOpen(false)} className="p-2 rounded-lg hover:bg-[var(--cp-surface-2)] text-[var(--cp-muted)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                  {sources.map((source, i) => {
                    let hostname = "";
                    try { if (source.url) hostname = new URL(source.url).hostname.replace("www.", ""); } catch {}
                    return (
                      <button
                        key={source.id}
                        onClick={() => { setActiveSource(source); setMobileSourcesOpen(false); }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[var(--cp-surface)] transition-all"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-[11px] font-semibold text-[var(--cp-accent)] mt-0.5 w-4 text-right flex-shrink-0">{i + 1}</span>
                          <div className="min-w-0">
                            <p className="text-[13px] text-[var(--cp-text)] leading-snug">{source.title}</p>
                            <p className="text-[10px] text-[var(--cp-tertiary)] mt-0.5">{source.publisher || hostname}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>
            </>
          )}
        </>
      )}

      {/* ── Explain This popover ── */}
      {!loading && cards.length > 0 && (
        <ExplainThis containerRef={contentRef} onExplain={handleExplainThis} />
      )}
    </div>
  );

  // Before mount, show a loading indicator inline (SSR-safe)
  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-[var(--cp-bg)] flex items-center justify-center" style={{ zIndex: 99999 }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-[var(--cp-accent)]/30 border-t-[var(--cp-accent)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--cp-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Portal the entire immersive UI directly to document.body
  return createPortal(immersiveUI, document.body);
}

/** Animated loading step text */
function LoadingSteps() {
  const steps = ["Searching databases", "Analyzing sources", "Cross-referencing", "Building brief"];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setStep(s => (s + 1) % steps.length), 2000);
    return () => clearInterval(interval);
  }, [steps.length]);
  return (
    <span className="text-sm text-[var(--cp-muted)] transition-all">
      {steps[step]}...
    </span>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-[var(--cp-bg)] flex items-center justify-center" style={{ zIndex: 99999 }}>
        <div className="w-6 h-6 border-2 border-[var(--cp-accent)]/30 border-t-[var(--cp-accent)] rounded-full animate-spin" />
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
