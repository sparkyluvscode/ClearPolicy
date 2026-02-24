"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface ExplainThisProps {
  /**
   * Called when user clicks "Explain this" with the selected text.
   * The parent is responsible for sending the follow-up (hidden from user).
   */
  onExplain: (selectedText: string) => void;
  /** The container ref to scope text selection detection */
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Floating "Explain this" tooltip that appears when the user selects text
 * within the container. The actual query is hidden from the user — it just
 * shows as a new answer card with the heading derived from the selection.
 */
export default function ExplainThis({ onExplain, containerRef }: ExplainThisProps) {
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  const handleMouseUp = useCallback(() => {
    // Small delay so the browser finalizes the selection
    clearTimeout(hideTimer.current!);
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();

      if (!text || text.length < 3 || text.length > 500) {
        // Too short or too long — don't show
        setSelection(null);
        return;
      }

      // Make sure the selection is inside our container
      if (containerRef.current && sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        if (!containerRef.current.contains(range.commonAncestorContainer)) {
          setSelection(null);
          return;
        }
      }

      const range = sel?.getRangeAt(0);
      if (range) {
        const rect = range.getBoundingClientRect();
        setSelection({
          text,
          x: rect.left + rect.width / 2,
          y: rect.top - 8, // above the selection
        });
      }
    }, 10);
  }, [containerRef]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // If clicking inside the tooltip, don't dismiss
    if (tooltipRef.current?.contains(e.target as Node)) return;
    setSelection(null);
  }, []);

  // Dismiss on scroll or Escape
  const handleDismiss = useCallback(() => {
    hideTimer.current = setTimeout(() => setSelection(null), 150);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setSelection(null);
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    // Dismiss on scroll inside the scroll container
    const container = containerRef.current?.closest("[data-scroll-container]");
    container?.addEventListener("scroll", handleDismiss, { passive: true });

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
      container?.removeEventListener("scroll", handleDismiss);
      clearTimeout(hideTimer.current!);
    };
  }, [handleMouseUp, handleMouseDown, handleKeyDown, handleDismiss, containerRef]);

  function handleClick() {
    if (!selection) return;
    onExplain(selection.text);
    setSelection(null);
    // Clear the text selection
    window.getSelection()?.removeAllRanges();
  }

  if (!selection) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[200] animate-fade-up"
      style={{
        left: `${selection.x}px`,
        top: `${selection.y}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium text-white shadow-elevated hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
        style={{ background: "var(--cp-accent)" }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Explain this
      </button>
      <div
        className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
        style={{
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "6px solid var(--cp-accent)",
        }}
      />
    </div>
  );
}
