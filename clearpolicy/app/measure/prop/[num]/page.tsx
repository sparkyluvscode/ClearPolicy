import dynamic from "next/dynamic";
import { headers } from "next/headers";

const ProvisionalCard = dynamic(() => import("@/components/ProvisionalCard"), { ssr: false });
const ZipPanel = dynamic(() => import("@/components/ZipPanel"), { ssr: false });

export default async function PropositionPage({ params }: { params: { num: string } }) {
  const n = String(params.num || "").replace(/[^0-9]/g, "");
  if (!n) {
    return <div className="card p-6 text-sm text-gray-400 dark:text-gray-600">Missing proposition number.</div>;
  }

  const hdrs = headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const base = `${proto}://${host}`;
  const query = `California Proposition ${n}`;
  const [searchRes, propRes] = await Promise.all([
    fetch(`${base}/api/search?q=${encodeURIComponent(query)}`, { cache: "no-store" }).then(r=>r.json()).catch(()=>({})),
    fetch(`${base}/api/prop/${encodeURIComponent(n)}`, { cache: "no-store" }).then(r=>r.json()).catch(()=>({})),
  ]);
  const fallbacks = Array.isArray(searchRes?.fallbacks) ? searchRes.fallbacks : [];
  const bp = propRes?.sources?.ballotpedia as string | null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <header className="card p-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-indigo-200">California Proposition {n}</h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-600">Provisional in‑app summary with trusted sources.</p>
          <div className="mt-2 text-xs text-gray-400 dark:text-gray-600 flex gap-3">
            {bp && (<a className="text-accent hover:underline" href={bp} target="_blank" rel="noreferrer noopener">Ballotpedia</a>)}
            <a className="text-accent hover:underline" href="https://lao.ca.gov/BallotAnalysis/Propositions" target="_blank" rel="noreferrer noopener">LAO</a>
            <a className="text-accent hover:underline" href="https://leginfo.legislature.ca.gov/" target="_blank" rel="noreferrer noopener">LegInfo</a>
          </div>
        </header>
        <ProvisionalCard query={query} fallbacks={fallbacks} seed={{ tldr: propRes?.tldr, pros: propRes?.pros, cons: propRes?.cons }} />
      </div>
      <div>
        <ZipPanel />
      </div>
    </div>
  );
}


