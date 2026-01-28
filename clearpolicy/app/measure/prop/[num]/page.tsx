import dynamicImport from "next/dynamic";
import { Card } from "@/components/ui";
import { headers } from "next/headers";
import { generateSummary } from "@/lib/ai";

const ProvisionalCard = dynamicImport(() => import("@/components/ProvisionalCard"), { ssr: false });
const ZipPanel = dynamicImport(() => import("@/components/ZipPanel"), { ssr: false });

export const dynamic = "force-dynamic";

export default async function PropositionPage({
  params,
  searchParams,
}: {
  params: { num: string };
  searchParams: { year?: string };
}) {
  const n = String(params.num || "").replace(/[^0-9]/g, "");
  if (!n) {
    return <Card className="text-sm text-[var(--cp-muted)]">Missing proposition number.</Card>;
  }
  const year = String(searchParams?.year || "").replace(/[^0-9]/g, "");

  const hdrs = headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const base = host ? `${proto}://${host}` : "http://localhost:3000";
  const query = `California Proposition ${n}${year ? ` (${year})` : ""}`;
  const fetchJson = async (url: string) => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  };
  const propUrl = `${base}/api/prop/${encodeURIComponent(n)}${year ? `?year=${encodeURIComponent(year)}` : ""}`;
  const [searchRes, propRes] = await Promise.all([
    fetchJson(`${base}/api/search?q=${encodeURIComponent(query)}`),
    fetchJson(propUrl),
  ]);
  const fallbacks = Array.isArray(searchRes?.fallbacks) ? searchRes.fallbacks : [];
  const bp = propRes?.sources?.ballotpedia as string | null;
  let seed = propRes;
  if (!seed?.levels) {
    const fallbackSummary = await generateSummary({
      title: query,
      content: `${query}.`,
      subjects: propRes?.tags || propRes?.topics || [],
      identifier: `Prop ${n}`,
      type: "proposition",
    });
    seed = { ...fallbackSummary, year: fallbackSummary.year };
  }
  const localContext = {
    source: "seeded" as const,
    jurisdiction: "CA" as const,
    title: `California Proposition ${n}${seed?.year ? ` (${seed.year})` : year ? ` (${year})` : ""}`,
    subjects: propRes?.tags || propRes?.topics || [],
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2.2fr,1fr]">
      <div className="space-y-6">
        <Card>
          <h1 className="page-title">
            California Proposition {n} {propRes?.year ? <span className="text-[var(--cp-muted)] font-normal">({propRes.year})</span> : ""}
          </h1>
          <p className="mt-1 text-sm text-[var(--cp-muted)]">Provisional in-app summary with trusted sources.</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--cp-muted)]">
            {bp && (<a className="inline-link" href={bp} target="_blank" rel="noreferrer noopener">Ballotpedia</a>)}
            <a className="inline-link" href="https://lao.ca.gov/BallotAnalysis/Propositions" target="_blank" rel="noreferrer noopener">LAO</a>
            <a className="inline-link" href="https://leginfo.legislature.ca.gov/" target="_blank" rel="noreferrer noopener">LegInfo</a>
          </div>
        </Card>
        <ProvisionalCard
          query={query}
          fallbacks={fallbacks}
          seed={{
            tldr: seed?.tldr,
            whatItDoes: seed?.whatItDoes,
            pros: seed?.pros,
            cons: seed?.cons,
            year: seed?.year,
            levels: seed?.levels,
            citations: seed?.citations,
          }}
        />
      </div>
      <div className="space-y-6">
        <ZipPanel context={localContext} />
      </div>
    </div>
  );
}


