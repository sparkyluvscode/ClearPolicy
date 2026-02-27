"use client";

import { FREE_SEARCH_LIMIT } from "@/lib/free-search-gate";

interface FreeSearchGateOverlayProps {
  onSignUp: () => void;
  onDismiss: () => void;
  /** When true, renders as a centered modal overlay; otherwise full-page. */
  overlay?: boolean;
}

export default function FreeSearchGateOverlay({
  onSignUp,
  onDismiss,
  overlay = true,
}: FreeSearchGateOverlayProps) {
  const content = (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="glass-card rounded-2xl p-8 md:p-10 animate-fade-up shadow-elevated">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--cp-accent)]/10">
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="font-heading text-2xl font-bold text-[var(--cp-text)] mb-2">
          Create a free account to continue
        </h2>
        <p className="text-sm text-[var(--cp-muted)] leading-relaxed mb-8 max-w-sm mx-auto">
          You&apos;ve used your {FREE_SEARCH_LIMIT} free searches. Sign up to
          get unlimited access to policy research, saved history, and more.
        </p>
        <button
          onClick={onSignUp}
          className="w-full bg-[var(--cp-accent)] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all mb-3"
        >
          Get Started — it&apos;s free
        </button>
        <button
          onClick={onDismiss}
          className="text-xs text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors"
        >
          Go back
        </button>
      </div>
    </div>
  );

  if (!overlay) return content;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in px-4"
      style={{ zIndex: 200000 }}
    >
      {content}
    </div>
  );
}
