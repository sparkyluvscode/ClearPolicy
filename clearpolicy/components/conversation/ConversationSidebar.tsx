"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ConversationListItem = {
  id: string;
  title: string | null;
  policyName: string;
  updatedAt: string;
  isStarred: boolean;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 24 * 60 * 60 * 1000) return "Today";
  if (diff < 2 * 24 * 60 * 60 * 1000) return "Yesterday";
  if (diff < 7 * 24 * 60 * 60 * 1000) return "This week";
  return "Older";
}

export function ConversationSidebar({
  currentId,
}: {
  currentId?: string;
}) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/conversations")
      .then((res) => (res.ok ? res.json() : { conversations: [] }))
      .then((data) => {
        if (!cancelled) setConversations(data.conversations ?? []);
      })
      .catch(() => {
        if (!cancelled) setConversations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = conversations.reduce<Record<string, ConversationListItem[]>>(
    (acc, c) => {
      const key = formatDate(c.updatedAt);
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    },
    {}
  );
  const order = ["Today", "Yesterday", "This week", "Older"];

  return (
    <aside className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-sm)]">
      <Link
        href="/"
        className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--border-light)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/30"
      >
        <span aria-hidden>+</span> New search
      </Link>
      <h2
        className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
        style={{ fontFamily: "var(--font-heading-display)" }}
      >
        History
      </h2>
      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      ) : conversations.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          Sign in and run a search to see conversations here.
        </p>
      ) : (
        <div className="space-y-4">
          {order.map(
            (key) =>
              grouped[key]?.length > 0 && (
                <div key={key}>
                  <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
                    {key}
                  </p>
                  <ul className="space-y-1">
                    {grouped[key].map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/explore/${c.id}`}
                          className={`block rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/30 ${
                            currentId === c.id
                              ? "bg-[var(--accent-blue)]/10 font-medium text-[var(--accent-blue)]"
                              : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                          }`}
                        >
                          <span className="line-clamp-2">
                            {c.title || c.policyName}
                          </span>
                          {c.isStarred && (
                            <span className="ml-1 text-[var(--accent-gold)]" aria-hidden>★</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
          )}
        </div>
      )}
    </aside>
  );
}
