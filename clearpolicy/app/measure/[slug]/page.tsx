import { PrismaClient } from "@prisma/client";
import InteractiveSummary from "@/components/InteractiveSummary";
import ZipPanel from "@/components/ZipPanel";
import { Suspense } from "react";
import TourOverlay from "@/components/TourOverlay";

const prisma = new PrismaClient();

async function getData(slug: string) {
  const measure = await prisma.measure.findUnique({
    where: { slug },
    include: { summaries: true, sources: true },
  });
  return measure;
}

export default async function MeasurePage({ params }: { params: { slug: string } }) {
  const measure = await getData(params.slug);
  if (!measure) {
    return <div className="text-sm text-gray-600">Measure not found.</div>;
  }
  // Default to 12th reading level summary
  const summary12 = measure.summaries.find((s) => s.level === "12") || measure.summaries[0];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <TourOverlay />
      <div className="lg:col-span-2 space-y-4">
        <header className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{measure.number} — {measure.title}</h1>
              {measure.status && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{measure.status}</p>}
            </div>
            {/* Client area: level toggle + dynamic card */}
            <Suspense>
              {/* Parse citations JSON strings into arrays for the client component */}
              <InteractiveSummary summaries={(measure.summaries as any).map((s: any) => ({
                ...s,
                citations: (() => { try { return JSON.parse(s.citations); } catch { return []; } })(),
              }))} />
            </Suspense>
          </div>
        </header>
        <div className="sr-only">{summary12?.tldr}</div>
      </div>
      <div>
        <ZipPanel />
      </div>
    </div>
  );
}

// client logic moved to components/InteractiveSummary


