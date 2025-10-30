import dynamic from "next/dynamic";
import { headers } from "next/headers";

const ProvisionalCard = dynamic(() => import("@/components/ProvisionalCard"), { ssr: false });
const ZipPanel = dynamic(() => import("@/components/ZipPanel"), { ssr: false });

export default async function PropositionPage({ params }: { params: { num: string } }) {
  const n = String(params.num || "").replace(/[^0-9]/g, "");
  if (!n) {
    return <div className="card p-6 text-sm text-gray-600 dark:text-gray-400">Missing proposition number.</div>;
  }

  const hdrs = headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const base = `${proto}://${host}`;
  const query = `California Proposition ${n}`;
  const res = await fetch(`${base}/api/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
  const data = await res.json();
  const fallbacks = Array.isArray(data?.fallbacks) ? data.fallbacks : [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <header className="card p-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">California Proposition {n}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Provisional in‑app summary with trusted sources.</p>
        </header>
        <ProvisionalCard query={query} fallbacks={fallbacks} />
      </div>
      <div>
        <ZipPanel />
      </div>
    </div>
  );
}


