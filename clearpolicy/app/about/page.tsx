"use client";
import FeatureGrid from "@/components/FeatureGrid";
import Link from "next/link";
import { Badge, Card } from "@/components/ui";

export default function AboutPage() {
  const quickLinks = [
    { label: "Proposition 17 (2020)", slug: "ca-prop-17-2020" },
    { label: "Proposition 47 (2014)", slug: "ca-prop-47-2014" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="space-y-2">
        <h1 className="page-title">About ClearPolicy</h1>
        <p className="page-subtitle">Plain-English policy summaries with sources, built for students, parents, and voters.</p>
      </Card>
      <FeatureGrid />
      <Card>
        <h2 className="section-heading">How it works</h2>
        <ol className="mt-3 grid gap-4 md:grid-cols-3 text-sm">
          <li>
            <Card variant="subtle" className="p-4">
              <div className="font-medium text-[var(--cp-text)]">1. Type a law or ZIP</div>
              <div className="mt-1 text-[var(--cp-muted)]">Search any bill, proposition, or your ZIP for local officials.</div>
            </Card>
          </li>
          <li>
            <Card variant="subtle" className="p-4">
              <div className="font-medium text-[var(--cp-text)]">2. See a plain-English summary</div>
              <div className="mt-1 text-[var(--cp-muted)]">Sections include TL;DR, What, Who, Pros, Cons with citations.</div>
            </Card>
          </li>
          <li>
            <Card variant="subtle" className="p-4">
              <div className="font-medium text-[var(--cp-text)]">3. Verify and choose</div>
              <div className="mt-1 text-[var(--cp-muted)]">Show cited lines, adjust reading level, and explore official sources.</div>
            </Card>
          </li>
        </ol>
      </Card>

      <Card>
        <h2 className="section-heading">Sample measures</h2>
        <p className="mt-1 text-sm text-[var(--cp-muted)]">Explore demo cards with reading levels, citations, and sources.</p>
        <div className="mt-3 overflow-x-auto no-scrollbar">
          <ul className="flex gap-3 min-w-full pr-2">
            {quickLinks.map((l) => (
              <li key={l.slug} className="min-w-[16rem]">
                <Link href={`/measure/${l.slug}`} className="block focus-ring rounded-2xl">
                  <Card className="p-4 transition hover:bg-[var(--cp-surface-2)]">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-[var(--cp-text)]">{l.label}</div>
                      <Badge variant="neutral">Demo</Badge>
                    </div>
                    <div className="mt-2 text-xs text-[var(--cp-muted)]">Open a sample measure card.</div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}


