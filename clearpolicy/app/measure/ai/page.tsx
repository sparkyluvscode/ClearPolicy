import { headers } from "next/headers";
import { Card } from "@/components/ui";
import ProvisionalCard from "@/components/ProvisionalCard";

export default async function AiMeasurePage({ searchParams }: { searchParams: { query?: string } }) {
  const query = (searchParams?.query || "").trim();
  if (!query) {
    return (
      <Card className="text-sm text-[var(--cp-muted)]">
        Missing query. Try a new search.
      </Card>
    );
  }

  const hdrs = headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
  const envBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL;
  const base = host
    ? `${proto}://${host}`
    : envBase
      ? (envBase.startsWith("http") ? envBase : `https://${envBase}`)
      : "http://localhost:3000";

  let seed = undefined;
  try {
    const res = await fetch(`${base}/api/ai-fallback?query=${encodeURIComponent(query)}`, { cache: "no-store" });
    const data = await res.json();
    seed = data?.levels ? data : undefined;
  } catch {
    seed = undefined;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2.2fr,1fr]">
      <div className="space-y-6">
        <Card>
          <h1 className="page-title">{query}</h1>
          <p className="mt-1 text-sm text-[var(--cp-muted)]">AI fallback summary</p>
        </Card>
        <ProvisionalCard query={query} fallbacks={[]} seed={seed as any} />
      </div>
      <div className="space-y-6">
        <Card className="text-sm text-[var(--cp-muted)]">
          We couldn&apos;t find a direct bill record for this query. This summary is generated to help you get oriented. Check official sources if available.
        </Card>
      </div>
    </div>
  );
}
