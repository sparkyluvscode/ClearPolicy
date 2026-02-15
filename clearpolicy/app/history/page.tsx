"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ConversationItem {
  id: string;
  title: string | null;
  policyName: string;
  updatedAt: string;
  isStarred: boolean;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function groupByDate(items: ConversationItem[]): Record<string, ConversationItem[]> {
  const groups: Record<string, ConversationItem[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  for (const item of items) {
    const d = new Date(item.updatedAt);
    let label: string;
    if (d >= today) label = "Today";
    else if (d >= yesterday) label = "Yesterday";
    else if (d >= weekAgo) label = "This week";
    else label = "Older";
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }
  return groups;
}

export default function HistoryPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load history");
        }
        const data = await res.json();
        setConversations(data.conversations || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const groups = groupByDate(conversations);
  const groupOrder = ["Today", "Yesterday", "This week", "Older"];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-[var(--cp-text)] tracking-tight">
          My Research
        </h1>
        <p className="mt-1 text-sm text-[var(--cp-muted)]">
          Your past policy searches and conversations.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-4 animate-pulse"
            >
              <div className="h-4 w-2/3 rounded bg-[var(--cp-surface-2)]" />
              <div className="mt-2 h-3 w-1/4 rounded bg-[var(--cp-surface-2)]" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30 p-6 text-center">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetch("/api/conversations")
                .then((r) => r.json())
                .then((d) => setConversations(d.conversations || []))
                .catch((e) =>
                  setError(e instanceof Error ? e.message : "Failed")
                )
                .finally(() => setLoading(false));
            }}
            className="mt-3 text-sm font-medium text-[var(--cp-accent)] hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && conversations.length === 0 && (
        <div className="rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--cp-accent)]/10">
            <svg
              className="h-7 w-7 text-[var(--cp-accent)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold text-[var(--cp-text)]">
            No research yet
          </h2>
          <p className="mt-1 text-sm text-[var(--cp-muted)] max-w-sm mx-auto">
            Search for a policy, bill, or any question to get started. Your searches will appear here.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--cp-accent)] px-5 py-2.5 text-sm font-medium text-white hover:brightness-110 transition-all"
          >
            Start searching
          </Link>
        </div>
      )}

      {/* Conversation list grouped by date */}
      {!loading && !error && conversations.length > 0 && (
        <div className="space-y-8">
          {groupOrder.map((label) => {
            const items = groups[label];
            if (!items?.length) return null;
            return (
              <div key={label}>
                <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--cp-muted)] mb-3">
                  {label}
                </h2>
                <div className="space-y-2">
                  {items.map((c) => (
                    <Link
                      key={c.id}
                      href={`/explore/${c.id}`}
                      className="group block rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-4 hover:border-[var(--cp-accent)]/30 hover:bg-[var(--cp-hover)] transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-medium text-[var(--cp-text)] truncate group-hover:text-[var(--cp-accent)] transition-colors">
                            {c.title || c.policyName}
                          </p>
                          {c.title && c.title !== c.policyName && (
                            <p className="mt-0.5 text-xs text-[var(--cp-muted)] truncate">
                              {c.policyName}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {c.isStarred && (
                            <svg
                              className="h-3.5 w-3.5 text-[var(--cp-gold)]"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          )}
                          <span className="text-[11px] text-[var(--cp-tertiary)]">
                            {timeAgo(c.updatedAt)}
                          </span>
                          <svg
                            className="h-4 w-4 text-[var(--cp-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
