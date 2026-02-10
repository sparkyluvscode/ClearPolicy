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
 * Modern, polished UI with:
 * - Smooth animations and transitions
 * - Working chat panel with typing indicators
 * - Highlight-to-explain functionality
 * - Responsive design that doesn't overlap
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
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Chat state - open by default so users can ask questions immediately
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  
  // Highlight state
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);

  // Load analysis from hash or sessionStorage
  useEffect(() => {
    async function loadAnalysis() {
      setLoading(true);
      setLoadError(null);
      
      const hashParam = searchParams.get("hash");
      
      // Try URL hash parameter first
      if (hashParam && hashParam.length === 64) {
        try {
          console.log("[Results] Loading from hash:", hashParam.slice(0, 12) + "...");
          const res = await fetch(`/api/un/history?hash=${hashParam}`);
          const data = await res.json();
          
          if (data.success && data.analysis) {
            setAnalysis(data.analysis);
            setDocumentHash(data.documentHash || hashParam);
            console.log("[Results] Loaded from API, hash:", (data.documentHash || hashParam).slice(0, 12) + "...");
            setLoading(false);
            return;
          } else {
            console.warn("[Results] API returned no analysis:", data.error);
          }
        } catch (e) {
          console.error("[Results] Failed to load from hash:", e);
        }
      }
      
      // Fall back to sessionStorage
      try {
        const stored = sessionStorage.getItem("un_analysis");
        const storedHash = sessionStorage.getItem("un_document_hash");
        
        if (stored) {
          const parsed = JSON.parse(stored);
          setAnalysis(parsed);
          if (storedHash) {
            setDocumentHash(storedHash);
            console.log("[Results] Loaded from sessionStorage, hash:", storedHash.slice(0, 12) + "...");
          } else {
            console.warn("[Results] No hash in sessionStorage - chat will be disabled");
          }
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("[Results] Failed to parse sessionStorage:", e);
      }
      
      // No analysis found
      setLoadError("No analysis found. Please analyze a document first.");
      setLoading(false);
    }
    
    loadAnalysis();
  }, [searchParams]);

  // Auto-scroll chat and focus input when opened
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (chatOpen && chatInputRef.current) {
      setTimeout(() => chatInputRef.current?.focus(), 300);
    }
  }, [chatOpen]);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    // Don't handle selection if chat is open on mobile
    if (chatOpen && window.innerWidth < 1024) return;
    
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 10 && text.length < 1000) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect) {
        setSelectedText(text);
        setSelectionPosition({
          x: Math.min(rect.left + rect.width / 2, window.innerWidth - 80),
          y: Math.max(rect.top - 10, 60),
        });
      }
    } else {
      setSelectedText(null);
      setSelectionPosition(null);
    }
  }, [chatOpen]);

  // Clear selection on outside click
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

  // Send chat message with proper error handling
  const sendChatMessage = async (message: string, highlightedText?: string) => {
    if (!message.trim()) return;
    
    if (!documentHash) {
      setChatError("Unable to chat - document hash not available. Try reloading the page.");
      return;
    }
    
    if (chatLoading) return;
    
    setChatError(null);
    
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
      console.log("[Chat] Sending to hash:", documentHash.slice(0, 12) + "...");
      
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
      console.log("[Chat] Response:", data.success ? "success" : data.error);
      
      if (data.success && data.assistant_message) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.assistant_message,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error: unknown) {
      console.error("[Chat] Error:", error);
      const rawMsg = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      // Never show raw Prisma/DB errors to users - use a friendly message instead
      const isTechnicalError = /prisma\.|findUnique|findMany|database file|Error code 14|SQLITE/i.test(rawMsg);
      const displayMsg = isTechnicalError
        ? "Database is temporarily unavailable. You can still analyze new documents."
        : rawMsg;
      setChatError(displayMsg);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: displayMsg,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleExplainThis = () => {
    if (selectedText) {
      setChatOpen(true);
      setTimeout(() => {
        const message = `Please explain this in simpler terms:\n\n"${selectedText.slice(0, 500)}${selectedText.length > 500 ? '...' : ''}"`;
        sendChatMessage(message, selectedText);
      }, 100);
      setSelectedText(null);
      setSelectionPosition(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--cp-surface-2)]" />
            <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--cp-text)] mb-2">Loading Analysis</h2>
          <p className="text-sm text-[var(--cp-muted)]">Please wait while we fetch your document...</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (loadError || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="text-lg font-semibold text-[var(--cp-text)] mb-2">No Analysis Found</h2>
          <p className="text-sm text-[var(--cp-muted)] mb-6">{loadError || "Please analyze a document first."}</p>
          <Link href="/un">
            <Button variant="primary">Analyze a Document</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const currentLevel = analysis.levels[level];

  return (
    <div className="min-h-screen">
      {/* Main Content - slides smoothly when chat opens */}
      <div 
        className={`transition-all duration-500 ease-out ${
          chatOpen ? "lg:pr-[420px]" : ""
        }`}
        onMouseUp={handleMouseUp}
      >
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
          {/* Header Card */}
          <Card className="space-y-4 animate-fadeIn">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary" className="animate-slideIn">{STAGE_LABELS[analysis.stage]}</Badge>
                  {analysis.process !== "general" && (
                    <Badge variant="neutral" className="animate-slideIn" style={{ animationDelay: "50ms" }}>
                      {PROCESS_LABELS[analysis.process] || analysis.process}
                    </Badge>
                  )}
                  {analysis.wasTruncated && (
                    <Badge variant="analysis" className="animate-slideIn" style={{ animationDelay: "100ms" }}>
                      Summarized
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-[var(--cp-text)] leading-tight">{analysis.title}</h1>
                {(analysis.sourceUrl || analysis.sourceFilename) && (
                  <p className="text-sm text-[var(--cp-muted)]">
                    Source: {analysis.sourceUrl ? (
                      <a href={analysis.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                        {(() => { try { return new URL(analysis.sourceUrl).hostname; } catch { return analysis.sourceUrl; } })()}
                      </a>
                    ) : analysis.sourceFilename}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link href="/un/history">
                  <Button variant="secondary" size="sm">History</Button>
                </Link>
                <Link href="/un">
                  <Button variant="secondary" size="sm">+ New</Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Reading Level */}
          <Card variant="subtle" className="flex flex-wrap items-center justify-between gap-4 animate-fadeIn" style={{ animationDelay: "100ms" }}>
            <div>
              <div className="text-sm font-medium text-[var(--cp-text)]">Reading Level</div>
              <div className="text-xs text-[var(--cp-muted)]">
                {level === "5" && "Simple • Ages 10-12"}
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

          {/* Content Sections */}
          <div className="space-y-4">
            <CollapsibleSection
              title="TL;DR Summary"
              icon="📝"
              expanded={expandedSections.has("tldr")}
              onToggle={() => toggleSection("tldr")}
              delay={150}
            >
              <div className="prose prose-sm max-w-none text-[var(--cp-text)]">
                {currentLevel.tldr.split("\n\n").map((para, i) => (
                  <p key={i} className="mb-3 last:mb-0">{para}</p>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Key Objectives"
              icon="🎯"
              expanded={expandedSections.has("objectives")}
              onToggle={() => toggleSection("objectives")}
              delay={200}
            >
              {currentLevel.keyObjectives.length > 0 ? (
                <ul className="space-y-2">
                  {currentLevel.keyObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[var(--cp-text)]">
                      <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--cp-muted)] italic">No specific objectives identified.</p>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Who's Affected"
              icon="👥"
              expanded={expandedSections.has("affected")}
              onToggle={() => toggleSection("affected")}
              delay={250}
            >
              <p className="text-sm text-[var(--cp-text)] leading-relaxed">
                {currentLevel.whoAffected || "Information not available."}
              </p>
            </CollapsibleSection>

            <CollapsibleSection
              title="Decisions & Commitments"
              icon="📋"
              expanded={expandedSections.has("decisions")}
              onToggle={() => toggleSection("decisions")}
              delay={300}
            >
              <p className="text-sm text-[var(--cp-text)] leading-relaxed">
                {currentLevel.decisions || "No specific decisions identified."}
              </p>
            </CollapsibleSection>

            <CollapsibleSection
              title="Stakeholder Perspectives"
              icon="⚖️"
              expanded={expandedSections.has("proscons")}
              onToggle={() => toggleSection("proscons")}
              delay={350}
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Potential Benefits
                  </h4>
                  {currentLevel.pros.length > 0 ? (
                    <ul className="space-y-2">
                      {currentLevel.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--cp-text)]">
                          <span className="text-green-500 flex-shrink-0">•</span>
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
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Potential Concerns
                  </h4>
                  {currentLevel.cons.length > 0 ? (
                    <ul className="space-y-2">
                      {currentLevel.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--cp-text)]">
                          <span className="text-amber-500 flex-shrink-0">•</span>
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

            <CollapsibleSection
              title="Youth Relevance"
              icon="🌍"
              expanded={expandedSections.has("youth")}
              onToggle={() => toggleSection("youth")}
              highlight
              delay={400}
            >
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2">General Impact on Youth</h4>
                  <p className="text-sm text-[var(--cp-text)] leading-relaxed">{analysis.youthRelevance.general}</p>
                </div>
                {analysis.youthRelevance.globalSouth && (
                  <div>
                    <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2">Global South Youth</h4>
                    <p className="text-sm text-[var(--cp-text)] leading-relaxed">{analysis.youthRelevance.globalSouth}</p>
                  </div>
                )}
                {analysis.youthRelevance.participation && (
                  <div>
                    <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2">Youth Participation</h4>
                    <p className="text-sm text-[var(--cp-text)] leading-relaxed">{analysis.youthRelevance.participation}</p>
                  </div>
                )}
                {analysis.youthRelevance.relevantAreas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2">Relevant Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.youthRelevance.relevantAreas.map((area, i) => (
                        <Badge key={i} variant="neutral">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {analysis.glossary.length > 0 && (
              <CollapsibleSection
                title={`Glossary (${analysis.glossary.length} terms)`}
                icon="📖"
                expanded={expandedSections.has("glossary")}
                onToggle={() => toggleSection("glossary")}
                delay={450}
              >
                <div className="space-y-3">
                  {analysis.glossary.map((term, i) => (
                    <div key={i} className="border-b border-[var(--cp-border)] pb-3 last:border-0 last:pb-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-accent">{term.term}</span>
                        <span className="text-sm text-[var(--cp-text)]">— {term.meaning}</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--cp-muted)]">{term.simpleExplanation}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* Footer */}
          <Card variant="subtle" className="space-y-2 text-xs text-[var(--cp-muted)] animate-fadeIn" style={{ animationDelay: "500ms" }}>
            <div className="flex flex-wrap gap-4">
              <span>Analyzed: {new Date(analysis.analyzedAt).toLocaleString()}</span>
              <span>{analysis.documentLength.toLocaleString()} characters</span>
              {documentHash && <span className="font-mono">ID: {documentHash.slice(0, 8)}</span>}
            </div>
            <p className="italic">
              AI-generated for educational purposes. Not legal advice. Refer to official sources for authoritative information.
            </p>
          </Card>
        </div>
      </div>

      {/* Highlight-to-Explain Tooltip */}
      {selectedText && selectionPosition && (
        <div
          className="explain-tooltip fixed z-[60] animate-fadeIn"
          style={{ 
            left: selectionPosition.x, 
            top: selectionPosition.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <button
            onClick={handleExplainThis}
            className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-white text-sm font-medium shadow-lg hover:bg-accent/90 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Explain this
          </button>
        </div>
      )}

      {/* Chat FAB (when closed) */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-accent px-5 py-3.5 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 group"
          aria-label="Open chat"
        >
          <div className="relative">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {documentHash && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-accent" />
            )}
          </div>
          <span className="font-medium hidden sm:inline">Ask about this document</span>
          <span className="font-medium sm:hidden">Chat</span>
        </button>
      )}

      {/* Chat Panel - slides in from right */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[var(--cp-bg)] border-l border-[var(--cp-border)] shadow-2xl z-50 flex flex-col transition-transform duration-500 ease-out ${
          chatOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--cp-border)] bg-[var(--cp-surface)]/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-[var(--cp-text)]">Document Assistant</h2>
              <p className="text-xs text-[var(--cp-muted)]">
                {documentHash ? "Ready to help" : "Loading..."}
              </p>
            </div>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            className="w-10 h-10 rounded-full hover:bg-[var(--cp-surface)] flex items-center justify-center transition-colors"
            aria-label="Close chat"
          >
            <svg className="w-5 h-5 text-[var(--cp-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[var(--cp-text)] mb-2">Ask me anything</h3>
              <p className="text-sm text-[var(--cp-muted)] mb-6">
                I can answer questions about this document, explain complex terms, or summarize specific sections.
              </p>
              <div className="space-y-2">
                {["What are the main goals?", "Who does this affect?", "Explain in simpler terms"].map((q) => (
                  <button
                    key={q}
                    onClick={() => sendChatMessage(q)}
                    className="block w-full text-left text-sm px-4 py-2.5 rounded-xl border border-[var(--cp-border)] text-[var(--cp-text)] hover:bg-[var(--cp-surface)] hover:border-accent/50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {chatMessages.map((msg, index) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slideUp`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-accent text-white rounded-br-md"
                    : "bg-[var(--cp-surface)] text-[var(--cp-text)] rounded-bl-md border border-[var(--cp-border)]"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {chatLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-[var(--cp-surface)] rounded-2xl rounded-bl-md px-4 py-3 border border-[var(--cp-border)]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "0ms", animationDuration: "0.6s" }} />
                  <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "150ms", animationDuration: "0.6s" }} />
                  <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "300ms", animationDuration: "0.6s" }} />
                </div>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {chatError && !chatLoading && (
            <div className="text-center py-2">
              <p className="text-xs text-red-500">{chatError}</p>
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
              placeholder={documentHash ? "Ask a question..." : "Loading..."}
              className="flex-1 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-bg)] px-4 py-3 text-sm text-[var(--cp-text)] placeholder:text-[var(--cp-muted)] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all disabled:opacity-50"
              disabled={chatLoading || !documentHash}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading || !documentHash}
              className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              {chatLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
          <p className="text-xs text-[var(--cp-muted)] mt-2 text-center">
            Tip: Highlight text on the page to explain it
          </p>
        </div>
      </div>

      {/* Overlay when chat is open on mobile */}
      {chatOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setChatOpen(false)}
        />
      )}

      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

/**
 * Collapsible section with smooth animation
 */
function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  highlight,
  delay = 0,
  children,
}: {
  title: string;
  icon: string;
  expanded: boolean;
  onToggle: () => void;
  highlight?: boolean;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <Card 
      className={`overflow-hidden transition-colors duration-200 animate-fadeIn ${highlight ? "border-accent/30 bg-accent/5" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left p-0 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <h3 className="text-lg font-semibold text-[var(--cp-text)]">{title}</h3>
        </div>
        <div className={`w-8 h-8 rounded-full bg-[var(--cp-surface-2)] flex items-center justify-center transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}>
          <svg className="w-4 h-4 text-[var(--cp-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div 
        className={`grid transition-all duration-300 ease-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="mt-4 pt-4 border-t border-[var(--cp-border)]">
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--cp-surface-2)]" />
            <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--cp-text)] mb-2">Loading</h2>
          <p className="text-sm text-[var(--cp-muted)]">Please wait...</p>
        </Card>
      </div>
    }>
      <UNResultsContent />
    </Suspense>
  );
}
