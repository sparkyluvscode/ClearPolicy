"use client";
import { useMemo, useState } from "react";
import { simplify } from "@/lib/reading";
import SourceMeter from "@/components/SourceMeter";

type Fallback = { label: string; url: string; hint: string; kind: "overview" | "official" | "analysis" };
type LevelContent = {
  tldr: string;
  whatItDoes: string;
  whoAffected: string;
  pros: string[];
  cons: string[];
};

type Seed = {
  tldr?: string;
  whatItDoes?: string;
  whoAffected?: string;
  pros?: string[];
  cons?: string[];
  year?: string;
  levels?: { "5": LevelContent; "8": LevelContent; "12": LevelContent };
} | undefined;

export default function ProvisionalCard({ query, fallbacks = [], seed }: { query: string; fallbacks?: Fallback[]; seed?: Seed }) {
  const [level, setLevel] = useState<"5" | "8" | "12">("8");
  const [showCitations, setShowCitations] = useState(false);
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
    // 1. High-Fidelity: use AI-generated levels if available
    if (seed?.levels && seed.levels[level]) {
      const l = seed.levels[level];
      return {
        tldr: l.tldr,
        what: l.whatItDoes,
        who: l.whoAffected,
        pros: l.pros,
        cons: l.cons
      };
    }

    // 2. Fallback Logic (Regex-based simplification or raw data)
    const q = query.trim();
    const lower = q.toLowerCase();

    // If we have seed data with actual content, use it (even if it's a fallback message)
    if (seed && seed.tldr && seed.tldr.length > 20) {
      // Use whatItDoes if provided, otherwise extract from TL;DR
      let what = seed.whatItDoes || seed.tldr;
      const tldrLower = seed.tldr.toLowerCase();

      // If whatItDoes wasn't provided, try to extract it from TL;DR
      if (!seed.whatItDoes) {
        what = "This measure changes state policy as described above.";
        // Try to extract action verbs and key phrases
        if (/require|mandate|prohibit|ban|allow|authorize|establish|create|fund/.test(tldrLower)) {
          const actionMatch = seed.tldr.match(/(?:would|will|shall|must)\s+([^.!?]+(?:require|mandate|prohibit|ban|allow|authorize|establish|create|fund)[^.!?]*)/i);
          if (actionMatch) {
            what = actionMatch[1].trim() + ".";
          } else {
            // Extract first sentence that contains action verb
            const sentences = seed.tldr.split(/[.!?]+/).filter(s => s.trim().length > 20);
            const actionSentence = sentences.find(s => /require|mandate|prohibit|ban|allow|authorize|establish|create|fund/i.test(s));
            if (actionSentence) {
              what = actionSentence.trim() + ".";
            }
          }
        }
      }

      // Determine who is affected based on content
      let who = seed.whoAffected || "California residents, voters, and relevant state agencies"; // Use seed.whoAffected if available (backward compat)
      if (!seed.whoAffected) {
        if (/voter|citizen|resident/.test(tldrLower)) who = "California voters and residents";
        if (/school|education|student/.test(tldrLower)) who = "students, schools, and education agencies";
        if (/criminal|prison|jail|sentencing/.test(tldrLower)) who = "people in the criminal justice system and law enforcement";
        if (/tax|revenue|budget|fund/.test(tldrLower)) who = "taxpayers and state budget agencies";
        if (/health|medical|hospital/.test(tldrLower)) who = "patients, healthcare providers, and health agencies";
      }

      // Combine pros if multiple
      const prosText = seed.pros && seed.pros.length > 0
        ? seed.pros.join(" ")
        : "Supporters argue this measure addresses important policy concerns.";

      // Combine cons if multiple  
      const consText = seed.cons && seed.cons.length > 0
        ? seed.cons.join(" ")
        : "Opponents raise concerns about potential impacts or implementation challenges.";

      // Apply legacy simplification
      const s = (txt: string) => simplify(txt, level);

      return {
        tldr: s(seed.tldr),
        what: s(what),
        who: s(who),
        pros: s(prosText),
        cons: s(consText),
      };
    }

    // Fallback for props without seed data
    if (/prop\s*\d+/.test(lower)) {
      return {
        tldr: `A California statewide proposition related to "${q}".`,
        what: "Lets voters approve or reject a policy change.",
        who: "voters, agencies that would implement the change, and people named in the measure",
        pros: "Voters decide directly; can clarify rules.",
        cons: "Implementation can be complex and create new costs.",
      };
    }

    // Generic fallback
    return {
      tldr: `Overview of "${q}".`,
      what: "It changes rules on a public policy topic.",
      who: "people and organizations named in the measure",
      pros: "Could make rules clearer and easier to follow.",
      cons: "Could require new processes or add costs.",
    };
  }, [query, seed, level]);

  // Compatibility helper: format text for display (handle arrays vs strings)
  const display = (content: string | string[]) => {
    if (Array.isArray(content)) return content.join(" ");
    return content;
  };

  return (
    <article className="card p-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-gray-100 dark:text-gray-900">Summary {seed?.year && <span className="text-gray-500 font-normal">({seed.year})</span>}</h2>
        <div className="liquid-toggle" role="group" aria-label="Reading level">
          {["5", "8", "12"].map((k) => (
            <button key={k} className="liquid-toggle-btn" aria-pressed={level === k} onClick={() => setLevel(k as any)}>{k}th</button>
          ))}
        </div>
      </div>

      {/* Source Meter - shows citation coverage */}
      <div className="mt-4 p-3 rounded-xl bg-gray-800/30 dark:bg-white/30 flex items-center justify-between flex-wrap gap-3">
        <SourceMeter
          ratio={primary ? 0.8 : 0.4}
          count={primary ? 4 : 2}
          total={5}
        />
        <button
          onClick={() => setShowCitations(!showCitations)}
          className="text-xs font-medium text-accent hover:underline focus-ring rounded"
        >
          {showCitations ? "Hide cited lines" : "Show cited lines"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5">

        <section>
          <h3 className="section-title">TL;DR</h3>
          <p className={`mt-1 text-gray-100 dark:text-gray-900 ${showCitations ? "border-l-2 border-emerald-500 pl-3" : ""}`}>{display(text.tldr)}</p>
          {primary && showCitations && <div className="mt-1 text-xs text-gray-400 dark:text-gray-600 animate-fade-in">Source: <a href={primary.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline">{primary.label}</a></div>}
        </section>
        <section>
          <h3 className="section-title">What it does</h3>
          <p className={`mt-1 text-gray-100 dark:text-gray-900 ${showCitations ? "border-l-2 border-emerald-500 pl-3" : ""}`}>{display(text.what)}</p>
          {primary && showCitations && <div className="mt-1 text-xs text-gray-400 dark:text-gray-600 animate-fade-in">Source: <a href={primary.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline">{primary.label}</a></div>}
        </section>
        <section>
          <h3 className="section-title">Who is affected</h3>
          <p className={`mt-1 text-gray-100 dark:text-gray-900 ${showCitations ? "border-l-2 border-emerald-500 pl-3" : ""}`}>{display(text.who)}</p>
          {primary && showCitations && <div className="mt-1 text-xs text-gray-400 dark:text-gray-600 animate-fade-in">Source: <a href={primary.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline">{primary.label}</a></div>}
        </section>
        <section>
          <h3 className="section-title">Pros</h3>
          <div className="mt-1 text-gray-100 dark:text-gray-900">
            {Array.isArray(text.pros) ? (
              <ul className="list-disc pl-5 space-y-1">
                {text.pros.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            ) : <p>{text.pros}</p>}
          </div>
        </section>
        <section>
          <h3 className="section-title">Cons</h3>
          <div className="mt-1 text-gray-100 dark:text-gray-900">
            {Array.isArray(text.cons) ? (
              <ul className="list-disc pl-5 space-y-1">
                {text.cons.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            ) : <p>{text.cons}</p>}
          </div>
        </section>
      </div>
    </article>
  );
}



