"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Badge } from "@/components/ui";

/**
 * UN Document Analysis History Page
 * 
 * Modern UI with smooth animations and improved visual hierarchy.
 * Shows a list of previously analyzed UN/international documents.
 * 
 * @module app/un/history/page
 */

interface HistoryItem {
  id: string;
  documentHash: string;
  sourceType: string;
  sourceReference: string | null;
  title: string | null;
  documentLength: number;
  createdAt: string;
}

export default function UNHistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/un/history?limit=${limit}&offset=${offset}`);
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to load history");
        }
        setItems(data.items);
        setTotal(data.total);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load history";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [offset]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "url": return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-500">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
      case "pdf": return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-500">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
      case "text": return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-500">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
      default: return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--cp-muted)]">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
  };

  const truncate = (str: string | null, len: number) => {
    if (!str) return "Untitled Document";
    return str.length > len ? str.slice(0, len) + "..." : str;
  };

  const formatSize = (chars: number) => {
    if (chars < 1000) return `${chars} chars`;
    if (chars < 10000) return `${(chars / 1000).toFixed(1)}k chars`;
    return `${Math.round(chars / 1000)}k chars`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--cp-text)]">Analysis History</h1>
              <p className="text-sm text-[var(--cp-muted)]">
                {loading ? "Loading..." : total > 0 ? `${total} document${total === 1 ? "" : "s"} analyzed` : "No documents yet"}
              </p>
            </div>
          </div>
          <Link href="/un">
            <Button variant="primary" size="sm" className="gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Analyze New
            </Button>
          </Link>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--cp-surface-2)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 rounded bg-[var(--cp-surface-2)]" />
                  <div className="h-3 w-1/2 rounded bg-[var(--cp-surface-2)]" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-red-500">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--cp-text)] mb-2">Failed to load history</h2>
          <p className="text-sm text-[var(--cp-muted)] mb-4">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => setOffset(0)}>
            Try Again
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-accent">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--cp-text)] mb-2">No documents analyzed yet</h2>
          <p className="text-sm text-[var(--cp-muted)] mb-6 max-w-md mx-auto">
            Analyze a UN resolution, treaty, or policy document to see it here. 
            Your analyses are cached so you can revisit them instantly.
          </p>
          <Link href="/un">
            <Button variant="primary" className="gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Analyze Your First Document
            </Button>
          </Link>
        </Card>
      )}

      {/* History List */}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Link 
              key={item.id} 
              href={`/un/results?hash=${item.documentHash}`}
              className="block group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card className="hover:border-accent/50 hover:shadow-md transition-all duration-200 group-hover:scale-[1.01]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--cp-surface-2)] flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                    {getSourceIcon(item.sourceType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[var(--cp-text)] truncate group-hover:text-accent transition-colors">
                      {truncate(item.title || item.sourceReference, 60)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <Badge variant="neutral" className="text-xs uppercase tracking-wide">
                        {item.sourceType}
                      </Badge>
                      <span className="text-xs text-[var(--cp-muted)]">
                        {formatSize(item.documentLength)}
                      </span>
                      <span className="text-xs text-[var(--cp-muted)]">•</span>
                      <span className="text-xs text-[var(--cp-muted)]">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    {item.sourceReference && item.sourceReference !== item.title && (
                      <p className="text-xs text-[var(--cp-muted)] mt-1.5 truncate opacity-75">
                        {truncate(item.sourceReference, 80)}
                      </p>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-[var(--cp-muted)] group-hover:text-accent transition-colors"
                    >
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > limit && (
        <Card variant="subtle" className="!py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="gap-1.5"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Previous
            </Button>
            <span className="text-sm text-[var(--cp-muted)]">
              {offset + 1}–{Math.min(offset + limit, total)} of {total}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={offset + limit >= total}
              onClick={() => setOffset(offset + limit)}
              className="gap-1.5"
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
