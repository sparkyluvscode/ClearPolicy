import { prisma } from "@/lib/prisma";
import InteractiveSummary from "@/components/InteractiveSummary";
import ZipPanel from "@/components/ZipPanel";
import { Suspense } from "react";
import TourOverlay from "@/components/TourOverlay";
import { Card } from "@/components/ui";

async function getData(slug: string) {
  try {
    const measure = await prisma.measure.findUnique({
      where: { slug },
      include: { summaries: true, sources: true },
    });
    return measure;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

export default async function MeasurePage({ params }: { params: { slug: string } }) {
  try {
    const measure = await getData(params.slug);
    if (!measure) {
      return (
        <Card>
          <h1 className="text-xl font-semibold text-[var(--cp-text)]">Measure not found</h1>
          <p className="mt-2 text-sm text-[var(--cp-muted)]">The measure you&apos;re looking for doesn&apos;t exist.</p>
        </Card>
      );
    }
    
    if (!measure.summaries || measure.summaries.length === 0) {
      return (
        <Card>
          <h1 className="text-xl font-semibold text-[var(--cp-text)]">{measure.number} — {measure.title}</h1>
          <p className="mt-2 text-sm text-[var(--cp-muted)]">No summaries available for this measure.</p>
        </Card>
      );
    }

    // Default to 12th reading level summary
    const summary12 = measure.summaries.find((s) => s.level === "12") || measure.summaries[0];
    const localContext = {
      source: "seeded" as const,
      jurisdiction: "CA" as const,
      title: `${measure.number} — ${measure.title}`,
    };

    // Parse citations for all summaries
    const summariesWithCitations = measure.summaries.map((s: any) => ({
      ...s,
      citations: (() => {
        try {
          return JSON.parse(s.citations || "[]");
        } catch {
          return [];
        }
      })(),
    }));

    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2.2fr,1fr]">
        <TourOverlay />
        <div className="space-y-6">
          <Card>
            <div className="space-y-2">
              <h1 className="page-title" data-testid="measure-title">{measure.number} — {measure.title}</h1>
              {measure.status && <p className="text-sm text-[var(--cp-muted)]">{measure.status}</p>}
            </div>
          </Card>
          <Suspense fallback={<div className="text-sm text-[var(--cp-muted)]">Loading summary...</div>}>
            <InteractiveSummary summaries={summariesWithCitations} />
          </Suspense>
          <div className="sr-only">{summary12?.tldr}</div>
        </div>
        <div className="space-y-6">
          <ZipPanel context={localContext} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading measure:", error);
    return (
      <Card>
        <h1 className="text-xl font-semibold text-[var(--cp-text)]">Error loading measure</h1>
        <p className="mt-2 text-sm text-[var(--cp-muted)]">There was an error loading this measure. Please try again later.</p>
      </Card>
    );
  }
}

// client logic moved to components/InteractiveSummary


