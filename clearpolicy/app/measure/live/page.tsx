import ZipPanel from "@/components/ZipPanel";
import { headers } from "next/headers";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui";

const LiveMeasureCardClient = dynamic(() => import("@/components/LiveMeasureCard"), { ssr: false });
const TourOverlayClient = dynamic(() => import("@/components/TourOverlay"), { ssr: false });

export default async function LiveMeasurePage({ searchParams }: { searchParams: { source?: string; id?: string } }) {
  const source = searchParams.source as "os" | "congress" | undefined;
  const id = searchParams.id;
  if (!source || !id) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-[var(--cp-text)]">Measure</h1>
        <p className="mt-2 text-sm text-[var(--cp-muted)]">Missing parameters. Try a new search or open a sample measure below.</p>
      </Card>
    );
  }

  const hdrs = headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/measure?source=${source}&id=${encodeURIComponent(id)}`, { cache: "no-store" });
  const data = await res.json();

  const missing = !data || !!data.error || !data.raw;
  const localContext = {
    source,
    jurisdiction: data?.jurisdiction || (source === "os" ? "CA" : "US"),
    title: source === "os"
      ? (data?.raw?.title || data?.raw?.identifier || "California measure")
      : (data?.raw?.bill?.title || data?.raw?.bill?.number || "Federal bill"),
    id,
    subjects: source === "os"
      ? (Array.isArray(data?.raw?.subjects) ? data.raw.subjects : (data?.raw?.subject ? [data.raw.subject] : []))
      : (Array.isArray(data?.raw?.bill?.subjects) ? data.raw.bill.subjects.map((s: any) => s?.name).filter(Boolean) : []),
    policyArea: source === "congress" ? data?.raw?.bill?.policyArea?.name : undefined,
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2.2fr,1fr]">
      <div className="space-y-6">
        <TourOverlayClient />
        <Card>
          <h1 className="page-title">
            {source === "os" ? "California Measure" : "Federal Bill"}
          </h1>
          <p className="mt-1 text-sm text-[var(--cp-muted)]">Live data</p>
        </Card>
        {missing && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            <div className="px-3 py-2">Some details unavailable; see the source link for more.</div>
          </div>
        )}
        <LiveMeasureCardClient payload={data} />
      </div>
      <div className="space-y-6">
        <ZipPanel contextId={source === "os" ? id : undefined} context={localContext} />
      </div>
    </div>
  );
}


