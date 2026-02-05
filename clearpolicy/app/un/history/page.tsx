"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Badge } from "@/components/ui";

/**
 * UN Document Analysis History Page
 * 
 * Modern, polished UI showing previously analyzed documents.
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
      } catch (err: any) {
        setError(err.message || "Failed to load history");
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
      case "url": return "🔗";
      case "pdf": return "📄";
      case "text": return "📝";
      default: return "📋";
    }
  };

  const getSourceLabel = (type: string) => {
    switch (type) {
      case "url": return "URL";
      case "pdf": return "PDF";
      case "text": return "Text";
      default: return type.toUpperCase();
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
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--cp-text)]">Analysis History</h1>
            <p className="text-sm text-[var(--cp-muted)]">
              {loading ? "Loading..." : total > 0 ? `${total} document${total === 1 ? "" : "s"} analyzed` : "No documents yet"}
            </p>
          </div>
        </div>
        <Link href="/un">
          <Button variant="primary">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Analyze New
          </Button>
        </Link>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--cp-surface-2)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-2/3 rounded bg-[var(--cp-surface-2)]" />
                  <div className="h-4 w-1/3 rounded bg-[var(--cp-surface-2)]" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--cp-text)] mb-2">Failed to Load</h2>
          <p className="text-sm text-[var(--cp-muted)] mb-4">{error}</p>
          <Button variant="secondary" onClick={() => setOffset(0)}>
            Try Again
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--cp-text)] mb-2">No Documents Yet</h2>
          <p className="text-sm text-[var(--cp-muted)] mb-6 max-w-sm mx-auto">
            Analyze your first UN document to see it here. Previously analyzed documents are cached for instant access.
          </p>
          <Link href="/un">
            <Button variant="primary" size="lg">
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
            >
              <Card 
                className="hover:border-accent/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--cp-surface-2)] flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {getSourceIcon(item.sourceType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--cp-text)] truncate group-hover:text-accent transition-colors">
                      {truncate(item.title || item.sourceReference, 60)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <Badge variant="neutral" className="text-xs">
                        {getSourceLabel(item.sourceType)}
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
                      <p className="text-xs text-[var(--cp-muted)] mt-1 truncate opacity-70">
                        {truncate(item.sourceReference, 70)}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--cp-surface-2)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-[var(--cp-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
        <Card variant="subtle" className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </Button>
          <span className="text-sm text-[var(--cp-muted)]">
            {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            Next
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </Card>
      )}

      {/* Help Text */}
      {!loading && items.length > 0 && (
        <p className="text-center text-xs text-[var(--cp-muted)]">
          Click any document to view its analysis instantly from cache.
        </p>
      )}
    </div>
  );
}
