"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthGate } from "@/components/AuthGateProvider";

export const dynamic = "force-dynamic";

/* ── Free search limiter ── */
const FREE_SEARCH_LIMIT = 2;
const STORAGE_KEY = "cp-free-searches";

function getFreeSearchCount(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function incrementFreeSearchCount(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(getFreeSearchCount() + 1));
  } catch {}
}

const EXAMPLE_QUERIES = [
  "How does the SECURE Act affect retirement savings?",
  "What's on my ballot in 95746?",
  "Explain California's AB 1482 rent control law",
  "Latest federal crypto regulation updates",
  "How does Prop 36 change sentencing in California?",
  "What are local zoning laws in Sacramento?",
];

function getGreeting(name: string): string {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Time-based greetings
  const greetings: string[] = [];
  if (hour < 12) greetings.push(`Good morning, ${name}`);
  else if (hour < 17) greetings.push(`Good afternoon, ${name}`);
  else greetings.push(`Good evening, ${name}`);

  // Day-based
  greetings.push(`Happy ${dayNames[day]}, ${name}`);

  // Fun casual ones
  greetings.push(`Hey ${name}`, `Hi ${name}`, `Welcome back, ${name}`);

  // Pick deterministically based on the day of the year so it changes daily but is stable within the day
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return greetings[dayOfYear % greetings.length];
}

const TOPICS = [
  "Healthcare", "Immigration", "Housing", "Education",
  "Climate", "Economy", "Criminal Justice", "Technology",
];

