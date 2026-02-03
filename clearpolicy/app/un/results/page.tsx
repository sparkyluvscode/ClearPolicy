"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Button, Badge, SegmentedControl } from "@/components/ui";
import type { UNDocumentAnalysis, ReadingLevel } from "@/lib/un-types";
import { STAGE_LABELS, PROCESS_LABELS } from "@/lib/un-types";

/**
 * UN Document Analysis Results Page
 * 
 * Displays the structured analysis of a UN/international document.
 * Features reading level toggle, collapsible sections, and glossary.
 * 
 * @module app/un/results/page
 */

export default function UNResultsPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<UNDocumentAnalysis | null>(null);
  const [level, setLevel] = useState<ReadingLevel>("8");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["tldr", "objectives", "youth", "glossary"])
  );

  useEffect(() => {
    // Load analysis from sessionStorage
    const stored = sessionStorage.getItem("un_analysis");
    if (stored) {
      try {
        setAnalysis(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored analysis:", e);
        router.push("/un");
      }
    } else {
      router.push("/un");
    }
  }, [router]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (!analysis) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-2/3 mx-auto rounded bg-[var(--cp-surface-2)]" />
            <div className="h-4 w-1/2 mx-auto rounded bg-[var(--cp-surface-2)]" />
          </div>
        </Card>
      </div>
    );
  }

  const currentLevel = analysis.levels[level];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">{STAGE_LABELS[analysis.stage]}</Badge>
              {analysis.process !== "general" && (
                <Badge variant="neutral">{PROCESS_LABELS[analysis.process] || analysis.process}</Badge>
              )}
              {analysis.wasTruncated && (
                <Badge variant="analysis">Summarized (long document)</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-[var(--cp-text)]">{analysis.title}</h1>
            {(analysis.sourceUrl || analysis.sourceFilename) && (
              <p className="text-sm text-[var(--cp-muted)]">
                Source: {analysis.sourceUrl ? (
                  <a href={analysis.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    {new URL(analysis.sourceUrl).hostname}
                  </a>
                ) : analysis.sourceFilename}
              </p>
            )}
          </div>
          <Link href="/un">
            <Button variant="secondary" size="sm">
              ← Analyze another
            </Button>
          </Link>
        </div>
      </Card>

      {/* Reading Level Selector */}
      <Card variant="subtle" className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-[var(--cp-text)]">Reading Level</div>
          <div className="text-xs text-[var(--cp-muted)]">
            {level === "5" && "Very simple • Ages 10-12"}
            {level === "8" && "Standard • High school"}
            {level === "12" && "Detailed • College+"}
          </div>
        </div>
        <SegmentedControl
          value={level}
          onChange={(v) => setLevel(v as ReadingLevel)}
          ariaLabel="Reading level"
          options={[
            { value: "5", label: "5th" },
            { value: "8", label: "8th" },
            { value: "12", label: "12th" },
          ]}
        />
      </Card>

      {/* TL;DR Summary */}
      <CollapsibleSection
        title="TL;DR Summary"
        icon="📝"
        expanded={expandedSections.has("tldr")}
        onToggle={() => toggleSection("tldr")}
      >
        <div className="prose prose-sm max-w-none text-[var(--cp-text)]">
          {currentLevel.tldr.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </CollapsibleSection>

      {/* Key Objectives */}
      <CollapsibleSection
        title="Key Objectives"
        icon="🎯"
        expanded={expandedSections.has("objectives")}
        onToggle={() => toggleSection("objectives")}
      >
        {currentLevel.keyObjectives.length > 0 ? (
          <ul className="space-y-2">
            {currentLevel.keyObjectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--cp-text)]">
                <span className="text-accent mt-0.5">•</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--cp-muted)] italic">No specific objectives identified.</p>
        )}
      </CollapsibleSection>

      {/* Who's Affected */}
      <CollapsibleSection
        title="Who's Affected"
        icon="👥"
        expanded={expandedSections.has("affected")}
        onToggle={() => toggleSection("affected")}
      >
        <p className="text-sm text-[var(--cp-text)]">{currentLevel.whoAffected || "Information not available."}</p>
      </CollapsibleSection>

      {/* Decisions & Commitments */}
      <CollapsibleSection
        title="Decisions & Commitments"
        icon="📋"
        expanded={expandedSections.has("decisions")}
        onToggle={() => toggleSection("decisions")}
      >
        <p className="text-sm text-[var(--cp-text)]">{currentLevel.decisions || "No specific decisions identified."}</p>
      </CollapsibleSection>

      {/* Pros & Cons */}
      <CollapsibleSection
        title="Stakeholder Perspectives"
        icon="⚖️"
        expanded={expandedSections.has("proscons")}
        onToggle={() => toggleSection("proscons")}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
              <span>✓</span> Potential Benefits
            </h4>
            {currentLevel.pros.length > 0 ? (
              <ul className="space-y-2">
                {currentLevel.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--cp-text)]">
                    <span className="text-green-500">•</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--cp-muted)] italic">None identified.</p>
            )}
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <span>!</span> Potential Concerns
            </h4>
            {currentLevel.cons.length > 0 ? (
              <ul className="space-y-2">
                {currentLevel.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--cp-text)]">
                    <span className="text-amber-500">•</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--cp-muted)] italic">None identified.</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Youth Relevance */}
      <CollapsibleSection
        title="Youth Relevance"
        icon="🌍"
        expanded={expandedSections.has("youth")}
        onToggle={() => toggleSection("youth")}
        highlight
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2">General Impact on Youth</h4>
            <p className="text-sm text-[var(--cp-text)]">{analysis.youthRelevance.general}</p>
          </div>
          {analysis.youthRelevance.globalSouth && (
            <div>
              <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2">Global South Youth</h4>
              <p className="text-sm text-[var(--cp-text)]">{analysis.youthRelevance.globalSouth}</p>
            </div>
          )}
          {analysis.youthRelevance.participation && (
            <div>
              <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2">Youth Participation</h4>
              <p className="text-sm text-[var(--cp-text)]">{analysis.youthRelevance.participation}</p>
            </div>
          )}
          {analysis.youthRelevance.relevantAreas.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[var(--cp-text)] mb-2">Relevant Topic Areas</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.youthRelevance.relevantAreas.map((area, i) => (
                  <Badge key={i} variant="neutral">{area}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Glossary */}
      {analysis.glossary.length > 0 && (
        <CollapsibleSection
          title={`Glossary (${analysis.glossary.length} terms)`}
          icon="📖"
          expanded={expandedSections.has("glossary")}
          onToggle={() => toggleSection("glossary")}
        >
          <div className="space-y-4">
            {analysis.glossary.map((term, i) => (
              <div key={i} className="border-b border-[var(--cp-border)] pb-3 last:border-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-bold text-accent">{term.term}</span>
                  <span className="text-sm text-[var(--cp-text)]">— {term.meaning}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--cp-muted)]">{term.simpleExplanation}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Metadata */}
      <Card variant="subtle" className="space-y-2 text-xs text-[var(--cp-muted)]">
        <div className="flex flex-wrap gap-4">
          <span>Analyzed: {new Date(analysis.analyzedAt).toLocaleString()}</span>
          <span>Document length: {analysis.documentLength.toLocaleString()} characters</span>
          {analysis.wasTruncated && <span>(truncated for processing)</span>}
        </div>
        <p className="italic">
          This analysis is AI-generated and intended for educational purposes. 
          It does not constitute legal advice. Always refer to official sources for authoritative information.
        </p>
      </Card>
    </div>
  );
}

/**
 * Collapsible section component
 */
function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  highlight,
  children,
}: {
  title: string;
  icon: string;
  expanded: boolean;
  onToggle: () => void;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={highlight ? "border-accent/30 bg-accent/5" : ""}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <h3 className="text-lg font-semibold text-[var(--cp-text)]">{title}</h3>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className={`text-[var(--cp-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {expanded && <div className="mt-4 pt-4 border-t border-[var(--cp-border)]">{children}</div>}
    </Card>
  );
}
