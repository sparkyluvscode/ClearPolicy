"use client";

import type { AnswerSection } from "@/lib/policy-types";

type SourceItem = {
  id: string;
  url: string;
  title: string | null;
  domain: string | null;
  sourceType: string | null;
  verified: boolean;
  citationNumber: number | null;
};

export function ExploreAnswerCard({
  heading,
  sections,
  sources,
  followUpSuggestions = [],
  onFollowUp,
  onSourceClick,
  userQuery,
}: {
  heading: string;
  sections: AnswerSection;
  sources: SourceItem[];
  followUpSuggestions?: string[];
  onFollowUp?: (q: string) => void;
  onSourceClick?: (url: string) => void;
  userQuery?: string;
}) {
  return (
    <article className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]">
      {userQuery && (
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
          You asked: {userQuery}
        </p>
      )}
      <h2
        className="mb-5 text-2xl font-bold text-[var(--text-primary)]"
        style={{ fontFamily: "var(--font-heading-display)" }}
      >
        {heading}
      </h2>

      {sections.summary && (
        <section className="mb-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Summary
          </h3>
          <p className="text-[15px] leading-relaxed text-[var(--text-primary)]">
            {sections.summary}
          </p>
        </section>
      )}

      {sections.keyProvisions && sections.keyProvisions.length > 0 && (
        <section className="mb-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Key provisions
          </h3>
          <ul className="list-inside list-disc space-y-1 text-[15px] text-[var(--text-primary)]">
            {sections.keyProvisions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {sections.localImpact && (
        <section className="mb-5 rounded-lg bg-[var(--bg-secondary)] p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--accent-blue)]">
            Local impact · {sections.localImpact.zipCode}
          </h3>
          <p className="text-[15px] leading-relaxed text-[var(--text-primary)]">
            {sections.localImpact.content}
          </p>
        </section>
      )}

      {sections.argumentsFor && sections.argumentsFor.length > 0 && (
        <section className="mb-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Arguments for
          </h3>
          <ul className="list-inside list-disc space-y-1 text-[15px] text-[var(--text-primary)]">
            {sections.argumentsFor.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {sections.argumentsAgainst && sections.argumentsAgainst.length > 0 && (
        <section className="mb-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Arguments against
          </h3>
          <ul className="list-inside list-disc space-y-1 text-[15px] text-[var(--text-primary)]">
            {sections.argumentsAgainst.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {followUpSuggestions.length > 0 && onFollowUp && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--border-light)] pt-5">
          {followUpSuggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onFollowUp(s)}
              className="rounded-full border border-[var(--border-light)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--accent-blue)]/40 hover:bg-[var(--bg-card)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/30"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
