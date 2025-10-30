"use client";
import { useMemo, useState } from "react";

type Fallback = { label: string; url: string; hint: string; kind: "overview" | "official" | "analysis" };
type Seed = { tldr?: string; pros?: string[]; cons?: string[] } | undefined;

export default function ProvisionalCard({ query, fallbacks = [], seed }: { query: string; fallbacks?: Fallback[]; seed?: Seed }) {
  const [level, setLevel] = useState<"5" | "8" | "12">("8");
  const primary = useMemo(() => {
    // Prefer Ballotpedia/LAO analyses if present so sources are actually explanatory
    const byLabel = fallbacks.find((f) => /ballotpedia|lao/i.test(f.label));
    if (byLabel) return byLabel;
    const analysis = fallbacks.find((f) => f.kind === "analysis");
    if (analysis) return analysis;
    const overview = fallbacks.find((f) => f.kind === "overview");
    if (overview) return overview;
    return fallbacks.find((f) => f.kind === "official") || fallbacks[0] || null;
  }, [fallbacks]);

  const text = useMemo(() => {
    const q = query.trim();
    const lower = q.toLowerCase();
    if (seed && (seed.tldr || (seed.pros && seed.pros.length) || (seed.cons && seed.cons.length))) {
      return {
        tldr: seed.tldr || q,
        what: "Summarized from trusted sources.",
        who: "voters and groups named in the measure",
        pros: (seed.pros && seed.pros[0]) || "Supporters say it helps accountability.",
        cons: (seed.cons && seed.cons[0]) || "Opponents say it could have trade‑offs.",
      };
    }
    if (/prop\s*\d+/.test(lower)) {
      return {
        tldr: `A California statewide proposition related to “${q}”.`,
        what: "Lets voters approve or reject a policy change.",
        who: "voters, agencies that would implement the change, and people named in the measure",
        pros: "Voters decide directly; can clarify rules.",
        cons: "Implementation can be complex and create new costs.",
      };
    }
    return {
      tldr: `Overview of “${q}”.`,
      what: "It changes rules on a public policy topic.",
      who: "people and organizations named in the measure",
      pros: "Could make rules clearer and easier to follow.",
      cons: "Could require new processes or add costs.",
    };
  }, [query]);

  const simple = (s: string) => (level === "5" ? (s ? `In simple words: ${s}` : s) : s);

  return (
    <article className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-100 dark:text-gray-900">Summary</h2>
        <div className="liquid-toggle" role="group" aria-label="Reading level">
          {["5","8","12"].map((k) => (
            <button key={k} className="liquid-toggle-btn" aria-pressed={level===k} onClick={()=>setLevel(k as any)}>{k}th</button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-5">
        <section>
          <h3 className="section-title">TL;DR</h3>
          <p className="mt-1 text-gray-100 dark:text-gray-900">{simple(text.tldr)}</p>
          {primary && <div className="mt-1 text-xs text-gray-400 dark:text-gray-600">Source: <a href={primary.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline">{primary.label}</a></div>}
        </section>
        <section>
          <h3 className="section-title">What it does</h3>
          <p className="mt-1 text-gray-100 dark:text-gray-900">{simple(text.what)}</p>
          {primary && <div className="mt-1 text-xs text-gray-400 dark:text-gray-600">Source: <a href={primary.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline">{primary.label}</a></div>}
        </section>
        <section>
          <h3 className="section-title">Who is affected</h3>
          <p className="mt-1 text-gray-100 dark:text-gray-900">{simple(`It affects ${text.who}.`)}</p>
          {primary && <div className="mt-1 text-xs text-gray-400 dark:text-gray-600">Source: <a href={primary.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline">{primary.label}</a></div>}
        </section>
        <section>
          <h3 className="section-title">Pros</h3>
          <p className="mt-1 text-gray-100 dark:text-gray-900">{simple(text.pros)}</p>
        </section>
        <section>
          <h3 className="section-title">Cons</h3>
          <p className="mt-1 text-gray-100 dark:text-gray-900">{simple(text.cons)}</p>
        </section>
      </div>
    </article>
  );
}



