"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type DateGroup = "Today" | "Yesterday" | "This week" | "Older";

function groupByDate(items: ConversationItem[]): [DateGroup, ConversationItem[]][] {
  const groups: Record<DateGroup, ConversationItem[]> = {
    Today: [],
    Yesterday: [],
    "This week": [],
    Older: [],
  };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  for (const item of items) {
    const d = new Date(item.updatedAt);
    if (d >= today) groups.Today.push(item);
    else if (d >= yesterday) groups.Yesterday.push(item);
    else if (d >= weekAgo) groups["This week"].push(item);
    else groups.Older.push(item);
  }

  return (Object.entries(groups) as [DateGroup, ConversationItem[]][]).filter(
    ([, items]) => items.length > 0
  );
}

export default function ResearchSidebar({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, pathname]);

  const grouped = groupByDate(conversations);

  return (
    <>
      {/* Toggle button: left edge when closed, right edge of panel when open (avoids overlapping "My Research") */}
      <button
        onClick={onToggle}
        className={`fixed top-20 z-40 p-2 rounded-r-lg bg-[var(--cp-surface)] border border-l-0 border-[var(--cp-border)] text-[var(--cp-muted)] hover:text-[var(--cp-text)] hover:bg-[var(--cp-hover)] transition-all duration-300 shadow-sm ${
          isOpen ? "left-[14rem]" : "left-0"
        }`}
        aria-label={isOpen ? "Close research sidebar" : "Open research sidebar"}
        title="My Research"
      >
        {isOpen ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Sidebar panel */}
      <aside
        className={`fixed left-0 top-16 bottom-0 z-30 flex flex-col bg-[var(--cp-bg)] border-r border-[var(--cp-border)] transition-all duration-300 ease-out ${
          isOpen ? "w-64 opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-full"
        }`}
        style={{ willChange: "width, opacity, transform" }}
      >
        {isOpen && (
          <>
            {/* Header */}
            <div className="flex-shrink-0 px-4 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-[var(--cp-text)] tracking-tight">
                  My Research
                </h2>
                <Link
                  href="/history"
                  className="text-[11px] text-[var(--cp-muted)] hover:text-[var(--cp-accent)] transition-colors"
                >
                  View all
                </Link>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {loading ? (
                <div className="px-2 space-y-3 pt-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1.5" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="h-3.5 w-3/4 rounded bg-[var(--cp-surface-2)] animate-pulse" />
                      <div className="h-2.5 w-1/2 rounded bg-[var(--cp-surface-2)] animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-3 pt-6 text-center">
                  <svg className="w-8 h-8 mx-auto text-[var(--cp-tertiary)] mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-[12px] text-[var(--cp-tertiary)] leading-relaxed">
                    Your research history will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {grouped.map(([label, items]) => (
                    <div key={label}>
                      <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--cp-tertiary)]">
                        {label}
                      </p>
                      <div className="space-y-0.5">
                        {items.map((item) => {
                          const isActive = pathname === `/explore/${item.id}`;
                          return (
                            <Link
                              key={item.id}
                              href={`/explore/${item.id}`}
                              className={`group flex items-start gap-2 px-2.5 py-2 rounded-lg transition-all text-left w-full ${
                                isActive
                                  ? "bg-[var(--cp-accent-soft)] text-[var(--cp-text)]"
                                  : "hover:bg-[var(--cp-hover)] text-[var(--cp-text)]"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className={`text-[13px] leading-snug truncate ${
                                  isActive ? "font-medium" : ""
                                }`}>
                                  {item.title || item.policyName}
                                </p>
                                <p className="text-[10px] text-[var(--cp-tertiary)] mt-0.5 flex items-center gap-1.5">
                                  <span>{timeAgo(item.updatedAt)}</span>
                                  {item.isStarred && (
                                    <svg className="w-2.5 h-2.5 text-[var(--cp-gold)]" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                  )}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New search shortcut */}
            <div className="flex-shrink-0 p-3 border-t border-[var(--cp-border)]">
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-[var(--cp-muted)] hover:text-[var(--cp-text)] hover:bg-[var(--cp-hover)] transition-all w-full"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New search
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
