import ZipPanel from "@/components/ZipPanel";
import { headers } from "next/headers";
import dynamic from "next/dynamic";

const LiveMeasureCardClient = dynamic(() => import("@/components/LiveMeasureCard"), { ssr: false });
const TourOverlayClient = dynamic(() => import("@/components/TourOverlay"), { ssr: false });

export default async function LiveMeasurePage({ searchParams }: { searchParams: { source?: string; id?: string } }) {
  const source = searchParams.source as "os" | "congress" | undefined;
  const id = searchParams.id;
  if (!source || !id) {
    return (
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Measure</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Missing parameters. Try a new search or open a sample measure below.</p>
      </div>
    );
  }

  const hdrs = headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/measure?source=${source}&id=${encodeURIComponent(id)}`, { cache: "no-store" });
  const data = await res.json();

  const missing = !data || !!data.error || !data.raw;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <TourOverlayClient />
        <div className="card p-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{source === "os" ? "California Measure" : "Federal Bill"}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Live data</p>
        </div>
        {missing && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-900/40">
            Some details unavailable; see the source link for more.
          </div>
        )}
        <LiveMeasureCardClient payload={data} />
      </div>
      <div>
        <ZipPanel />
      </div>
    </div>
  );
}


