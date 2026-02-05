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
 * Displays the structured analysis of a UN/international document.
 * Features:
 * - Reading level toggle
 * - Collapsible sections
 * - Glossary
 * - Chat side panel for Q&A
 * - Highlight-to-explain functionality
 * 
 * Supports loading from:
 * - sessionStorage (after fresh analysis)
 * - URL hash parameter (for cached/history access)
 * 
 * @module app/un/results/page
 */

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
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
            setDocumentHash(data.documentHash);
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
          setAnalysis(JSON.parse(stored));
          if (storedHash) setDocumentHash(storedHash);
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
  }, [chatMessages]);

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
          x: rect.left + rect.width / 2,
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
        // Small delay to allow button click to register
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

  // Send chat message
  const sendChatMessage = async (message: string, highlightedText?: string) => {
    if (!message.trim() || !documentHash || chatLoading) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);
    
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
        content: data.success ? data.assistant_message : "Sorry, I couldn't process that. Please try again.",
        timestamp: new Date(),
      };
      
      setChatMessages((prev) => [...prev, assistantMessage]);
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
      const message = `Can you explain this highlighted part in simpler terms?\n\n"${selectedText}"`;
      sendChatMessage(message, selectedText);
      setSelectedText(null);
      setSelectionPosition(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-2/3 mx-auto rounded bg-[var(--cp-surface-2)]" />
            <div className="h-4 w-1/2 mx-auto rounded bg-[var(--cp-surface-2)]" />
          </div>
        </Card>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card className="p-8 text-center">
          <p className="text-[var(--cp-muted)]">Loading analysis...</p>
        </Card>
      </div>
    );
  }

  const currentLevel = analysis.levels[level];

  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div 
        className={`flex-1 transition-all duration-300 ${chatOpen ? "lg:mr-[400px]" : ""}`}
        onMouseUp={handleMouseUp}
      >
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
          {/* Header */}
          <Card className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary">{STAGE_LABELS[analysis.stage]}</Badge>
                  {analysis.process !== "general" && (
                    <Badge variant="neutral">{PROCESS_LABELS[analysis.process] || analysis.process}</Badge>
                  )}
                  {analysis.wasTruncated && (
                    <Badge variant="analysis">Summarized (long document)</Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-[var(--cp-text)]">{analysis.title}</h1>
                {(analysis.sourceUrl || analysis.sourceFilename) && (
                  <p className="text-sm text-[var(--cp-muted)]">
                    Source: {analysis.sourceUrl ? (
                      <a href={analysis.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                        {new URL(analysis.sourceUrl).hostname}
                      </a>
                    ) : analysis.sourceFilename}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Link href="/un/history">
                  <Button variant="secondary" size="sm">
                    History
                  </Button>
                </Link>
                <Link href="/un">
                  <Button variant="secondary" size="sm">
                    ← Analyze another
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Reading Level Selector */}
          <Card variant="subtle" className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-[var(--cp-text)]">Reading Level</div>
              <div className="text-xs text-[var(--cp-muted)]">
                {level === "5" && "Very simple • Ages 10-12"}
                {level === "8" && "Standard • High school"}
                {level === "12" && "Detailed • College+"}
              </div>
            </div>
            <SegmentedControl
              value={level}
              onChange={(v) => setLevel(v as ReadingLevel)}
              ariaLabel="Reading level"
              options={[
                { value: "5", label: "5th" },
                { value: "8", label: "8th" },
                { value: "12", label: "12th" },
              ]}
            />
          </Card>

          {/* TL;DR Summary */}
          <CollapsibleSection
            title="TL;DR Summary"
            icon="📝"
            expanded={expandedSections.has("tldr")}
            onToggle={() => toggleSection("tldr")}
          >
            <div className="prose prose-sm max-w-none text-[var(--cp-text)]">
              {currentLevel.tldr.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </CollapsibleSection>

          {/* Key Objectives */}
          <CollapsibleSection
            title="Key Objectives"
            icon="🎯"
            expanded={expandedSections.has("objectives")}
            onToggle={() => toggleSection("objectives")}
          >
            {currentLevel.keyObjectives.length > 0 ? (
              <ul className="space-y-2">
                {currentLevel.keyObjectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--cp-text)]">
                    <span className="text-accent mt-0.5">•</span>
                    <span>{obj}</span>
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
            icon="👥"
            expanded={expandedSections.has("affected")}
            onToggle={() => toggleSection("affected")}
          >
            <p className="text-sm text-[var(--cp-text)]">{currentLevel.whoAffected || "Information not available."}</p>
          </CollapsibleSection>

          {/* Decisions & Commitments */}
          <CollapsibleSection
            title="Decisions & Commitments"
            icon="📋"
            expanded={expandedSections.has("decisions")}
            onToggle={() => toggleSection("decisions")}
          >
            <p className="text-sm text-[var(--cp-text)]">{currentLevel.decisions || "No specific decisions identified."}</p>
          </CollapsibleSection>

          {/* Pros & Cons */}
          <CollapsibleSection
            title="Stakeholder Perspectives"
            icon="⚖️"
            expanded={expandedSections.has("proscons")}
            onToggle={() => toggleSection("proscons")}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                  <span>✓</span> Potential Benefits
                </h4>
                {currentLevel.pros.length > 0 ? (
                  <ul className="space-y-2">
                    {currentLevel.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--cp-text)]">
                        <span className="text-green-500">•</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--cp-muted)] italic">None identified.</p>
                )}
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <span>!</span> Potential Concerns
                </h4>
                {currentLevel.cons.length > 0 ? (
                  <ul className="space-y-2">
                    {currentLevel.cons.map((con, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--cp-text)]">
                        <span className="text-amber-500">•</span>
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

          {/* Youth Relevance */}
          <CollapsibleSection
            title="Youth Relevance"
            icon="🌍"
            expanded={expandedSections.has("youth")}
            onToggle={() => toggleSection("youth")}
            highlight
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2">General Impact on Youth</h4>
                <p className="text-sm text-[var(--cp-text)]">{analysis.youthRelevance.general}</p>
              </div>
              {analysis.youthRelevance.globalSouth && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2">Global South Youth</h4>
                  <p className="text-sm text-[var(--cp-text)]">{analysis.youthRelevance.globalSouth}</p>
                </div>
              )}
              {analysis.youthRelevance.participation && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2">Youth Participation</h4>
                  <p className="text-sm text-[var(--cp-text)]">{analysis.youthRelevance.participation}</p>
                </div>
              )}
              {analysis.youthRelevance.relevantAreas.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2">Relevant Topic Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.youthRelevance.relevantAreas.map((area, i) => (
                      <Badge key={i} variant="neutral">{area}</Badge>
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
              icon="📖"
              expanded={expandedSections.has("glossary")}
              onToggle={() => toggleSection("glossary")}
            >
              <div className="space-y-4">
                {analysis.glossary.map((term, i) => (
                  <div key={i} className="border-b border-[var(--cp-border)] pb-3 last:border-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-sm font-bold text-accent">{term.term}</span>
                      <span className="text-sm text-[var(--cp-text)]">— {term.meaning}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--cp-muted)]">{term.simpleExplanation}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Metadata */}
          <Card variant="subtle" className="space-y-2 text-xs text-[var(--cp-muted)]">
            <div className="flex flex-wrap gap-4">
              <span>Analyzed: {new Date(analysis.analyzedAt).toLocaleString()}</span>
              <span>Document length: {analysis.documentLength.toLocaleString()} characters</span>
              {analysis.wasTruncated && <span>(truncated for processing)</span>}
            </div>
            <p className="italic">
              This analysis is AI-generated and intended for educational purposes. 
              It does not constitute legal advice. Always refer to official sources for authoritative information.
            </p>
          </Card>
        </div>
      </div>

      {/* Highlight-to-Explain Tooltip */}
      {selectedText && selectionPosition && (
        <div
          className="explain-tooltip fixed z-50 transform -translate-x-1/2 -translate-y-full"
          style={{ left: selectionPosition.x, top: selectionPosition.y }}
        >
          <Button
            variant="primary"
            size="sm"
            onClick={handleExplainThis}
            className="shadow-lg whitespace-nowrap"
          >
            💡 Explain this
          </Button>
        </div>
      )}

      {/* Chat Toggle Button (when closed) */}
      {!chatOpen && documentHash && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-white shadow-lg hover:bg-accent/90 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          <span className="font-medium">Ask about this document</span>
        </button>
      )}

      {/* Chat Side Panel */}
      {chatOpen && (
        <div className="fixed right-0 top-0 h-full w-full lg:w-[400px] bg-[var(--cp-bg)] border-l border-[var(--cp-border)] shadow-xl z-50 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--cp-border)]">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              <span className="font-medium text-[var(--cp-text)]">Ask about this document</span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-2 rounded-lg hover:bg-[var(--cp-surface)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--cp-muted)]">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-[var(--cp-muted)] py-8">
                <div className="text-3xl mb-3">💬</div>
                <p className="text-sm">Ask questions about this document.</p>
                <p className="text-xs mt-2">
                  Tip: Highlight text and click &ldquo;Explain this&rdquo; for quick explanations!
                </p>
              </div>
            )}
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-accent text-white rounded-br-sm"
                      : "bg-[var(--cp-surface)] text-[var(--cp-text)] rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--cp-surface)] rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[var(--cp-muted)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-[var(--cp-muted)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-[var(--cp-muted)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-[var(--cp-border)]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendChatMessage(chatInput);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a question about this document..."
                className="flex-1 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] px-4 py-2 text-[var(--cp-text)] placeholder:text-[var(--cp-muted)] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                disabled={chatLoading}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!chatInput.trim() || chatLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Collapsible section component
 */
function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  highlight,
  children,
}: {
  title: string;
  icon: string;
  expanded: boolean;
  onToggle: () => void;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={highlight ? "border-accent/30 bg-accent/5" : ""}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <h3 className="text-lg font-semibold text-[var(--cp-text)]">{title}</h3>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className={`text-[var(--cp-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {expanded && <div className="mt-4 pt-4 border-t border-[var(--cp-border)]">{children}</div>}
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
