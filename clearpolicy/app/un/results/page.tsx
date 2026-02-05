"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Button, Badge, SegmentedControl } from "@/components/ui";
import type { UNDocumentAnalysis, ReadingLevel } from "@/lib/un-types";
import { STAGE_LABELS, PROCESS_LABELS } from "@/lib/un-types";

/**
 * UN Document Analysis Results Page
 * 
 * Features modern UI/UX with:
 * - Smooth animations and transitions
 * - Responsive chat side panel that pushes content
 * - Typing indicators and message animations
 * - Highlight-to-explain with elegant tooltip
 * - Reading level toggle
 * 
 * @module app/un/results/page
 */

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isAnimating?: boolean;
}

function UNResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [analysis, setAnalysis] = useState<UNDocumentAnalysis | null>(null);
  const [documentHash, setDocumentHash] = useState<string | null>(null);
  const [level, setLevel] = useState<ReadingLevel>("8");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["tldr", "objectives", "youth", "glossary"])
  );
  const [loading, setLoading] = useState(true);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  
  // Highlight state
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    async function loadAnalysis() {
      setLoading(true);
      
      // First, check for hash parameter (cached/history access)
      const hashParam = searchParams.get("hash");
      if (hashParam) {
        try {
          const res = await fetch(`/api/un/history?hash=${hashParam}`);
          const data = await res.json();
          if (data.success && data.analysis) {
            setAnalysis(data.analysis);
            setDocumentHash(hashParam); // Use the hash from URL
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to load from hash:", e);
        }
      }
      
      // Fall back to sessionStorage
      const stored = sessionStorage.getItem("un_analysis");
      const storedHash = sessionStorage.getItem("un_document_hash");
      if (stored) {
        try {
          const parsedAnalysis = JSON.parse(stored);
          setAnalysis(parsedAnalysis);
          // Use stored hash, or try to get from URL
          if (storedHash) {
            setDocumentHash(storedHash);
          } else if (hashParam) {
            setDocumentHash(hashParam);
          }
          setLoading(false);
          return;
        } catch (e) {
          console.error("Failed to parse stored analysis:", e);
        }
      }
      
      // No analysis found, redirect
      router.push("/un");
    }
    
    loadAnalysis();
  }, [router, searchParams]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading]);

  // Focus chat input when panel opens
  useEffect(() => {
    if (chatOpen && chatInputRef.current) {
      setTimeout(() => chatInputRef.current?.focus(), 300);
    }
  }, [chatOpen]);

  // Handle text selection for highlight-to-explain
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 10 && text.length < 1000) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect) {
        setSelectedText(text);
        setSelectionPosition({
          x: Math.min(rect.left + rect.width / 2, window.innerWidth - 80),
          y: rect.top - 10,
        });
      }
    } else {
      setSelectedText(null);
      setSelectionPosition(null);
    }
  }, []);

  // Clear selection when clicking elsewhere
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".explain-tooltip")) {
        setTimeout(() => {
          if (!window.getSelection()?.toString().trim()) {
            setSelectedText(null);
            setSelectionPosition(null);
          }
        }, 100);
      }
    };
    
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Send chat message with animation
  const sendChatMessage = async (message: string, highlightedText?: string) => {
    if (!message.trim() || chatLoading) return;
    
    // Check if we have a valid hash
    if (!documentHash) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Unable to connect to the document. Please reload the page and try again.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
      return;
    }
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
      isAnimating: true,
    };
    
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);
    
    // Remove animation flag after animation completes
    setTimeout(() => {
      setChatMessages((prev) =>
        prev.map((m) => (m.id === userMessage.id ? { ...m, isAnimating: false } : m))
      );
    }, 300);
    
    try {
      const res = await fetch("/api/un/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_hash: documentHash,
          user_message: message,
          highlighted_text: highlightedText,
        }),
      });
      
      const data = await res.json();
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.success 
          ? data.assistant_message 
          : (data.error || "Sorry, I couldn't process that. Please try again."),
        timestamp: new Date(),
        isAnimating: true,
      };
      
      setChatMessages((prev) => [...prev, assistantMessage]);
      
      // Remove animation flag
      setTimeout(() => {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === assistantMessage.id ? { ...m, isAnimating: false } : m))
        );
      }, 300);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle explain this button
  const handleExplainThis = () => {
    if (selectedText) {
      setChatOpen(true);
      const message = `Can you explain this in simpler terms?\n\n"${selectedText.slice(0, 500)}${selectedText.length > 500 ? '...' : ''}"`;
      setTimeout(() => sendChatMessage(message, selectedText), 400);
      setSelectedText(null);
      setSelectionPosition(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card className="p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/20 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-2/3 rounded bg-[var(--cp-surface-2)] animate-pulse" />
                <div className="h-3 w-1/3 rounded bg-[var(--cp-surface-2)] animate-pulse" />
              </div>
            </div>
            <div className="space-y-3 pt-4">
              <div className="h-4 w-full rounded bg-[var(--cp-surface-2)] animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-[var(--cp-surface-2)] animate-pulse" />
              <div className="h-4 w-4/6 rounded bg-[var(--cp-surface-2)] animate-pulse" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">📄</div>
          <p className="text-[var(--cp-text)] font-medium mb-2">No analysis found</p>
          <p className="text-[var(--cp-muted)] text-sm mb-4">The document analysis could not be loaded.</p>
          <Link href="/un">
            <Button variant="primary">Analyze a Document</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const currentLevel = analysis.levels[level];

  return (
    <div className="min-h-screen bg-[var(--cp-bg)]">
      {/* Main Content - slides left when chat opens */}
      <div 
        className={`transition-all duration-500 ease-out ${
          chatOpen ? "lg:pr-[420px]" : ""
        }`}
        onMouseUp={handleMouseUp}
      >
        <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
          {/* Header Card */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary" className="animate-fade-in">
                    {STAGE_LABELS[analysis.stage]}
                  </Badge>
                  {analysis.process !== "general" && (
                    <Badge variant="neutral" className="animate-fade-in animation-delay-100">
                      {PROCESS_LABELS[analysis.process] || analysis.process}
                    </Badge>
                  )}
                  {analysis.wasTruncated && (
                    <Badge variant="analysis" className="animate-fade-in animation-delay-200">
                      Long document
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--cp-text)] leading-tight">
                  {analysis.title}
                </h1>
                {(analysis.sourceUrl || analysis.sourceFilename) && (
                  <p className="text-sm text-[var(--cp-muted)] flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-60">
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {analysis.sourceUrl ? (
                      <a href={analysis.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                        {new URL(analysis.sourceUrl).hostname}
                      </a>
                    ) : analysis.sourceFilename}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link href="/un/history">
                  <Button variant="ghost" size="sm" className="text-[var(--cp-muted)]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-1.5">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    History
                  </Button>
                </Link>
                <Link href="/un">
                  <Button variant="secondary" size="sm">
                    + New
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Reading Level Selector - Redesigned */}
          <Card variant="subtle" className="!py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-accent">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--cp-text)]">Reading Level</div>
                  <div className="text-xs text-[var(--cp-muted)]">
                    {level === "5" && "Simple language for ages 10-12"}
                    {level === "8" && "Standard high school level"}
                    {level === "12" && "Detailed college+ analysis"}
                  </div>
                </div>
              </div>
              <SegmentedControl
                value={level}
                onChange={(v) => setLevel(v as ReadingLevel)}
                ariaLabel="Reading level"
                options={[
                  { value: "5", label: "Simple" },
                  { value: "8", label: "Standard" },
                  { value: "12", label: "Detailed" },
                ]}
              />
            </div>
          </Card>

          {/* Content Sections */}
          <div className="space-y-4">
            {/* TL;DR Summary */}
            <CollapsibleSection
              title="Summary"
              icon={<SummaryIcon />}
              expanded={expandedSections.has("tldr")}
              onToggle={() => toggleSection("tldr")}
              accent
            >
              <div className="prose prose-sm max-w-none text-[var(--cp-text)] leading-relaxed">
                {currentLevel.tldr.split("\n\n").map((para, i) => (
                  <p key={i} className="mb-3 last:mb-0">{para}</p>
                ))}
              </div>
            </CollapsibleSection>

            {/* Key Objectives */}
            <CollapsibleSection
              title="Key Objectives"
              icon={<ObjectivesIcon />}
              expanded={expandedSections.has("objectives")}
              onToggle={() => toggleSection("objectives")}
            >
              {currentLevel.keyObjectives.length > 0 ? (
                <ul className="space-y-2.5">
                  {currentLevel.keyObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[var(--cp-text)]">
                      <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 text-xs font-medium mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{obj}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--cp-muted)] italic">No specific objectives identified.</p>
              )}
            </CollapsibleSection>

            {/* Who's Affected */}
            <CollapsibleSection
              title="Who's Affected"
              icon={<AffectedIcon />}
              expanded={expandedSections.has("affected")}
              onToggle={() => toggleSection("affected")}
            >
              <p className="text-sm text-[var(--cp-text)] leading-relaxed">
                {currentLevel.whoAffected || "Information not available."}
              </p>
            </CollapsibleSection>

            {/* Decisions & Commitments */}
            <CollapsibleSection
              title="Decisions & Commitments"
              icon={<DecisionsIcon />}
              expanded={expandedSections.has("decisions")}
              onToggle={() => toggleSection("decisions")}
            >
              <p className="text-sm text-[var(--cp-text)] leading-relaxed">
                {currentLevel.decisions || "No specific decisions identified."}
              </p>
            </CollapsibleSection>

            {/* Pros & Cons - Two Column */}
            <CollapsibleSection
              title="Stakeholder Perspectives"
              icon={<PerspectivesIcon />}
              expanded={expandedSections.has("proscons")}
              onToggle={() => toggleSection("proscons")}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4">
                  <h4 className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2 mb-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Potential Benefits
                  </h4>
                  {currentLevel.pros.length > 0 ? (
                    <ul className="space-y-2">
                      {currentLevel.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--cp-text)]">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[var(--cp-muted)] italic">None identified.</p>
                  )}
                </div>
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
                  <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Potential Concerns
                  </h4>
                  {currentLevel.cons.length > 0 ? (
                    <ul className="space-y-2">
                      {currentLevel.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--cp-text)]">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[var(--cp-muted)] italic">None identified.</p>
                  )}
                </div>
              </div>
            </CollapsibleSection>

            {/* Youth Relevance - Highlighted */}
            <CollapsibleSection
              title="Youth Relevance"
              icon={<YouthIcon />}
              expanded={expandedSections.has("youth")}
              onToggle={() => toggleSection("youth")}
              highlight
            >
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    General Impact
                  </h4>
                  <p className="text-sm text-[var(--cp-text)] leading-relaxed pl-3.5">{analysis.youthRelevance.general}</p>
                </div>
                {analysis.youthRelevance.globalSouth && (
                  <div>
                    <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      Global South Youth
                    </h4>
                    <p className="text-sm text-[var(--cp-text)] leading-relaxed pl-3.5">{analysis.youthRelevance.globalSouth}</p>
                  </div>
                )}
                {analysis.youthRelevance.participation && (
                  <div>
                    <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      Participation & Representation
                    </h4>
                    <p className="text-sm text-[var(--cp-text)] leading-relaxed pl-3.5">{analysis.youthRelevance.participation}</p>
                  </div>
                )}
                {analysis.youthRelevance.relevantAreas.length > 0 && (
                  <div className="pt-2">
                    <div className="flex flex-wrap gap-2">
                      {analysis.youthRelevance.relevantAreas.map((area, i) => (
                        <Badge key={i} variant="neutral" className="text-xs">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Glossary */}
            {analysis.glossary.length > 0 && (
              <CollapsibleSection
                title={`Glossary (${analysis.glossary.length} terms)`}
                icon={<GlossaryIcon />}
                expanded={expandedSections.has("glossary")}
                onToggle={() => toggleSection("glossary")}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {analysis.glossary.map((term, i) => (
                    <div key={i} className="rounded-lg bg-[var(--cp-surface-2)]/50 p-3">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-accent">{term.term}</span>
                      </div>
                      <p className="text-sm text-[var(--cp-text)] mb-1">{term.meaning}</p>
                      <p className="text-xs text-[var(--cp-muted)]">{term.simpleExplanation}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* Footer Metadata */}
          <Card variant="subtle" className="!py-3 space-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--cp-muted)]">
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="opacity-60">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {new Date(analysis.analyzedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span>{analysis.documentLength.toLocaleString()} characters</span>
              {analysis.wasTruncated && <span className="text-amber-500">(truncated)</span>}
            </div>
            <p className="text-xs text-[var(--cp-muted)] italic leading-relaxed">
              AI-generated analysis for educational purposes. Not legal advice. Refer to official sources for authoritative information.
            </p>
          </Card>
        </div>
      </div>

      {/* Highlight-to-Explain Tooltip */}
      {selectedText && selectionPosition && (
        <div
          className="explain-tooltip fixed z-[100] transform -translate-x-1/2 animate-tooltip-appear"
          style={{ 
            left: selectionPosition.x, 
            top: selectionPosition.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <button
            onClick={handleExplainThis}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-accent text-white shadow-lg hover:bg-accent/90 transition-all hover:scale-105 text-sm font-medium"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Explain this
          </button>
        </div>
      )}

      {/* Chat Toggle Button - Floating */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-accent px-5 py-3.5 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 group"
        >
          <div className="relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-accent animate-pulse" />
          </div>
          <span className="font-medium text-sm">Ask AI</span>
        </button>
      )}

      {/* Chat Side Panel - Slides in from right */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[var(--cp-bg)] border-l border-[var(--cp-border)] shadow-2xl z-50 flex flex-col transform transition-transform duration-500 ease-out ${
          chatOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--cp-border)] bg-[var(--cp-surface)]/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-accent">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-[var(--cp-text)] text-sm">Document Assistant</div>
              <div className="text-xs text-[var(--cp-muted)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Ready to help
              </div>
            </div>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-[var(--cp-surface-2)] flex items-center justify-center transition-colors"
            aria-label="Close chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[var(--cp-muted)]">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-accent">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-semibold text-[var(--cp-text)] mb-2">Ask about this document</h3>
              <p className="text-sm text-[var(--cp-muted)] mb-6 leading-relaxed">
                Get instant answers about the UN resolution. I can explain complex terms, summarize sections, or answer specific questions.
              </p>
              <div className="space-y-2">
                {[
                  "What are the main requirements?",
                  "How does this affect young people?",
                  "Explain in simpler terms",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendChatMessage(suggestion)}
                    className="block w-full text-left px-4 py-2.5 rounded-xl bg-[var(--cp-surface)] border border-[var(--cp-border)] text-sm text-[var(--cp-text)] hover:border-accent hover:bg-accent/5 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} ${
                msg.isAnimating ? "animate-message-appear" : ""
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-accent text-white rounded-br-md"
                    : "bg-[var(--cp-surface)] border border-[var(--cp-border)] text-[var(--cp-text)] rounded-bl-md"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {chatLoading && (
            <div className="flex justify-start animate-message-appear">
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center mr-2 flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="bg-[var(--cp-surface)] border border-[var(--cp-border)] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-accent/40 rounded-full animate-typing-dot" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-accent/40 rounded-full animate-typing-dot" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-accent/40 rounded-full animate-typing-dot" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-[var(--cp-border)] bg-[var(--cp-surface)]/50 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendChatMessage(chatInput);
            }}
            className="flex gap-2"
          >
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-bg)] px-4 py-3 text-sm text-[var(--cp-text)] placeholder:text-[var(--cp-muted)] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              disabled={chatLoading}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="w-11 h-11 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-all hover:scale-105 disabled:hover:scale-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
          <p className="text-[10px] text-[var(--cp-muted)] text-center mt-2">
            AI responses are based on the document analysis. Always verify with official sources.
          </p>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {chatOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 sm:hidden"
          onClick={() => setChatOpen(false)}
        />
      )}

      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes tooltip-appear {
          from {
            opacity: 0;
            transform: translate(-50%, -80%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%);
          }
        }
        
        @keyframes message-appear {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes typing-dot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-tooltip-appear {
          animation: tooltip-appear 0.2s ease-out forwards;
        }
        
        .animate-message-appear {
          animation: message-appear 0.3s ease-out forwards;
        }
        
        .animate-typing-dot {
          animation: typing-dot 1.4s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .animation-delay-100 {
          animation-delay: 100ms;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
    </div>
  );
}

// Icon Components
function SummaryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ObjectivesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  );
}

function AffectedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function DecisionsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PerspectivesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent">
      <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function YouthIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
    </svg>
  );
}

function GlossaryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent">
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/**
 * Collapsible section component with smooth animations
 */
function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  highlight,
  accent,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  highlight?: boolean;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={`overflow-hidden transition-all duration-300 ${highlight ? "border-accent/30 bg-accent/5" : ""} ${accent ? "border-accent/20" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            expanded ? "bg-accent/15" : "bg-[var(--cp-surface-2)] group-hover:bg-accent/10"
          }`}>
            {icon}
          </div>
          <h3 className="text-base font-semibold text-[var(--cp-text)]">{title}</h3>
        </div>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
          expanded ? "bg-accent/10 rotate-180" : "bg-[var(--cp-surface-2)] group-hover:bg-accent/10"
        }`}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[var(--cp-muted)]"
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </button>
      <div className={`grid transition-all duration-300 ease-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="pt-4 mt-4 border-t border-[var(--cp-border)]">
            {children}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function UNResultsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-2/3 mx-auto rounded bg-[var(--cp-surface-2)]" />
            <div className="h-4 w-1/2 mx-auto rounded bg-[var(--cp-surface-2)]" />
          </div>
        </Card>
      </div>
    }>
      <UNResultsContent />
    </Suspense>
  );
}
