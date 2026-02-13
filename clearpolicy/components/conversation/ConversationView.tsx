"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ExploreAnswerCard } from "./ExploreAnswerCard";
import { SourcesSidebar } from "./SourcesSidebar";
import type { AnswerSection } from "@/lib/policy-types";

type SourceItem = {
  id: string;
  url: string;
  title: string | null;
  domain: string | null;
  sourceType: string | null;
  verified: boolean;
  citationNumber: number | null;
};

type MessageItem = {
  id: string;
  role: "user" | "assistant";
  content: string;
  answerCardData: {
    heading?: string;
    sections?: AnswerSection;
    fullTextSummary?: string;
  } | null;
  sources: SourceItem[];
};

const PERSONAS = [
  "Everyone",
  "Student",
  "Homeowner",
  "Small Business",
  "Renter",
  "Immigrant",
  "Parent",
] as const;

export function ConversationView({
  conversationId,
  policyName,
  policyLevel,
  policyCategory,
  zipCode,
  messages: initialMessages,
}: {
  conversationId: string;
  policyName: string;
  policyLevel: string | null;
  policyCategory: string | null;
  zipCode: string | null;
  messages: MessageItem[];
}) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [followUp, setFollowUp] = useState("");
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState<string>("Everyone");
  const bottomRef = useRef<HTMLDivElement>(null);

  const allSources = messages.flatMap((m) => m.sources);
  const uniqueSources = Array.from(
    new Map(allSources.map((s) => [s.id, s])).values()
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFollowUp(e: React.FormEvent) {
    e.preventDefault();
    const text = followUp.trim();
    if (!text || loading) return;
    setLoading(true);
    setFollowUp("");
    try {
      const res = await fetch(`/api/conversation/${conversationId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, persona }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      const newUserMsg: MessageItem = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        answerCardData: null,
        sources: [],
      };
      const newAssistantMsg: MessageItem = {
        id: data.assistantMessage?.id ?? `assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer?.fullTextSummary ?? "",
        answerCardData: {
          heading: data.answer?.policyName,
          sections: data.answer?.sections,
          fullTextSummary: data.answer?.fullTextSummary,
        },
        sources: (data.answer?.sources ?? []).map((s: AnswerSourceStub, i: number) => ({
          id: `src-${i}`,
          url: s.url,
          title: s.title,
          domain: s.domain,
          sourceType: s.type,
          verified: s.verified ?? false,
          citationNumber: i + 1,
        })),
      };
      setMessages((prev) => [...prev, newUserMsg, newAssistantMsg]);
    } catch (err) {
      console.error(err);
      setFollowUp(text);
    } finally {
      setLoading(false);
    }
  }

  const lastSuggestions = [
    "How does this affect renters?",
    "What are the main criticisms?",
    "Compare to similar policies",
  ];

  return (
    <div className="container page-section">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {/* Topic context bar */}
          <div className="mb-6 rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] px-4 py-3">
            <p className="text-sm text-[var(--text-secondary)]">
              You&apos;re exploring:{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {policyName}
              </span>
              {policyLevel && ` · ${policyLevel}`}
              {policyCategory && ` · ${policyCategory}`}
            </p>
          </div>

          {/* View as pills */}
          <div className="mb-6 flex flex-wrap gap-2">
            {PERSONAS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPersona(p)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/30 ${
                  persona === p
                    ? "bg-[var(--accent-blue)] text-white"
                    : "border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Message list: one card per assistant message */}
          <div className="space-y-8">
            {messages.map((msg, idx) => {
              if (msg.role !== "assistant" || !msg.answerCardData) return null;
              const prevUser = messages[idx - 1]?.role === "user" ? messages[idx - 1].content : undefined;
              const isLast = idx === messages.length - 1;
              return (
                <ExploreAnswerCard
                  key={msg.id}
                  heading={msg.answerCardData.heading ?? policyName}
                  sections={msg.answerCardData.sections ?? {}}
                  sources={msg.sources}
                  followUpSuggestions={isLast ? lastSuggestions : []}
                  onFollowUp={(q) => setFollowUp(q)}
                  userQuery={prevUser}
                />
              );
            })}
          </div>

          {/* Follow-up input */}
          <form onSubmit={handleFollowUp} className="mt-8">
            <div className="flex gap-3">
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                disabled={loading}
                placeholder={`Ask a follow-up about ${policyName}...`}
                className="flex-1 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-4 py-3 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-blue)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20"
              />
              <button
                type="submit"
                disabled={loading || !followUp.trim()}
                className="rounded-xl bg-[var(--accent-blue)] px-6 py-3 font-medium text-white transition-opacity hover:opacity-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/50"
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
          </form>

          <div ref={bottomRef} />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <SourcesSidebar sources={uniqueSources} />
        </div>
      </div>
    </div>
  );
}

type AnswerSourceStub = {
  url: string;
  title?: string;
  domain?: string;
  type?: string;
  verified?: boolean;
};
