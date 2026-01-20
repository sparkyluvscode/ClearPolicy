import dynamicImport from "next/dynamic";
import { Card } from "@/components/ui";

const ProvisionalCard = dynamicImport(() => import("@/components/ProvisionalCard"), { ssr: false });
const ZipPanel = dynamicImport(() => import("@/components/ZipPanel"), { ssr: false });

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  const maxProp = 99;
  return Array.from({ length: maxProp }, (_, i) => ({ num: String(i + 1) }));
}

export default async function PropositionPage({ params }: { params: { num: string } }) {
  const n = String(params.num || "").replace(/[^0-9]/g, "");
  if (!n) {
    return <Card className="text-sm text-[var(--cp-muted)]">Missing proposition number.</Card>;
  }

  const envBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL;
  const base = envBase
    ? (envBase.startsWith("http") ? envBase : `https://${envBase}`)
    : "http://localhost:3000";
  const query = `California Proposition ${n}`;
  const [searchRes, propRes] = await Promise.all([
    fetch(`${base}/api/search?q=${encodeURIComponent(query)}`, { cache: "force-cache" }).then(r => r.json()).catch(() => ({})),
    fetch(`${base}/api/prop/${encodeURIComponent(n)}`, { cache: "force-cache" }).then(r => r.json()).catch(() => ({})),
  ]);
  const fallbacks = Array.isArray(searchRes?.fallbacks) ? searchRes.fallbacks : [];
  const bp = propRes?.sources?.ballotpedia as string | null;
  const localContext = {
    source: "seeded" as const,
    jurisdiction: "CA" as const,
    title: `California Proposition ${n}${propRes?.year ? ` (${propRes.year})` : ""}`,
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
        <ProvisionalCard query={query} fallbacks={fallbacks} seed={{ tldr: propRes?.tldr, whatItDoes: propRes?.whatItDoes, pros: propRes?.pros, cons: propRes?.cons, year: propRes?.year, levels: propRes?.levels }} />
      </div>
      <div className="space-y-6">
        <ZipPanel context={localContext} />
      </div>
    </div>
  );
}


