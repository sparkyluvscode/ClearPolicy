"use client";
import FeatureGrid from "@/components/FeatureGrid";
import Link from "next/link";
import { Badge } from "@/components/ui";

export default function AboutPage() {
  const quickLinks = [
    { label: "Proposition 17 (2020)", slug: "ca-prop-17-2020" },
    { label: "Proposition 47 (2014)", slug: "ca-prop-47-2014" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-fade-in" style={{ paddingTop: "var(--space-xl)", paddingBottom: "var(--space-3xl)" }}>
      {/* Header */}
      <div className="space-y-3">
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-[var(--cp-text)]">
          About ClearPolicy
        </h1>
        <p className="text-lg text-[var(--cp-muted)] leading-relaxed max-w-xl">
          Plain-English policy summaries with sources, built for students, parents, and voters.
        </p>
      </div>

      <FeatureGrid />

      {/* Omni-Search */}
      <div className="glass-card rounded-2xl p-6 md:p-8" style={{ borderLeft: "3px solid var(--cp-accent)" }}>
        <div className="mb-4">
          <h2 className="font-heading text-2xl font-bold text-[var(--cp-text)]">Omni-Search Technology</h2>
          <p className="text-sm text-[var(--cp-muted)] mt-1">Our multi-source policy intelligence engine</p>
        </div>
        <p className="text-[15px] text-[var(--cp-text)] leading-relaxed mb-5">
          Omni-Search doesn&apos;t just look things up — it cross-references federal databases, state legislative trackers, government archives, and trusted news sources simultaneously. Every claim is cited, every source is verifiable, and ambiguous queries are clarified before results are generated.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Multi-Source", desc: "Congress.gov, OpenStates, GovInfo, and web sources searched in parallel" },
            { label: "Citation-First", desc: "Every factual claim is backed by a numbered source or flagged as unverified" },
            { label: "Document Analysis", desc: "Drop any PDF or document to get an instant, cited analysis" },
          ].map((f) => (
            <div key={f.label} className="rounded-lg bg-[var(--cp-surface-2)] p-3.5">
              <p className="text-xs font-semibold text-[var(--cp-accent)] mb-0.5">{f.label}</p>
              <p className="text-[13px] text-[var(--cp-muted)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div>
        <p className="section-label mb-4">How it works</p>
        <div className="grid gap-3 md:grid-cols-3 stagger">
          {[
            { step: "1", title: "Ask anything", desc: "Type a question, search a bill, or drop a document — Omni-Search handles it all." },
            { step: "2", title: "Get cited answers", desc: "Every claim references a real source. Unverified claims are clearly flagged." },
            { step: "3", title: "Explore deeper", desc: "Ask follow-ups within the same conversation. Adjust persona and reading level." },
          ].map((item) => (
            <div key={item.step} className="glass-card rounded-xl p-5 animate-fade-up">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--cp-accent-soft)] text-[var(--cp-accent)] text-xs font-semibold mb-3">
                {item.step}
              </span>
              <p className="text-sm font-semibold text-[var(--cp-text)] mb-1">{item.title}</p>
              <p className="text-sm text-[var(--cp-muted)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sample measures */}
      <div>
        <p className="section-label mb-2">Sample measures</p>
        <p className="text-[var(--cp-muted)] text-sm mb-4">Explore demo cards with reading levels, citations, and sources.</p>
        <div className="flex gap-3 flex-wrap">
          {quickLinks.map((l) => (
            <Link key={l.slug} href={`/measure/${l.slug}`} className="block group focus-ring rounded-xl">
              <div className="glass-card rounded-xl p-4 surface-lift min-w-[15rem]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[var(--cp-text)]">{l.label}</span>
                  <Badge variant="neutral">Demo</Badge>
                </div>
                <p className="mt-2 text-xs text-[var(--cp-muted)]">Open a sample measure card.</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
