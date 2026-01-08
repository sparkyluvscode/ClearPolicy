import { prisma } from "@/lib/prisma";
import InteractiveSummary from "@/components/InteractiveSummary";
import ZipPanel from "@/components/ZipPanel";
import { Suspense } from "react";
import TourOverlay from "@/components/TourOverlay";

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
        <div className="card p-6">
          <h1 className="text-xl font-semibold text-gray-100 dark:text-gray-900">Measure not found</h1>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-600">The measure you're looking for doesn't exist.</p>
        </div>
      );
    }
    
    if (!measure.summaries || measure.summaries.length === 0) {
      return (
        <div className="card p-6">
          <h1 className="text-xl font-semibold text-gray-100 dark:text-gray-900">{measure.number} — {measure.title}</h1>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-600">No summaries available for this measure.</p>
        </div>
      );
    }

    // Default to 12th reading level summary
    const summary12 = measure.summaries.find((s) => s.level === "12") || measure.summaries[0];

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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TourOverlay />
        <div className="lg:col-span-2 space-y-4">
          <header className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-gray-100 dark:text-gray-900">{measure.number} — {measure.title}</h1>
                {measure.status && <p className="mt-1 text-sm text-gray-400 dark:text-gray-600">{measure.status}</p>}
              </div>
            </div>
            {/* Client area: level toggle + dynamic card */}
            <Suspense fallback={<div className="mt-4 text-sm text-gray-400">Loading summary...</div>}>
              <InteractiveSummary summaries={summariesWithCitations} />
            </Suspense>
          </header>
          <div className="sr-only">{summary12?.tldr}</div>
        </div>
        <div>
          <ZipPanel />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading measure:", error);
    return (
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-gray-100 dark:text-gray-900">Error loading measure</h1>
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-600">There was an error loading this measure. Please try again later.</p>
      </div>
    );
  }
}

// client logic moved to components/InteractiveSummary


