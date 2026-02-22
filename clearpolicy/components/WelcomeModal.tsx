"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "cp_welcomed";

const tips = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: "Ask anything",
    desc: "Search any policy, bill, or civic question in plain English.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Every claim is cited",
    desc: "Sources are tracked so you can verify any statement.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "Go deeper with follow-ups",
    desc: "Ask follow-up questions to explore any angle.",
  },
];

export function WelcomeModal() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const timer = setTimeout(() => setShow(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [pathname]);

  function dismiss() {
    setShow(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[999998] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in" onClick={dismiss}>
      <div
        className="glass-card rounded-2xl p-6 max-w-sm w-full mx-4 shadow-elevated animate-fade-up"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-heading text-lg font-bold text-[var(--cp-text)] mb-1">
          Welcome to ClearPolicy
        </h2>
        <p className="text-sm text-[var(--cp-muted)] mb-5">
          Understand any policy in seconds, backed by real sources.
        </p>
        <div className="space-y-4">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[var(--cp-accent)]/10 flex items-center justify-center text-[var(--cp-accent)]">
                {tip.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--cp-text)]">{tip.title}</p>
                <p className="text-xs text-[var(--cp-muted)] mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={dismiss}
          className="mt-6 w-full rounded-xl bg-[var(--cp-accent)] px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 transition-all active:scale-[0.98]"
        >
          Get started
        </button>
      </div>
    </div>
  );
}
