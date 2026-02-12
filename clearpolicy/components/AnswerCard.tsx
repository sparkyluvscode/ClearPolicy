"use client";

import type { AnswerSection, Source } from "@/lib/omni-types";

interface AnswerCardProps {
  id: string;
  userQuery?: string;
  heading: string;
  cardType: "general" | "verified" | "debate" | "document";
  sections: AnswerSection[];
  onSourceClick: (source: Source) => void;
  sources: Source[];
}

/**
 * AnswerCard renders as flowing text — not a card widget.
 * It's designed to live inside an immersive full-screen chat view.
 */
export default function AnswerCard({
  userQuery,
  heading,
  cardType,
  sections,
  onSourceClick,
  sources,
}: AnswerCardProps) {
  const accentColor =
    cardType === "verified" ? "var(--cp-green)" :
    cardType === "debate" ? "var(--cp-coral)" :
    cardType === "document" ? "var(--cp-gold)" : "var(--cp-accent)";

  function renderCited(content: string) {
    const parts = content.split(/(\[\d+\]|\(General Knowledge\))/g);
    return parts.map((part, i) => {
      const cit = part.match(/^\[(\d+)\]$/);
      if (cit) {
        const idx = parseInt(cit[1], 10) - 1;
        const src = sources[idx];
        if (src) return (
          <button
            key={i}
            onClick={() => onSourceClick(src)}
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-semibold transition-all cursor-pointer align-super ml-0.5 -mt-0.5 hover:opacity-70"
            style={{ background: `color-mix(in srgb, ${accentColor} 12%, transparent)`, color: accentColor }}
            title={src.title}
          >
            {cit[1]}
          </button>
        );
      }
      if (part === "(General Knowledge)") return (
        <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded text-[var(--cp-tertiary)] bg-[var(--cp-surface-2)] mx-0.5">
          unverified
        </span>
      );
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="animate-fade-up">
      {/* Divider + "You asked" for follow-ups */}
      {userQuery && (
        <div className="pt-8 pb-4 border-t border-[var(--cp-border)]">
          <p className="text-[13px] text-[var(--cp-tertiary)]">
            You asked: &ldquo;{userQuery}&rdquo;
          </p>
        </div>
      )}

      {/* Heading */}
      <h2 className="font-heading text-2xl sm:text-[28px] font-bold text-[var(--cp-text)] leading-tight tracking-tight mb-6">
        {heading}
        {cardType === "verified" && (
          <span className="inline-flex items-center gap-1 ml-3 text-[11px] font-medium text-[var(--cp-green)] align-middle">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            Verified
          </span>
        )}
      </h2>

      {/* Sections — flowing text */}
      <div className="space-y-6">
        {sections.map((section, i) => (
          <div key={i}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--cp-muted)] mb-2 flex items-center gap-2">
              {section.heading}
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background:
                    section.confidence === "verified" ? "var(--cp-green)" :
                    section.confidence === "inferred" ? "var(--cp-warning)" : "var(--cp-coral)"
                }}
              />
            </p>
            <div className="text-[15px] sm:text-[16px] text-[var(--cp-text)] leading-[1.8]">
              {renderCited(section.content)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
