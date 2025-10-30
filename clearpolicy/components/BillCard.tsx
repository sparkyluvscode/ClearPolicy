"use client";
import { useState } from "react";
import { simplify } from "@/lib/reading";
import CitedLine from "@/components/CitedLine";
import SourceMeter from "@/components/SourceMeter";

type Citation = { quote: string; sourceName: string; url: string; location?: "tldr" | "what" | "who" | "pros" | "cons" };
type SummaryLike = {
  tldr: string;
  whatItDoes: string;
  whoAffected: string;
  pros: string;
  cons: string;
  sourceRatio: number;
  citations: Citation[];
  sourceCount?: number;
  example?: string;
};

export default function BillCard({ data, level }: { data: SummaryLike; level: "5" | "8" | "12" }) {
  const [showCitations, setShowCitations] = useState(false);
  const firstFor = (loc: Citation["location"]) => data.citations?.find((c) => c.location === loc) || data.citations?.[0];
  const simple = (t: string) => (level === "5" ? (t ? `In simple words: ${t}` : t) : t);

  return (
    <article className="card p-5" aria-labelledby="billcard-heading">
      <div className="flex items-start justify-between gap-4">
        <h2 id="billcard-heading" className="text-xl font-semibold text-gray-900 dark:text-gray-100">Summary</h2>
        <SourceMeter ratio={data.sourceRatio} count={data.sourceCount} total={5} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5">
        <section>
          <h3 className="section-title">TL;DR</h3>
          <p className="mt-1 text-gray-900 dark:text-gray-100">{simple(simplify(data.tldr || "No TL;DR available; see sources below.", level))}</p>
          {firstFor("tldr") && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Source: <a href={firstFor("tldr")!.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline focus-ring rounded">{firstFor("tldr")!.sourceName}</a>
            </div>
          )}
        </section>
        <section>
          <h3 className="section-title">What it does</h3>
          <p className="mt-1 text-gray-900 dark:text-gray-100">{simple(simplify(data.whatItDoes || "No section summary available; see official source.", level))} {level === "5" && data.example ? `For example: ${data.example}` : ""}</p>
          {firstFor("what") && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Source: <a href={firstFor("what")!.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline focus-ring rounded">{firstFor("what")!.sourceName}</a>
            </div>
          )}
        </section>
        <section>
          <h3 className="section-title">Who is affected</h3>
          <p className="mt-1 text-gray-900 dark:text-gray-100">{simple(simplify(data.whoAffected || "No audience summary available; see official source.", level))}</p>
          {firstFor("who") && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Source: <a href={firstFor("who")!.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline focus-ring rounded">{firstFor("who")!.sourceName}</a>
            </div>
          )}
        </section>
        <section>
          <h3 className="section-title">Pros</h3>
          <p className="mt-1 text-gray-900 dark:text-gray-100">{simple(simplify(data.pros || "No stated benefits available from sources.", level))}</p>
          {firstFor("pros") && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Source: <a href={firstFor("pros")!.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline focus-ring rounded">{firstFor("pros")!.sourceName}</a>
            </div>
          )}
        </section>
        <section>
          <h3 className="section-title">Cons</h3>
          <p className="mt-1 text-gray-900 dark:text-gray-100">{simple(simplify(data.cons || "No stated drawbacks available from sources.", level))}</p>
          {firstFor("cons") && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Source: <a href={firstFor("cons")!.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline focus-ring rounded">{firstFor("cons")!.sourceName}</a>
            </div>
          )}
        </section>
        <section>
          <div className="flex items-center justify-between">
            <h3 className="section-title">Sources</h3>
            <button
              type="button"
              className="text-sm text-accent hover:underline focus-ring rounded"
              aria-expanded={showCitations}
              title="Show quoted lines from sources where available"
              onClick={() => setShowCitations((v) => !v)}
            >
              {showCitations ? "Hide cited lines" : "Show cited lines"}
            </button>
          </div>
          {/* Unique source list */}
          <ul className="mt-2 text-sm text-gray-800 dark:text-gray-200 list-disc list-inside">
            {[...new Map(data.citations.map((c) => [c.url, c])).values()].map((c, i) => {
              let host = "";
              try { host = new URL(c.url).hostname; } catch {}
              const officialHosts = [
                "openstates.org",
                "congress.gov",
                "leginfo.legislature.ca.gov",
                "senate.ca.gov",
                "assembly.ca.gov",
                "ca.gov",
              ];
              const isOfficial = officialHosts.some((h) => host.endsWith(h));
              const badge = isOfficial ? "Official" : host.endsWith("openstates.org") ? "Primary" : "Analysis";
              return (
                <li key={i}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel={isOfficial ? "noreferrer noopener" : "nofollow noreferrer noopener"}
                    className="text-accent hover:underline focus-ring rounded"
                    title={host ? host : undefined}
                  >
                    {c.sourceName}
                    {!isOfficial && host ? ` (${host})` : ""}
                  </a>
                  <span
                    className={
                      "ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] border " +
                      (isOfficial
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                        : badge === "Primary"
                        ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800"
                        : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700"
                      )
                    }
                    title={
                      badge === "Official" ? "Official government source (highest trust)" :
                      badge === "Primary" ? "Primary data source (Open States summary or record)" :
                      "Independent analysis or reporting"
                    }
                    aria-label={
                      badge === "Official" ? "Official government source" :
                      badge === "Primary" ? "Primary data source" :
                      "Independent analysis"
                    }
                  >{badge}</span>
                  {c.location ? <span className="text-gray-600 dark:text-gray-400"> — {c.location}</span> : null}
                </li>
              );
            })}
          </ul>
          {showCitations && (
            <div className="mt-2 space-y-3">
              {data.citations.length === 0 && (
                <p className="text-sm text-gray-600">No quoted lines available for this measure.</p>
              )}
              {data.citations.map((c, i) => (
                <CitedLine key={i} quote={(c.quote || "").trim() || "No direct quote available for this section."} url={c.url} sourceName={c.sourceName} location={c.location} />
              ))}
            </div>
          )}
        </section>
      </div>
    </article>
  );
}


