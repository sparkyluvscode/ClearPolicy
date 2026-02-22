"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import AnswerCard from "@/components/AnswerCard";
import { simplify } from "@/lib/reading";
import type { Source, AnswerSection } from "@/lib/omni-types";

type ReadingLevel = "5" | "8" | "12";
const READING_LEVELS: { level: ReadingLevel; label: string }[] = [
  { level: "5", label: "Simple" },
  { level: "8", label: "Standard" },
  { level: "12", label: "Detailed" },
];

interface CardData {
  id: string;
  userQuery?: string;
  heading: string;
  cardType: "general" | "verified" | "debate" | "document";
  sections: AnswerSection[];
  followUpSuggestions: string[];
}

export function ShareView({
  policyName,
  policyLevel,
  cards: initialCards,
  sources,
}: {
  policyName: string;
  policyLevel: string;
  cards: CardData[];
  sources: Source[];
}) {
  const router = useRouter();
  const [cards, setCards] = useState<CardData[]>(initialCards);
  const [rawCards] = useState<CardData[]>(initialCards);
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("8");
  const [entered, setEntered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted) requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
  }, [mounted]);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleReadingLevelChange(level: ReadingLevel) {
    setReadingLevel(level);
    setCards(rawCards.map(c => level === "8" ? c : {
      ...c,
      sections: c.sections.map(s => ({ ...s, content: simplify(s.content, level) })),
    }));
  }

  const allVerified = cards.flatMap(c => c.sections).filter(s => s.confidence === "verified").length;
  const totalSections = cards.flatMap(c => c.sections).length;

  const ui = (
    <div className="fixed inset-0 flex" style={{ zIndex: 99999, background: "var(--cp-bg)" }}>
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className={`flex-shrink-0 border-b border-[var(--cp-border)] bg-[var(--cp-bg)] px-4 sm:px-6 transition-all duration-500 ease-out ${entered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
          <div className="flex items-center justify-between h-12 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => router.push("/")} className="flex items-center gap-1.5 text-sm text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                ClearPolicy
              </button>
              {policyName && (
                <>
                  <span className="text-[var(--cp-border-medium)]">|</span>
                  <span className="text-sm text-[var(--cp-text)] font-medium truncate">{policyName}</span>
                  {policyLevel && <span className="text-[11px] text-[var(--cp-tertiary)]">{policyLevel}</span>}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center rounded-lg bg-[var(--cp-surface-2)] p-0.5">
                {READING_LEVELS.map(rl => (
                  <button
                    key={rl.level}
                    onClick={() => handleReadingLevelChange(rl.level)}
                    className={`text-[12px] px-3 py-1.5 rounded-md transition-all font-medium ${readingLevel === rl.level ? "bg-[var(--cp-bg)] text-[var(--cp-text)] shadow-sm" : "text-[var(--cp-muted)] hover:text-[var(--cp-text)]"}`}
                  >
                    {rl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className={`max-w-3xl mx-auto px-5 sm:px-8 py-8 transition-all duration-500 ease-out delay-100 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--cp-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--cp-accent)]">
              Shared research brief
            </div>
            {cards.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-[var(--cp-tertiary)] mb-2">
                <svg className="w-3 h-3 text-[var(--cp-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{allVerified}/{totalSections} cited</span>
                <span className="text-[var(--cp-border-medium)]">&middot;</span>
                <span>{sources.length} sources</span>
              </div>
            )}
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
            <div className="mt-10 pt-6 border-t border-[var(--cp-border)] text-center">
              <p className="text-sm text-[var(--cp-muted)] mb-3">Want to explore this topic further?</p>
              <button onClick={() => router.push("/")} className="inline-flex items-center gap-2 rounded-xl bg-[var(--cp-accent)] px-5 py-2.5 text-sm font-medium text-white hover:brightness-110 transition-all">
                Try ClearPolicy
              </button>
            </div>
            <div className="h-20" />
          </div>
        </div>
      </div>

      {/* Sources panel */}
      <aside className="hidden md:flex w-80 flex-shrink-0 flex-col border-l border-[var(--cp-border)] bg-[var(--cp-bg)]">
        <div className="flex-shrink-0 border-b border-[var(--cp-border)] px-4 py-3">
          <h3 className="font-heading text-sm font-bold text-[var(--cp-text)]">Sources{sources.length > 0 ? ` (${sources.length})` : ""}</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {activeSource ? (
            <div className="border-b border-[var(--cp-border)] p-4 animate-fade-in bg-[var(--cp-surface)]/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--cp-muted)]">Preview</span>
                <button onClick={() => setActiveSource(null)} className="p-1 rounded-lg hover:bg-[var(--cp-surface-2)] transition-colors text-[var(--cp-muted)]" aria-label="Close">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <h4 className="text-sm font-semibold text-[var(--cp-text)] leading-snug mb-1.5">{activeSource.title}</h4>
              {activeSource.url && (
                <a href={activeSource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--cp-accent)] hover:underline font-medium">
                  View source
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              )}
            </div>
          ) : null}
          {sources.length > 0 ? (
            <div className="p-3 space-y-0.5">
              {sources.map((source, i) => {
                let hostname = "";
                try { if (source.url) hostname = new URL(source.url).hostname.replace("www.", ""); } catch {}
                return (
                  <button key={source.id} onClick={() => setActiveSource(source)} className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${activeSource?.id === source.id ? "bg-[var(--cp-accent-soft)]" : "hover:bg-[var(--cp-surface)]"}`}>
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
          ) : (
            <div className="p-5 text-center"><p className="text-[13px] text-[var(--cp-tertiary)]">No sources for this brief.</p></div>
          )}
        </div>
      </aside>
    </div>
  );

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-[var(--cp-bg)] flex items-center justify-center" style={{ zIndex: 99999 }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-[var(--cp-accent)]/30 border-t-[var(--cp-accent)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--cp-muted)]">Loading shared brief...</p>
        </div>
      </div>
    );
  }

  return createPortal(ui, document.body);
}
