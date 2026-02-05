"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Badge } from "@/components/ui";

/**
 * UN Document Analysis History Page
 * 
 * Shows a list of previously analyzed UN/international documents.
 * Allows users to view past analyses without re-processing.
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
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
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

  const truncate = (str: string | null, len: number) => {
    if (!str) return "Untitled";
    return str.length > len ? str.slice(0, len) + "..." : str;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-accent/10 p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
              <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--cp-text)]">Analysis History</h1>
            <p className="text-sm text-[var(--cp-muted)]">
              {total > 0 ? `${total} document${total === 1 ? "" : "s"} analyzed` : "No documents yet"}
            </p>
          </div>
        </div>
        <Link href="/un">
          <Button variant="primary" size="sm">
            + Analyze New
          </Button>
        </Link>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-1/3 mx-auto rounded bg-[var(--cp-surface-2)]" />
            <div className="h-4 w-1/2 mx-auto rounded bg-[var(--cp-surface-2)]" />
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="p-6 text-center">
          <div className="text-red-500 mb-4">Failed to load history</div>
          <p className="text-sm text-[var(--cp-muted)] mb-4">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => setOffset(0)}>
            Try Again
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-[var(--cp-text)] mb-2">No documents analyzed yet</h2>
          <p className="text-sm text-[var(--cp-muted)] mb-4">
            Analyze a UN document to see it here. Analyses are cached to save time on repeat visits.
          </p>
          <Link href="/un">
            <Button variant="primary">Analyze Your First Document</Button>
          </Link>
        </Card>
      )}

      {/* History List */}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <Link key={item.id} href={`/un/results?hash=${item.documentHash}`}>
              <Card className="hover:border-accent transition-colors cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{getSourceIcon(item.sourceType)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[var(--cp-text)] truncate">
                      {truncate(item.title || item.sourceReference, 60)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="neutral" className="text-xs">
                        {item.sourceType.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-[var(--cp-muted)]">
                        {item.documentLength.toLocaleString()} chars
                      </span>
                      <span className="text-xs text-[var(--cp-muted)]">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    {item.sourceReference && item.sourceReference !== item.title && (
                      <p className="text-xs text-[var(--cp-muted)] mt-1 truncate">
                        {truncate(item.sourceReference, 80)}
                      </p>
                    )}
                  </div>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-[var(--cp-muted)] flex-shrink-0"
                  >
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
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
            ← Previous
          </Button>
          <span className="text-sm text-[var(--cp-muted)]">
            {offset + 1} - {Math.min(offset + limit, total)} of {total}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            Next →
          </Button>
        </Card>
      )}
    </div>
  );
}
