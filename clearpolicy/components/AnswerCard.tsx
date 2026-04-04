"use client";

import type { AnswerSection, Source } from "@/lib/omni-types";

interface FollowUpMeta {
  intent: string;
  intentLabel: string;
  depthLevel: number;
}

interface AnswerCardProps {
  id: string;
  userQuery?: string;
  heading: string;
  cardType: "general" | "verified" | "debate" | "document";
  sections: AnswerSection[];
  onSourceClick: (source: Source) => void;
  sources: Source[];
  followUpMeta?: FollowUpMeta;
}

export default function AnswerCard({
  userQuery,
  heading,
  cardType,
  sections,
  onSourceClick,
  sources,
  followUpMeta,
}: AnswerCardProps) {
  const accentColor =
    cardType === "verified" ? "var(--cp-green)" :
    cardType === "debate" ? "var(--cp-coral)" :
    cardType === "document" ? "var(--cp-gold)" : "var(--cp-accent)";

  function findSourceByName(name: string): Source | undefined {
    const lower = name.toLowerCase();
    return sources.find(s => {
      const titleLower = (s.title || "").toLowerCase();
      const publisherLower = (s.publisher || "").toLowerCase();
      const urlLower = (s.url || "").toLowerCase();
      return titleLower.includes(lower) || lower.includes(titleLower) ||
        publisherLower.includes(lower) || lower.includes(publisherLower) ||
        urlLower.includes(lower);
    });
  }

  function renderCited(content: string) {
    const parts = content.split(/(\[([^\]]+)\]\(([^)]+)\)|\[\d+\](?:\[\d+\])*|\[Doc(?:,\s*[^\]]+)?\]|\(General Knowledge\))/g);
    const result: React.ReactNode[] = [];
    let idx = 0;
    while (idx < parts.length) {
      const part = parts[idx];
      if (part === undefined || part === "") { idx++; continue; }

      // Markdown link: [Source Name](URL) - from new attribution style
      const mdLink = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (mdLink) {
        const linkText = mdLink[1];
        const linkUrl = mdLink[2];
        const matchedSrc = sources.find(s => s.url === linkUrl) || findSourceByName(linkText);
        result.push(
          matchedSrc ? (
            <button
              key={idx}
              onClick={() => onSourceClick(matchedSrc)}
              className="inline font-semibold underline decoration-1 underline-offset-2 transition-all cursor-pointer hover:decoration-2"
              style={{ color: accentColor }}
              title={`Source: ${matchedSrc.title}${matchedSrc.url ? ` — ${matchedSrc.url}` : ""}`}
            >
              {linkText}
            </button>
          ) : (
            linkUrl ? (
              <a
                key={idx}
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline font-semibold underline decoration-1 underline-offset-2 transition-all hover:decoration-2"
                style={{ color: accentColor }}
              >
                {linkText}
              </a>
            ) : (
              <span key={idx} className="font-semibold" style={{ color: accentColor }}>{linkText}</span>
            )
          )
        );
        idx += 3; // skip the capture groups
        continue;
      }

      // Legacy: bracketed numeric citations [1][2]
      const multiCit = part.match(/^(\[\d+\])+$/);
      if (multiCit) {
        const nums = [...part.matchAll(/\[(\d+)\]/g)];
        result.push(
          <span key={idx}>
            {nums.map((m, j) => {
              const srcIdx = parseInt(m[1], 10) - 1;
              const src = sources[srcIdx];
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
        idx++;
        continue;
      }

      // Legacy: single [N]
      const singleCit = part.match(/^\[(\d+)\]$/);
      if (singleCit) {
        const srcIdx = parseInt(singleCit[1], 10) - 1;
        const src = sources[srcIdx];
        if (src) {
          result.push(
            <button
              key={idx}
              onClick={() => onSourceClick(src)}
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold transition-all cursor-pointer align-super ml-0.5 -mt-0.5 hover:scale-110 hover:shadow-sm"
              style={{ background: `color-mix(in srgb, ${accentColor} 15%, transparent)`, color: accentColor, border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)` }}
              title={`[${singleCit[1]}] ${src.title}`}
            >
              {singleCit[1]}
            </button>
          );
        } else {
          result.push(<sup key={idx} className="text-[10px] text-[var(--cp-tertiary)] mx-0.5">[{singleCit[1]}]</sup>);
        }
        idx++;
        continue;
      }

      // Doc citations
      const docCit = part.match(/^\[Doc(?:,\s*([^\]]+))?\]$/);
      if (docCit) {
        const docSrc = sources.find(s => s.type === "uploaded_document");
        const location = docCit[1];
        result.push(
          <button
            key={idx}
            onClick={() => docSrc && onSourceClick(docSrc)}
            className="inline-flex items-center gap-0.5 h-[18px] rounded-full text-[10px] font-bold transition-all cursor-pointer align-super ml-0.5 -mt-0.5 px-1.5 hover:scale-105"
            style={{ background: "color-mix(in srgb, var(--cp-gold) 15%, transparent)", color: "var(--cp-gold)", border: "1px solid color-mix(in srgb, var(--cp-gold) 25%, transparent)" }}
            title={location ? `Document: ${location}` : "Uploaded Document"}
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {location || "Doc"}
          </button>
        );
        idx++;
        continue;
      }

      if (part === "(General Knowledge)") {
        result.push(
          <span key={idx} className="text-[9px] px-1 py-0.5 rounded text-[var(--cp-tertiary)] mx-0.5 opacity-60" title="This claim is based on general knowledge, not a specific source">
            *
          </span>
        );
        idx++;
        continue;
      }

      result.push(<span key={idx}>{part}</span>);
      idx++;
    }
    return result;
  }

  function isDataTable(content: string): boolean {
    const lines = content.split("\n").filter(l => l.trim());
    if (lines.length < 3) return false;
    return lines[0].includes(" | ") && lines[1].includes("---");
  }

  function renderDataTable(content: string) {
    const lines = content.split("\n").filter(l => l.trim());
    if (lines.length < 3) return <span>{content}</span>;
    const headers = lines[0].split(" | ").map(h => h.trim());
    const rows = lines.slice(2).map(r => r.split(" | ").map(c => c.trim()));

    return (
      <div className="overflow-x-auto rounded-xl border border-[var(--cp-border)] my-3">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[var(--cp-surface-2)]">
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--cp-muted)] border-b border-[var(--cp-border)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-[var(--cp-surface)]/30"}>
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 text-[var(--cp-text)] border-b border-[var(--cp-border)]/50">
                    {renderCited(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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
    const sectionIcon = headingLower.includes("summary") || headingLower.includes("overview") ? (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    ) : headingLower.includes("statistic") || headingLower.includes("data") ? (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    ) : headingLower.includes("polling") || headingLower.includes("opinion") ? (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    ) : headingLower.includes("economic") ? (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
      headingLower.includes("statistic") || headingLower.includes("data") || headingLower.includes("economic") ? "var(--cp-accent)" :
      headingLower.includes("polling") || headingLower.includes("opinion") ? "var(--cp-gold, var(--cp-accent))" :
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
            ? section.content.split("\n\n").map((block, j) => {
                const t = block.trim();
                if (!t) return null;
                if (isDataTable(t)) {
                  return <div key={j}>{renderDataTable(t)}</div>;
                }
                return (
                  <div key={j} className={j > 0 ? "mt-3" : ""}>
                    {t.split("\n").map((line, k) => {
                      const lt = line.trim();
                      if (!lt) return null;
                      if (lt.startsWith("### ")) {
                        return <p key={k} className="text-[13px] font-bold uppercase tracking-wide text-[var(--cp-muted)] mt-4 mb-1">{lt.replace("### ", "")}</p>;
                      }
                      return (
                        <div key={k} className={k > 0 ? "mt-2" : ""}>
                          {renderCited(lt)}
                        </div>
                      );
                    })}
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
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[var(--cp-surface)] border border-[var(--cp-border)]">
            <svg className="w-4 h-4 text-[var(--cp-accent)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <p className="text-[14px] text-[var(--cp-text)] font-user-input leading-relaxed">
              {userQuery}
            </p>
          </div>
        </div>
      )}

      <h2 className="font-heading text-2xl sm:text-[28px] font-bold text-[var(--cp-text)] leading-tight tracking-tight mb-2">
        {heading}
        {cardType === "verified" && (
          <span className="inline-flex items-center gap-1 ml-3 text-[11px] font-medium text-[var(--cp-green)] align-middle">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            Verified
          </span>
        )}
      </h2>

      {/* Follow-up depth/intent badge */}
      {followUpMeta && (
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            followUpMeta.intent === "more_data"
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : followUpMeta.intent === "go_deeper"
              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
              : followUpMeta.intent === "different_angle"
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : followUpMeta.intent === "simplify"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : followUpMeta.intent === "source_specific"
              ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
              : "bg-[var(--cp-surface-2)] text-[var(--cp-muted)]"
          }`}>
            {followUpMeta.intent === "more_data" && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            {followUpMeta.intent === "go_deeper" && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            {followUpMeta.intentLabel}
          </span>
          {followUpMeta.depthLevel > 1 && (
            <span className="text-[10px] text-[var(--cp-tertiary)] flex items-center gap-1">
              Depth Level {followUpMeta.depthLevel}
              <span className="flex gap-0.5">
                {Array.from({ length: Math.min(followUpMeta.depthLevel, 4) }).map((_, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--cp-accent)]" />
                ))}
              </span>
            </span>
          )}
        </div>
      )}
      {!followUpMeta && <div className="mb-4" />}

      {/* Sections - flowing text for non-comparison sections */}
      <div className="space-y-8">
        {otherSections.map((section, i) => renderSection(section, i))}
      </div>

      {/* Comparison Table for Arguments For vs Against */}
      {hasComparisonData && renderComparisonTable()}
    </div>
  );
}
