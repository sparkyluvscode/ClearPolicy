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
    const parts = content.split(/(\[\d+\](?:\[\d+\])*|\[Doc(?:,\s*[^\]]+)?\]|\(General Knowledge\))/g);
    return parts.map((part, i) => {
      const multiCit = part.match(/^(\[\d+\])+$/);
      if (multiCit) {
        const nums = [...part.matchAll(/\[(\d+)\]/g)];
        return (
          <span key={i}>
            {nums.map((m, j) => {
              const idx = parseInt(m[1], 10) - 1;
              const src = sources[idx];
              if (!src) return <sup key={j} className="text-[10px] text-[var(--cp-tertiary)] mx-0.5">[{m[1]}]</sup>;
              return (
                <button
                  key={j}
                  onClick={() => onSourceClick(src)}
                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold transition-all cursor-pointer align-super ml-0.5 -mt-0.5 hover:scale-110 hover:shadow-sm"
                  style={{ background: `color-mix(in srgb, ${accentColor} 15%, transparent)`, color: accentColor, border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)` }}
                  title={`[${m[1]}] ${src.title}`}
                >
                  {m[1]}
                </button>
              );
            })}
          </span>
        );
      }
      const singleCit = part.match(/^\[(\d+)\]$/);
      if (singleCit) {
        const idx = parseInt(singleCit[1], 10) - 1;
        const src = sources[idx];
        if (src) return (
          <button
            key={i}
            onClick={() => onSourceClick(src)}
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold transition-all cursor-pointer align-super ml-0.5 -mt-0.5 hover:scale-110 hover:shadow-sm"
            style={{ background: `color-mix(in srgb, ${accentColor} 15%, transparent)`, color: accentColor, border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)` }}
            title={`[${singleCit[1]}] ${src.title}`}
          >
            {singleCit[1]}
          </button>
        );
        return <sup key={i} className="text-[10px] text-[var(--cp-tertiary)] mx-0.5">[{singleCit[1]}]</sup>;
      }
      const docCit = part.match(/^\[Doc(?:,\s*([^\]]+))?\]$/);
      if (docCit) {
        const docSrc = sources.find(s => s.type === "uploaded_document");
        const location = docCit[1];
        return (
          <button
            key={i}
            onClick={() => docSrc && onSourceClick(docSrc)}
            className="inline-flex items-center gap-0.5 h-[18px] rounded-full text-[10px] font-bold transition-all cursor-pointer align-super ml-0.5 -mt-0.5 px-1.5 hover:scale-105"
            style={{ background: "color-mix(in srgb, var(--cp-gold) 15%, transparent)", color: "var(--cp-gold)", border: "1px solid color-mix(in srgb, var(--cp-gold) 25%, transparent)" }}
            title={location ? `Document: ${location}` : "Uploaded Document"}
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {location || "Doc"}
          </button>
        );
      }
      if (part === "(General Knowledge)") return (
        <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded text-[var(--cp-tertiary)] bg-[var(--cp-surface-2)] mx-0.5 border border-[var(--cp-border)]">
          unverified
        </span>
      );
      return <span key={i}>{part}</span>;
    });
  }

  // Detect if we have both "Arguments for" and "Arguments against" sections for table rendering
  const forSection = sections.find(s => s.heading.toLowerCase().includes("for") && !s.heading.toLowerCase().includes("against"));
  const againstSection = sections.find(s => s.heading.toLowerCase().includes("against"));
  const hasComparisonData = forSection && againstSection;

  // Remaining sections (not for/against, those go in the table)
  const otherSections = hasComparisonData
    ? sections.filter(s => s !== forSection && s !== againstSection)
    : sections;

  function renderSection(section: AnswerSection, i: number) {
    const headingLower = section.heading.toLowerCase();
    const sectionIcon = headingLower.includes("summary") ? (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    ) : headingLower.includes("provision") || headingLower.includes("key") ? (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
    ) : headingLower.includes("local") || headingLower.includes("impact") ? (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    ) : headingLower.includes("for") ? (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
    ) : headingLower.includes("against") ? (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
    ) : (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    );

    const sectionColor =
      headingLower.includes("for") ? "var(--cp-green)" :
      headingLower.includes("against") ? "var(--cp-coral)" :
      headingLower.includes("local") || headingLower.includes("impact") ? "var(--cp-accent)" :
      "var(--cp-muted)";

    return (
      <div key={i}>
        <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-[var(--cp-border)]" style={{ borderColor: `color-mix(in srgb, ${sectionColor} 20%, transparent)` }}>
          <span style={{ color: sectionColor }}>{sectionIcon}</span>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: sectionColor }}>
            {section.heading}
          </p>
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background:
                section.confidence === "verified" ? "var(--cp-green)" :
                section.confidence === "inferred" ? "var(--cp-warning)" : "var(--cp-coral)"
            }}
          />
        </div>
        <div className="text-[15px] sm:text-[16px] text-[var(--cp-text)] leading-[1.8]">
          {section.content.includes("\n")
            ? section.content.split("\n").map((line, j) => {
                const t = line.trim();
                if (!t) return null;
                return (
                  <div key={j} className={j > 0 ? "mt-2" : ""}>
                    {renderCited(t)}
                  </div>
                );
              })
            : renderCited(section.content)}
        </div>
      </div>
    );
  }

  function renderComparisonTable() {
    if (!forSection || !againstSection) return null;
    const forPoints = forSection.content.split("\n").map(l => l.trim()).filter(Boolean);
    const againstPoints = againstSection.content.split("\n").map(l => l.trim()).filter(Boolean);
    const maxRows = Math.max(forPoints.length, againstPoints.length);

    return (
      <div className="my-8">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-[var(--cp-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--cp-muted)]">Arguments Comparison</p>
        </div>
        <div className="rounded-xl border border-[var(--cp-border)] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-2">
            <div className="px-4 py-3 bg-[color-mix(in_srgb,var(--cp-green)_8%,transparent)] border-b border-r border-[var(--cp-border)]">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-[var(--cp-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--cp-green)]">Arguments For</span>
              </div>
            </div>
            <div className="px-4 py-3 bg-[color-mix(in_srgb,var(--cp-coral)_8%,transparent)] border-b border-[var(--cp-border)]">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-[var(--cp-coral)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--cp-coral)]">Arguments Against</span>
              </div>
            </div>
          </div>
          {/* Rows */}
          {Array.from({ length: maxRows }).map((_, rowIdx) => (
            <div key={rowIdx} className={`grid grid-cols-2 ${rowIdx < maxRows - 1 ? "border-b border-[var(--cp-border)]" : ""}`}>
              <div className="px-4 py-3 border-r border-[var(--cp-border)] text-[14px] text-[var(--cp-text)] leading-relaxed">
                {forPoints[rowIdx] ? renderCited(forPoints[rowIdx]) : <span className="text-[var(--cp-tertiary)]">&mdash;</span>}
              </div>
              <div className="px-4 py-3 text-[14px] text-[var(--cp-text)] leading-relaxed">
                {againstPoints[rowIdx] ? renderCited(againstPoints[rowIdx]) : <span className="text-[var(--cp-tertiary)]">&mdash;</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {userQuery && (
        <div className="pt-8 pb-4 border-t border-[var(--cp-border)]">
          <p className="text-[13px] text-[var(--cp-tertiary)]">
            You asked: &ldquo;<span className="font-user-input">{userQuery}</span>&rdquo;
          </p>
        </div>
      )}

      <h2 className="font-heading text-2xl sm:text-[28px] font-bold text-[var(--cp-text)] leading-tight tracking-tight mb-6">
        {heading}
        {cardType === "verified" && (
          <span className="inline-flex items-center gap-1 ml-3 text-[11px] font-medium text-[var(--cp-green)] align-middle">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            Verified
          </span>
        )}
      </h2>

      {/* Sections - flowing text for non-comparison sections */}
      <div className="space-y-8">
        {otherSections.map((section, i) => renderSection(section, i))}
      </div>

      {/* Comparison Table for Arguments For vs Against */}
      {hasComparisonData && renderComparisonTable()}
    </div>
  );
}