interface ClarifyQuestion { question: string; options: string[]; }

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, firstName, openSignUp } = useAuthGate();
  const [query, setQuery] = useState("");
  const [zip, setZip] = useState("");
  const [debateMode, setDebateMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; text: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [clarifying, setClarifying] = useState(false);
  const [clarifyQuestions, setClarifyQuestions] = useState<ClarifyQuestion[]>([]);
  const [clarifyAnswers, setClarifyAnswers] = useState<Record<number, string>>({});
  const [originalQuery, setOriginalQuery] = useState("");
  const [showFreeGate, setShowFreeGate] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState(FREE_SEARCH_LIMIT);

  useEffect(() => {
    inputRef.current?.focus();
    if (!isSignedIn) setFreeRemaining(Math.max(0, FREE_SEARCH_LIMIT - getFreeSearchCount()));
  }, [isSignedIn]);
  useEffect(() => {
    const q = searchParams?.get("q");
    if (q) { setQuery(q); handleSubmit(q); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null); setUploading(true);
    const allowed = [".pdf", ".txt", ".md", ".csv", ".docx"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowed.some(a => ext.endsWith(a))) { setUploadError(`Unsupported format (${ext}).`); setUploading(false); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError("File too large (max 10MB)."); setUploading(false); return; }
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");
      setUploadedFile({ name: data.filename, text: data.text });
    } catch (err) { setUploadError(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }, [handleFile]);
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }, [handleFile]);

  async function handleSubmit(q?: string) {
    // Gate: allow FREE_SEARCH_LIMIT free searches, then require sign-up
    if (!isSignedIn) {
      if (getFreeSearchCount() >= FREE_SEARCH_LIMIT) {
        setShowFreeGate(true);
        return;
      }
      incrementFreeSearchCount();
      setFreeRemaining(Math.max(0, FREE_SEARCH_LIMIT - getFreeSearchCount()));
    }

    const raw = (q || query).trim();
    // If a file is uploaded, build an internal query the user never sees
    if (uploadedFile) {
      const internalQuery = raw || `Summarize and analyze: ${uploadedFile.name}`;
      navigateToSearch(internalQuery);
      return;
    }
    if (!raw) return;
    setLoading(true);
    try {
      const res = await fetch("/api/clarify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: raw }) });
      const data = await res.json();
      if (data.needsClarification && data.questions?.length > 0) {
        setOriginalQuery(raw); setClarifyQuestions(data.questions); setClarifyAnswers({}); setClarifying(true); setLoading(false); return;
      }
      navigateToSearch(data.refinedQuery || raw);
    } catch { navigateToSearch(raw); }
  }

  function handleClarifySubmit() {
    const parts = Object.values(clarifyAnswers).filter(Boolean);
    const refined = parts.length > 0 ? `${originalQuery} (${parts.join(", ")})` : originalQuery;
    setClarifying(false); navigateToSearch(refined);
  }

  function navigateToSearch(q: string) {
    setLoading(true);
    const p = new URLSearchParams({ q });
    if (zip) p.set("zip", zip);
    if (debateMode) p.set("debate", "1");
    if (uploadedFile) {
      try { sessionStorage.setItem("cp-doc-text", uploadedFile.text); } catch {}
      try { sessionStorage.setItem("cp-doc-name", uploadedFile.name); } catch {}
      p.set("doc", "1");
    }
    router.push(`/search?${p.toString()}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  }

  /* ── Clarification ── */
  if (clarifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 animate-fade-in">
        <div className="w-full max-w-lg mx-auto">
          <div className="glass-card rounded-2xl p-6 md:p-8 animate-fade-up" style={{ borderLeft: "3px solid var(--cp-accent)" }}>
            <div className="mb-6">
              <h2 className="font-heading text-xl font-bold text-[var(--cp-text)]">Let me clarify</h2>
              <p className="text-sm text-[var(--cp-muted)] mt-1">To give you the best results for &ldquo;{originalQuery}&rdquo;</p>
            </div>
            <div className="space-y-5">
              {clarifyQuestions.map((cq, qi) => (
                <div key={qi} className="animate-fade-up" style={{ animationDelay: `${qi * 100}ms` }}>
                  <p className="text-[15px] font-medium text-[var(--cp-text)] mb-2.5">{cq.question}</p>
                  <div className="flex flex-wrap gap-2">
                    {cq.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setClarifyAnswers(prev => ({ ...prev, [qi]: opt }))}
                        className={`text-sm px-4 py-2 rounded-xl border transition-all active:scale-[0.97] ${
                          clarifyAnswers[qi] === opt
                            ? "border-[var(--cp-accent)]/30 bg-[var(--cp-accent-soft)] text-[var(--cp-accent)] font-medium"
                            : "border-[var(--cp-border)] text-[var(--cp-muted)] hover:border-[var(--cp-accent)]/20 hover:text-[var(--cp-text)]"
                        }`}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-8">
              <button onClick={handleClarifySubmit} className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl">
                Search
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
              <button onClick={() => { setClarifying(false); navigateToSearch(originalQuery); }} className="btn-secondary px-5 py-3 text-sm rounded-xl">Skip</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Free search gate — shown when free searches are exhausted ── */
  if (showFreeGate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 animate-fade-in">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="glass-card rounded-2xl p-8 md:p-10 animate-fade-up">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--cp-accent)]/10">
              <svg className="h-7 w-7 text-[var(--cp-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-bold text-[var(--cp-text)] mb-2">
              Create a free account to continue
            </h2>
            <p className="text-sm text-[var(--cp-muted)] leading-relaxed mb-8 max-w-sm mx-auto">
              You&apos;ve used your {FREE_SEARCH_LIMIT} free searches. Sign up to get unlimited access to policy research, saved history, and more.
            </p>
            <button
              onClick={() => openSignUp()}
              className="w-full bg-[var(--cp-accent)] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all mb-3"
            >
              Get Started — it&apos;s free
            </button>
            <button
              onClick={() => setShowFreeGate(false)}
              className="text-xs text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading — fade everything out, show a simple centered indicator ── */
  if (loading) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--cp-bg)] animate-fade-in">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-6 h-6 border-2 border-[var(--cp-accent)]/30 border-t-[var(--cp-accent)] rounded-full animate-spin" />
          <div>
            <p className="text-sm text-[var(--cp-muted)]">Building your policy brief</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 animate-fade-in">

      {/* Hero — personalized when signed in, marketing when signed out */}
      {isSignedIn && firstName ? (
        <div className="text-center mb-10 max-w-3xl mx-auto animate-fade-up" style={{ paddingTop: "5rem" }}>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[var(--cp-text)] tracking-tight mb-3 leading-[1.15]">
            {getGreeting(firstName)}
          </h1>
          <p className="text-lg text-[var(--cp-muted)] max-w-md mx-auto leading-relaxed">
            What policy would you like to explore today?
          </p>
        </div>
      ) : (
        <div className="text-center mb-10 max-w-3xl mx-auto animate-fade-up" style={{ paddingTop: "5rem" }}>
          <h1 className="font-heading text-5xl sm:text-[64px] font-extrabold text-[var(--cp-text)] tracking-tight mb-5 leading-[1.1]">
            Policy research that
            <br />
            <span className="text-[var(--cp-accent)]">actually explains things</span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--cp-muted)] max-w-xl mx-auto leading-relaxed">
            Ask about any law or bill and get plain-English answers with sources — plus what it means for your ZIP code.
          </p>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--cp-tertiary)]">
            Non-partisan &middot; Every claim cited &middot; Used by students, journalists, and voters
          </p>
        </div>
      )}

      {/* Search Box — liquid glass */}
      <div className="w-full max-w-2xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div
          className={`glass-card rounded-2xl overflow-hidden transition-all focus-within:shadow-[0_0_0_2px_var(--cp-accent)/12,var(--cp-shadow-card)] relative ${
            isDragging ? "ring-2 ring-[var(--cp-accent)] ring-offset-2 ring-offset-[var(--cp-bg)] scale-[1.01]" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--cp-accent)]/5 backdrop-blur-[2px] rounded-2xl pointer-events-none">
              <span className="text-sm font-medium text-[var(--cp-accent)]">Drop to analyze</span>
            </div>
          )}
          {uploadedFile && (
            <div className="flex items-center gap-2 mx-5 mt-4 p-2.5 rounded-xl bg-[var(--cp-accent-soft)] border border-[var(--cp-accent)]/12">
              <svg className="w-3.5 h-3.5 text-[var(--cp-accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="text-xs font-medium text-[var(--cp-accent)] truncate flex-1">{uploadedFile.name}</span>
              <button onClick={() => setUploadedFile(null)} className="p-0.5 rounded hover:bg-[var(--cp-accent)]/10 transition-colors">
                <svg className="w-3 h-3 text-[var(--cp-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          {uploading && (
            <div className="flex items-center gap-2 mx-5 mt-4 p-2.5 rounded-xl bg-[var(--cp-surface-2)]">
              <div className="w-3.5 h-3.5 border-2 border-[var(--cp-accent)]/30 border-t-[var(--cp-accent)] rounded-full animate-spin" />
              <span className="text-xs text-[var(--cp-muted)]">Processing file...</span>
            </div>
          )}
          {uploadError && (
            <div className="flex items-center gap-2 mx-5 mt-4 p-2.5 rounded-xl bg-red-50/60 dark:bg-red-900/10 border border-red-200/30 dark:border-red-800/20">
              <span className="text-xs text-red-600 dark:text-red-400">{uploadError}</span>
              <button onClick={() => setUploadError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={uploadedFile ? `Ask a question about ${uploadedFile.name}, or press Search to analyze...` : "Ask anything about policy, law, or government..."}
            rows={uploadedFile ? 2 : 3}
            className="w-full resize-none bg-transparent px-5 pt-5 pb-2 text-[var(--cp-text)] text-base placeholder:text-[var(--cp-tertiary)]/60 focus:outline-none"
          />

          <div className="flex items-center justify-between px-4 pb-3.5 pt-1">
            <div className="flex items-center gap-3">
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--cp-border)] text-[var(--cp-muted)] hover:border-[var(--cp-accent)]/20 hover:text-[var(--cp-text)] transition-all" title="Upload document">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                Attach
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.csv,.docx" onChange={handleFileInput} className="hidden" />

              <div className="flex items-center gap-1.5 text-sm">
                <svg className="w-3.5 h-3.5 text-[var(--cp-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <input type="text" value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="ZIP" className="w-14 bg-transparent text-xs text-[var(--cp-text)] placeholder:text-[var(--cp-muted)] focus:outline-none border-b border-[var(--cp-border)] focus:border-[var(--cp-accent)]/40 transition-colors pb-0.5" maxLength={5} />
              </div>

              <button onClick={() => setDebateMode(!debateMode)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${debateMode ? "bg-[var(--cp-accent-soft)] border-[var(--cp-accent)]/25 text-[var(--cp-accent)]" : "border-[var(--cp-border)] text-[var(--cp-muted)] hover:border-[var(--cp-accent)]/20"}`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Debate
              </button>
            </div>
            <button onClick={() => handleSubmit()} disabled={(!query.trim() && !uploadedFile) || loading || uploading} className="flex items-center gap-2 bg-[var(--cp-accent)] text-white px-5 py-2 rounded-xl text-sm font-medium hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              Search
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-[var(--cp-tertiary)]/60 mt-2">
          {!isSignedIn && freeRemaining > 0 && freeRemaining < FREE_SEARCH_LIMIT ? (
            <span>
              {freeRemaining} free {freeRemaining === 1 ? "search" : "searches"} remaining &middot;{" "}
              <button onClick={() => openSignUp()} className="underline hover:text-[var(--cp-text)] transition-colors">
                Sign up for unlimited
              </button>
            </span>
          ) : (
            <>Drop any PDF or document to analyze &middot; Powered by Omni-Search</>
          )}
        </p>
      </div>

      {/* Example queries — no emojis, simple text chips */}
      <div className="w-full max-w-2xl mx-auto mb-12 animate-fade-up" style={{ animationDelay: "200ms" }}>
        <p className="section-label text-center mb-3">Try asking</p>
        <div className="flex flex-wrap justify-center gap-2 stagger">
          {EXAMPLE_QUERIES.map((label) => (
            <button
              key={label}
              onClick={() => { setQuery(label); handleSubmit(label); }}
              className="text-xs px-3.5 py-2 rounded-xl border border-[var(--cp-border)] text-[var(--cp-muted)] hover:text-[var(--cp-text)] hover:border-[var(--cp-accent)]/20 hover:bg-[var(--cp-surface)] active:scale-[0.97] transition-all animate-fade-up"
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Topics — clean text, no emojis */}
      <div className="w-full max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "300ms" }}>
        <p className="section-label text-center mb-3">Or explore a topic</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 stagger">
          {TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => { const q = `What are the latest federal and state policies on ${topic.toLowerCase()}?`; setQuery(q); handleSubmit(q); }}
              className="flex items-center justify-center p-3 rounded-xl border border-[var(--cp-border)] text-sm font-medium text-[var(--cp-text)] hover:border-[var(--cp-accent)]/20 hover:bg-[var(--cp-accent-soft)] active:scale-[0.97] transition-all animate-fade-up"
            >{topic}</button>
          ))}
        </div>
      </div>

      {/* Trust line — minimal */}
      <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-xs text-[var(--cp-muted)] animate-fade-up pb-16" style={{ animationDelay: "400ms" }}>
        <span className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-[var(--cp-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          Every claim cited
        </span>
        <span className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-[var(--cp-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
          Non-partisan
        </span>
        <span className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-[var(--cp-coral)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
          Local context
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--cp-accent)]/30 border-t-[var(--cp-accent)] rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
