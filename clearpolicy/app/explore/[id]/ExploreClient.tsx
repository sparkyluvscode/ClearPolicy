"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import AnswerCard from "@/components/AnswerCard";
import ExplainThis from "@/components/ExplainThis";
import { simplify } from "@/lib/reading";
import { useToast } from "@/components/Toast";
import type { Source, AnswerSection } from "@/lib/omni-types";

type ReadingLevel = "5" | "8" | "12";
const READING_LEVELS: { level: ReadingLevel; label: string }[] = [
  { level: "5", label: "Simple" },
  { level: "8", label: "Standard" },
  { level: "12", label: "Detailed" },
];

interface ConversationCard {
  id: string;
  userQuery?: string;
  heading: string;
  cardType: "general" | "verified" | "debate" | "document";
  sections: AnswerSection[];
  followUpSuggestions: string[];
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * ExploreClient renders the saved conversation in the same immersive
 * full-screen portal UI as the live search page, enabling follow-ups
 * against the existing conversation history.
 */
export function ExploreClient({
  conversationId,
  policyName: initialPolicyName,
  policyLevel: initialPolicyLevel,
  originalQuery,
  zip,
  cards: initialCards,
  sources: initialSources,
}: {
  conversationId: string;
  policyName: string;
  policyLevel: string;
  originalQuery: string;
  zip?: string;
  cards: ConversationCard[];
  sources: Source[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [cards, setCards] = useState<ConversationCard[]>(initialCards);
  const [rawCards, setRawCards] = useState<ConversationCard[]>(initialCards);
  const [sources] = useState<Source[]>(initialSources);
  const [policyName] = useState(initialPolicyName);
  const [policyLevel] = useState(initialPolicyLevel);

  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [mobileSourcesOpen, setMobileSourcesOpen] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("8");
  const [entered, setEntered] = useState(false);
  const [mounted, setMounted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build conversation history from existing cards
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>(() => {
    const history: ConversationMessage[] = [];
    if (originalQuery) {
      history.push({ role: "user", content: originalQuery });
    }
    for (const card of initialCards) {
      if (card.userQuery) {
        history.push({ role: "user", content: card.userQuery });
      }
      history.push({ role: "assistant", content: card.heading });
    }
    return history;
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
    }
  }, [mounted]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.classList.add("cp-immersive");
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("cp-immersive");
    };
  }, []);

  const applyReadingLevel = useCallback((card: ConversationCard, level: ReadingLevel): ConversationCard => {
    if (level === "8") return card;
    return {
      ...card,
      sections: card.sections.map(s => ({
        ...s,
        content: simplify(s.content, level),
      })),
    };
  }, []);

  function handleReadingLevelChange(level: ReadingLevel) {
    setReadingLevel(level);
    setCards(rawCards.map(c => applyReadingLevel(c, level)));
  }

  function mapSectionsToOmni(sections: Record<string, unknown>, fullTextSummary: string): AnswerSection[] {
    const result: AnswerSection[] = [];
    const summary = sections.summary as string | undefined;
    if (summary) {
      result.push({ heading: "Summary", content: summary, citations: [], confidence: "verified" });
    }
    const kp = sections.keyProvisions as string[] | undefined;
    if (kp?.length) {
      result.push({ heading: "Key points", content: kp.join("\n\n"), citations: [], confidence: "verified" });
    }
    const af = sections.argumentsFor as string[] | undefined;
    if (af?.length) {
      result.push({ heading: "Arguments for", content: af.map(p => p.trim()).filter(Boolean).join("\n"), citations: [], confidence: "inferred" });
    }
    const aa = sections.argumentsAgainst as string[] | undefined;
    if (aa?.length) {
      result.push({ heading: "Arguments against", content: aa.map(p => p.trim()).filter(Boolean).join("\n"), citations: [], confidence: "inferred" });
    }
    if (result.length === 0) {
      result.push({ heading: "Follow-up", content: fullTextSummary, citations: [], confidence: "verified" });
    }
    return result;
  }

  async function handleFollowUp(q: string) {
    if (!q.trim() || followUpLoading) return;
    setFollowUpLoading(true);
    setFollowUpQuery("");
    try {
      const res = await fetch(`/api/conversation/${conversationId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q.trim(), persona: "general" }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json) {
        throw new Error(json?.error || "Follow-up request failed. Please try again.");
      }

      const heading = json.answer?.policyName || "Follow-up";
      const sections = mapSectionsToOmni(
        json.answer?.sections || {},
        json.answer?.fullTextSummary || ""
      );
      const followUpSuggestions: string[] = json.followUpSuggestions || [];

      const isExplainThis = q.trim().startsWith('Explain this in more detail in plain English: "');
      const displayQuery = isExplainThis ? undefined : q.trim();

      const newFollowUp: ConversationCard = {
        id: json.assistantMessage?.id || `card-${cards.length}`,
        userQuery: displayQuery,
        heading,
        cardType: "general",
        sections,
        followUpSuggestions,
      };
      setRawCards(prev => [...prev, newFollowUp]);
      setCards(prev => [...prev, applyReadingLevel(newFollowUp, readingLevel)]);
      setConversationHistory(prev => [
        ...prev,
        { role: "user", content: q.trim() },
        { role: "assistant", content: heading },
      ]);
      setTimeout(
        () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
        150
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Follow-up failed");
    } finally {
      setFollowUpLoading(false);
    }
  }

  function handleExplainThis(selectedText: string) {
    const internalQuery = `Explain this in more detail in plain English: "${selectedText}"`;
    handleFollowUp(internalQuery);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (followUpQuery.trim()) handleFollowUp(followUpQuery.trim());
  }

  function goBack() {
    router.push("/history");
  }

  const latestCard = cards[cards.length - 1];
  const allVerified = cards.flatMap(c => c.sections).filter(s => s.confidence === "verified").length;
  const totalSections = cards.flatMap(c => c.sections).length;

  const immersiveUI = (
    <div
      className="fixed inset-0 flex"
      style={{ zIndex: 99999, background: "var(--cp-bg)" }}
    >
      {/* Left: main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <div
          className={`flex-shrink-0 border-b border-[var(--cp-border)] bg-[var(--cp-bg)] px-4 sm:px-6 transition-all duration-500 ease-out ${entered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
        >
          <div className="flex items-center justify-between h-12 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-sm text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                My Research
              </button>
              {policyName && (
                <>
                  <span className="text-[var(--cp-border-medium)]">|</span>
                  <span className="text-sm text-[var(--cp-text)] font-medium truncate">{policyName}</span>
                  {policyLevel && (
                    <span className="text-[11px] text-[var(--cp-tertiary)]">{policyLevel}</span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {cards.length > 0 && (
                <>
                  <div className="hidden sm:flex items-center rounded-lg bg-[var(--cp-surface-2)] p-0.5">
                    {READING_LEVELS.map(rl => (
                      <button
                        key={rl.level}
                        onClick={() => handleReadingLevelChange(rl.level)}
                        className={`text-[12px] px-3 py-1.5 rounded-md transition-all font-medium ${
                          readingLevel === rl.level
                            ? "bg-[var(--cp-bg)] text-[var(--cp-text)] shadow-sm"
                            : "text-[var(--cp-muted)] hover:text-[var(--cp-text)]"
                        }`}
                      >
                        {rl.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const text = cards.map(c => `${c.heading}\n\n${c.sections.map(s => `${s.heading}\n${s.content}`).join("\n\n")}`).join("\n\n---\n\n");
                      navigator.clipboard.writeText(text).then(() => toast("Copied to clipboard"));
                    }}
                    className="p-2 rounded-lg text-[var(--cp-muted)] hover:text-[var(--cp-text)] hover:bg-[var(--cp-surface)] transition-all"
                    aria-label="Copy summary"
                    title="Copy summary"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/conversations/${conversationId}/share`, { method: "POST" });
                        const data = await res.json();
                        if (data.url) {
                          await navigator.clipboard.writeText(data.url);
                          toast("Share link copied!");
                        }
                      } catch { toast("Failed to generate share link"); }
                    }}
                    className="p-2 rounded-lg text-[var(--cp-muted)] hover:text-[var(--cp-text)] hover:bg-[var(--cp-surface)] transition-all"
                    aria-label="Share"
                    title="Share link"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile reading level row */}
        {cards.length > 0 && (
          <div className="sm:hidden flex-shrink-0 border-b border-[var(--cp-border)] bg-[var(--cp-bg)] px-4 py-1.5">
            <div className="flex items-center justify-center rounded-lg bg-[var(--cp-surface-2)] p-0.5">
              {READING_LEVELS.map(rl => (
                <button
                  key={rl.level}
                  onClick={() => handleReadingLevelChange(rl.level)}
                  className={`flex-1 text-[11px] px-2 py-1 rounded-md transition-all font-medium ${readingLevel === rl.level ? "bg-[var(--cp-bg)] text-[var(--cp-text)] shadow-sm" : "text-[var(--cp-muted)]"}`}
                >
                  {rl.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div ref={scrollRef} data-scroll-container className="flex-1 overflow-y-auto">
          <div
            ref={contentRef}
            className={`max-w-3xl mx-auto px-5 sm:px-8 py-8 transition-all duration-500 ease-out delay-100 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
          >
            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
                <button onClick={() => setError(null)} className="ml-3 underline">
                  Dismiss
                </button>
              </div>
            )}

            {/* Trust line */}
            {cards.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-[var(--cp-tertiary)] mb-2 animate-fade-in">
                <svg className="w-3 h-3 text-[var(--cp-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  {allVerified}/{totalSections} cited
                </span>
                <span className="text-[var(--cp-border-medium)]">&middot;</span>
                <span>{sources.length} sources</span>
              </div>
            )}

            {/* Answer cards */}
            <div className="space-y-10">
              {cards.map(card => (
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
            {latestCard && latestCard.followUpSuggestions.length > 0 && !followUpLoading && (
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

        {/* Bottom input */}
        {cards.length > 0 && (
          <div
            className={`flex-shrink-0 border-t border-[var(--cp-border)] bg-[var(--cp-bg)] pb-safe transition-all duration-500 ease-out delay-200 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
          >
            <div className="max-w-3xl mx-auto px-5 sm:px-8 py-3">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={followUpQuery}
                  onChange={e => setFollowUpQuery(e.target.value)}
                  disabled={followUpLoading}
                  placeholder={`Ask a follow-up about ${policyName || "this policy"}...`}
                  aria-label="Ask a follow-up question"
                  className="w-full pl-4 pr-12 py-3 rounded-xl glass-input text-[var(--cp-text)] text-[15px] placeholder:text-[var(--cp-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--cp-accent)]/15 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!followUpQuery.trim() || followUpLoading}
                  aria-label="Send follow-up question"
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

      {/* Right: Sources panel */}
      <aside className="hidden md:flex w-80 flex-shrink-0 flex-col border-l border-[var(--cp-border)] bg-[var(--cp-bg)]">
        <div className="flex-shrink-0 border-b border-[var(--cp-border)] px-4 py-3">
          <h3 className="font-heading text-sm font-bold text-[var(--cp-text)]">
            Sources{sources.length > 0 ? ` (${sources.length})` : ""}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {activeSource ? (
            <div className="border-b border-[var(--cp-border)] p-4 animate-fade-in bg-[var(--cp-surface)]/50">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cp-tertiary)] mb-2">
                Preview
              </p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--cp-muted)]">
                  {activeSource.type === "federal_bill"
                    ? "Federal"
                    : activeSource.type === "state_bill"
                    ? "State"
                    : activeSource.type === "government_site"
                    ? "Gov"
                    : activeSource.type === "news_article"
                    ? "News"
                    : "Web"}
                </span>
                <button
                  onClick={() => setActiveSource(null)}
                  className="p-1 rounded-lg hover:bg-[var(--cp-surface-2)] transition-colors text-[var(--cp-muted)]"
                  aria-label="Close preview"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h4 className="text-sm font-semibold text-[var(--cp-text)] leading-snug mb-1.5">
                {activeSource.title}
              </h4>
              {(() => {
                const pub = activeSource.publisher;
                let domain = "";
                try {
                  if (activeSource.url) domain = new URL(activeSource.url).hostname.replace("www.", "");
                } catch {}
                const shown = pub || domain;
                return shown ? (
                  <p className="text-[10px] text-[var(--cp-tertiary)] mb-1.5">{shown}</p>
                ) : null;
              })()}
              {activeSource.snippet && activeSource.snippet !== activeSource.title && (
                <p className="text-[12px] text-[var(--cp-muted)] leading-relaxed mb-2 line-clamp-3">
                  {activeSource.snippet}
                </p>
              )}
              {activeSource.url && (
                <a
                  href={activeSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[var(--cp-accent)] hover:underline font-medium"
                >
                  View source
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>
          ) : sources.length > 0 ? (
            <div className="px-4 py-2 border-b border-[var(--cp-border)]">
              <p className="text-[11px] text-[var(--cp-tertiary)]">Click a source below for a preview.</p>
            </div>
          ) : null}
          {sources.length > 0 ? (
            <div className="p-3 space-y-0.5">
              {sources.map((source, i) => {
                let hostname = "";
                try {
                  if (source.url) hostname = new URL(source.url).hostname.replace("www.", "");
                } catch {}
                return (
                  <button
                    key={source.id}
                    onClick={() => setActiveSource(source)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                      activeSource?.id === source.id
                        ? "bg-[var(--cp-accent-soft)]"
                        : "hover:bg-[var(--cp-surface)]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-[11px] font-semibold text-[var(--cp-accent)] mt-0.5 w-4 text-right flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] text-[var(--cp-text)] leading-snug">{source.title}</p>
                        <p className="text-[10px] text-[var(--cp-tertiary)] mt-0.5">
                          {source.publisher || hostname}
                          {" · "}
                          {source.type === "federal_bill"
                            ? "Federal"
                            : source.type === "state_bill"
                            ? "State"
                            : source.type === "government_site"
                            ? "Gov"
                            : source.type === "news_article"
                            ? "News"
                            : "Web"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-5 text-center">
              <p className="text-[13px] text-[var(--cp-tertiary)]">No sources saved for this conversation.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sources drawer */}
      {sources.length > 0 && (
        <>
          <button
            onClick={() => setMobileSourcesOpen(true)}
            className="md:hidden fixed bottom-24 right-4 z-[99998] rounded-full p-3 glass-card shadow-elevated text-[var(--cp-muted)] hover:text-[var(--cp-text)] mb-safe"
            aria-label="Open sources"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>
          {mobileSourcesOpen && (
            <>
              <div
                className="md:hidden fixed inset-0 bg-black/20 z-[100000]"
                onClick={() => setMobileSourcesOpen(false)}
                aria-hidden
              />
              <aside className="md:hidden fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[var(--cp-bg)] border-l border-[var(--cp-border)] shadow-elevated z-[100001] flex flex-col animate-slide-in">
                <div className="flex-shrink-0 flex items-center justify-between border-b border-[var(--cp-border)] px-4 py-3">
                  <h3 className="font-heading text-sm font-bold text-[var(--cp-text)]">
                    Sources ({sources.length})
                  </h3>
                  <button
                    onClick={() => setMobileSourcesOpen(false)}
                    className="p-2 rounded-lg hover:bg-[var(--cp-surface-2)] text-[var(--cp-muted)]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                  {sources.map((source, i) => {
                    let hostname = "";
                    try {
                      if (source.url) hostname = new URL(source.url).hostname.replace("www.", "");
                    } catch {}
                    return (
                      <button
                        key={source.id}
                        onClick={() => {
                          setActiveSource(source);
                          setMobileSourcesOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[var(--cp-surface)] transition-all"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-[11px] font-semibold text-[var(--cp-accent)] mt-0.5 w-4 text-right flex-shrink-0">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13px] text-[var(--cp-text)] leading-snug">{source.title}</p>
                            <p className="text-[10px] text-[var(--cp-tertiary)] mt-0.5">
                              {source.publisher || hostname}
                            </p>
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

      {/* Explain This popover */}
      {cards.length > 0 && (
        <ExplainThis containerRef={contentRef} onExplain={handleExplainThis} />
      )}
    </div>
  );

  if (!mounted) {
    return (
      <div
        className="fixed inset-0 bg-[var(--cp-bg)] flex items-center justify-center"
        style={{ zIndex: 99999 }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-[var(--cp-accent)]/30 border-t-[var(--cp-accent)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--cp-muted)]">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return createPortal(immersiveUI, document.body);
}
