"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

interface ConversationItem {
  id: string;
  title: string | null;
  policyName: string;
  updatedAt: string;
  isStarred: boolean;
}

type FilterTab = "all" | "starred";

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (renaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [renaming]);

  useEffect(() => {
    if (!menuOpen) return;
    function close(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu]")) setMenuOpen(null);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  const toggleStar = useCallback(async (id: string, current: boolean) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, isStarred: !current } : c));
    setMenuOpen(null);
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred: !current }),
      });
      if (!res.ok) {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, isStarred: current } : c));
      }
    } catch {
      setConversations(prev => prev.map(c => c.id === id ? { ...c, isStarred: current } : c));
    }
  }, []);

  const startRename = useCallback((c: ConversationItem) => {
    setRenaming(c.id);
    setRenameValue(c.title || c.policyName);
    setMenuOpen(null);
  }, []);

  const submitRename = useCallback(async (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenaming(null); return; }
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: trimmed } : c));
    setRenaming(null);
    try {
      await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
    } catch { /* optimistic — revert would need refetch */ }
  }, [renameValue]);

  const deleteConversation = useCallback(async (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    setDeleteConfirm(null);
    setMenuOpen(null);
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    } catch { /* already removed from UI */ }
  }, []);

  const filtered = conversations.filter(c => {
    if (filter === "starred" && !c.isStarred) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (c.title || c.policyName).toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });

  const groups = groupByDate(filtered);
  const groupOrder = ["Today", "Yesterday", "This week", "Older"];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-[var(--cp-text)] tracking-tight">
          My Research
        </h1>
        <p className="mt-1 text-sm text-[var(--cp-muted)]">
          Your past policy searches and conversations.
        </p>
      </div>

      {/* Search + filter tabs */}
      {!loading && conversations.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cp-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your research..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-[var(--cp-text)] placeholder:text-[var(--cp-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--cp-accent)]/15 transition-all"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "starred"] as FilterTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filter === tab
                    ? "bg-[var(--cp-accent)] text-white"
                    : "text-[var(--cp-muted)] hover:text-[var(--cp-text)] hover:bg-[var(--cp-surface)]"
                }`}
              >
                {tab === "all" ? "All" : "Starred"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-4 animate-pulse">
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
                .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
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
            <svg className="h-7 w-7 text-[var(--cp-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold text-[var(--cp-text)]">No research yet</h2>
          <p className="mt-1 text-sm text-[var(--cp-muted)] max-w-sm mx-auto">
            Search for a policy, bill, or any question to get started. Your searches will appear here.
          </p>
          <Link href="/" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--cp-accent)] px-5 py-2.5 text-sm font-medium text-white hover:brightness-110 transition-all">
            Start searching
          </Link>
        </div>
      )}

      {/* No results for search/filter */}
      {!loading && !error && conversations.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-8 text-center">
          <p className="text-sm text-[var(--cp-muted)]">
            {filter === "starred" ? "No starred conversations." : `No results for "${search}".`}
          </p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card rounded-2xl p-6 max-w-sm mx-4 shadow-elevated" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-base font-semibold text-[var(--cp-text)]">Delete conversation?</h3>
            <p className="mt-2 text-sm text-[var(--cp-muted)]">This action cannot be undone. All messages and sources will be permanently removed.</p>
            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm rounded-lg text-[var(--cp-muted)] hover:bg-[var(--cp-surface)] transition-all">
                Cancel
              </button>
              <button onClick={() => deleteConversation(deleteConfirm)} className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation list */}
      {!loading && !error && filtered.length > 0 && (
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
                    <div key={c.id} className="group relative rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] hover:border-[var(--cp-accent)]/30 hover:bg-[var(--cp-hover)] transition-all">
                      {renaming === c.id ? (
                        <div className="p-4">
                          <form onSubmit={e => { e.preventDefault(); submitRename(c.id); }}>
                            <input
                              ref={renameRef}
                              type="text"
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              onBlur={() => submitRename(c.id)}
                              onKeyDown={e => { if (e.key === "Escape") setRenaming(null); }}
                              className="w-full px-3 py-1.5 rounded-lg glass-input text-sm text-[var(--cp-text)] focus:outline-none focus:ring-2 focus:ring-[var(--cp-accent)]/20"
                            />
                          </form>
                        </div>
                      ) : (
                        <Link href={`/explore/${c.id}`} className="block p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-[15px] font-medium text-[var(--cp-text)] truncate group-hover:text-[var(--cp-accent)] transition-colors">
                                {c.title || c.policyName}
                              </p>
                              {c.title && c.title !== c.policyName && (
                                <p className="mt-0.5 text-xs text-[var(--cp-muted)] truncate">{c.policyName}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {c.isStarred && (
                                <svg className="h-3.5 w-3.5 text-[var(--cp-gold)]" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              )}
                              <span className="text-[11px] text-[var(--cp-tertiary)]">{timeAgo(c.updatedAt)}</span>
                            </div>
                          </div>
                        </Link>
                      )}

                      {/* Three-dot menu */}
                      {renaming !== c.id && (
                        <div className="absolute top-3 right-3" data-menu>
                          <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(menuOpen === c.id ? null : c.id); }}
                            className="p-1.5 rounded-lg text-[var(--cp-tertiary)] opacity-0 group-hover:opacity-100 hover:bg-[var(--cp-surface-2)] hover:text-[var(--cp-text)] transition-all"
                            aria-label="Actions"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                            </svg>
                          </button>
                          {menuOpen === c.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 rounded-xl glass-card border border-[var(--cp-border)] shadow-elevated py-1 z-50">
                              <button
                                onClick={e => { e.preventDefault(); e.stopPropagation(); toggleStar(c.id, c.isStarred); }}
                                className="w-full text-left px-3 py-2 text-sm text-[var(--cp-text)] hover:bg-[var(--cp-hover)] transition-colors flex items-center gap-2"
                              >
                                <svg className="w-3.5 h-3.5" fill={c.isStarred ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                {c.isStarred ? "Unstar" : "Star"}
                              </button>
                              <button
                                onClick={e => { e.preventDefault(); e.stopPropagation(); startRename(c); }}
                                className="w-full text-left px-3 py-2 text-sm text-[var(--cp-text)] hover:bg-[var(--cp-hover)] transition-colors flex items-center gap-2"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Rename
                              </button>
                              <div className="my-1 border-t border-[var(--cp-border)]" />
                              <button
                                onClick={e => { e.preventDefault(); e.stopPropagation(); setDeleteConfirm(c.id); setMenuOpen(null); }}
                                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
