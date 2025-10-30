"use client";
import { useState, useMemo } from "react";
import ReadingLevelToggle from "@/components/ReadingLevelToggle";
import { simplify } from "@/lib/reading";
import WhyMissingModal from "@/components/WhyMissingModal";

type Fallback = { label: string; url: string; hint: string; kind: "overview" | "official" | "analysis" };

export default function ProvisionalCard({ query, fallbacks }: { query: string; fallbacks: Fallback[] }) {
  const [level, setLevel] = useState<"5" | "8" | "12">("8");
  const [why, setWhy] = useState(false);

  const badgeFor = (k: Fallback["kind"]) => k === "official" ? "Official" : k === "analysis" ? "Analysis" : "Overview";
  const primary = useMemo(() => {
    const off = fallbacks.find((f) => f.kind === "official");
    return off || fallbacks[0] || null;
  }, [fallbacks]);

  const sections = useMemo(() => {
    const q = query.trim();
    const lower = q.toLowerCase();
    // Named cases with tailored content
    if (/\bab\s*257\b|fast\s*food/.test(lower)) {
      return {
        tldr: "Creates a Fast Food Council to set wage and safety standards across large chains.",
        what: "Sets up a statewide council that can set minimum wage and safety rules for fast‑food workers.",
        who: "It affects fast‑food workers, franchise owners, franchisors, and customers.",
        pros: "Could raise wages and improve safety for workers.",
        cons: "Could raise costs for franchise owners and prices for customers.",
        example: "For example: rules could raise the minimum wage in fast‑food restaurants and require better protections."
      };
    }
    if (/\bsb\s*1383\b|family\s+leave|cfra/.test(lower)) {
      return {
        tldr: "Expands job‑protected family leave (CFRA) to more workers at smaller employers.",
        what: "Allows workers at small businesses to take job‑protected leave to care for family or bond with a new child.",
        who: "It affects workers, small employers, and families.",
        pros: "Helps workers care for family without losing their job.",
        cons: "Small employers may face staffing challenges and costs.",
        example: "For example: a worker at a 10‑person shop can take up to 12 weeks to care for a new child."
      };
    }
    if (/budget\s*act|state\s+budget|\b2023\s+budget\b/.test(lower)) {
      return {
        tldr: "Sets California’s annual spending plan and appropriations for the fiscal year.",
        what: "Approves funding levels across education, health, safety, infrastructure, and reserves.",
        who: "It affects taxpayers, state agencies, schools, and local programs.",
        pros: "Provides stability for core services and programs.",
        cons: "Trade‑offs may delay or reduce certain projects.",
        example: "For example: schools and public safety receive approved funding for the year."
      };
    }
    if (/fair\s+sentencing\s+act/.test(lower)) {
      return {
        tldr: "Reduces disparities in federal drug sentencing and adjusts penalties.",
        what: "Narrows the sentencing gap between crack and powder cocaine offenses; updates penalties.",
        who: "It affects defendants, courts, and communities.",
        pros: "Aims for fairer, more proportionate sentencing.",
        cons: "Some argue it may not address wider public‑safety concerns.",
        example: "For example: people sentenced under old rules may see fairer treatment under new standards."
      };
    }
    if (/election|canvass|certif|recount/.test(lower)) {
      return {
        tldr: "Updates procedures for the official canvass and certification of election results.",
        what: "Sets clearer steps and timelines for counties to verify, tally, and certify results.",
        who: "It affects voters, campaigns, county clerks, registrars of voters, and election officials.",
        pros: "Improves accuracy and transparency of results.",
        cons: "May increase workload or extend timelines for local offices.",
        example: "For example: counties may follow a uniform checklist before certification."
      };
    }
    if (/independent\s*contractor|gig|worker\s+classif|\bab\s*5\b/.test(lower)) {
      return {
        tldr: "Treats many contractors as employees using the ABC test, expanding benefits and protections.",
        what: "Requires businesses to classify certain workers as employees rather than independent contractors.",
        who: "It affects app‑based drivers, delivery workers, contractors, and hiring businesses.",
        pros: "Expands worker protections like minimum wage and benefits.",
        cons: "Could reduce flexibility and raise costs for employers.",
        example: "For example: drivers for an app could be treated like regular employees with benefits."
      };
    }
    const groups: string[] = [];
    if (/school|student|education|teacher/.test(lower)) groups.push("students", "schools", "teachers");
    if (/tax|budget|revenue|fund/.test(lower)) groups.push("taxpayers", "state agencies", "local governments");
    if (/crime|theft|penal|sentenc|public safety/.test(lower)) groups.push("people in the justice system", "law enforcement", "local communities");
    if (/health|care|medic|insurance/.test(lower)) groups.push("patients", "providers", "insurers");
    if (/business|employer|worker|labor/.test(lower)) groups.push("businesses", "workers", "employers");

    const who = groups.length ? `It affects ${Array.from(new Set(groups)).join(", ")}.` : "It affects people and organizations named in the measure.";

    const plainWhat = 
      /theft|retail/.test(lower) ? "It changes rules and penalties related to theft in stores." :
      /education|school/.test(lower) ? "It changes rules or funding for schools and student services." :
      /health|care|medic|insurance/.test(lower) ? "It changes rules for health coverage or services." :
      /tax|budget|revenue|fund/.test(lower) ? "It changes how public money can be raised, saved, or spent." :
      /energy|water|environment/.test(lower) ? "It changes rules to protect resources like water, air, or power." :
      "It changes rules on a public policy topic.";

    const example = 
      /education|school/.test(lower) ? "For example: schools could get more help or clearer rules for support." :
      /theft|crime|penal|sentenc/.test(lower) ? "For example: the consequences for shoplifting could change in your area." :
      /tax|budget|revenue|fund/.test(lower) ? "For example: money for local programs could be tracked or used differently." :
      /health|care|medic|insurance/.test(lower) ? "For example: people might get coverage differently or see new program rules." :
      "";

    const pros = 
      /transparen|disclos|advertis/.test(lower) ? "Improves transparency so people know who pays for messages." :
      /theft|crime|penal|sentenc/.test(lower) ? "Aims for fairer and clearer consequences and better safety." :
      /tax|budget|revenue|fund/.test(lower) ? "Clarifies money rules so programs are more stable and accountable." :
      "Could make rules clearer and easier to follow.";

    const cons = 
      /transparen|disclos|advertis/.test(lower) ? "Adds compliance steps and could increase admin costs." :
      /theft|crime|penal|sentenc/.test(lower) ? "May not reduce crime and could strain resources." :
      /tax|budget|revenue|fund/.test(lower) ? "Could reduce flexibility or slow funding for local needs." :
      "Could require new processes or add costs.";

    const tldr =
      /ab\s*5\b/.test(lower) ? "Reclassifies many gig workers as employees with benefits." :
      /affordable care act|aca\b/.test(lower) ? "Sets national standards for health insurance coverage and patient protections." :
      /national defense authorization act|ndaa\b/.test(lower) ? "Annual law that sets policies and budgets for U.S. defense." :
      /prop\s*\d+/.test(lower) ? "State ballot measure that changes a specific policy area for voters to decide." :
      `A law or measure about ${q}.`;
    return { tldr, what: plainWhat, who, pros, cons, example };
  }, [query]);

  const simple = (t: string) => (level === "5" ? (t ? `In simple words: ${t}` : t) : t);

  return (
    <article className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Summary</h2>
        <ReadingLevelToggle level={level} onChange={setLevel} />
      </div>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">ClearPolicy in‑app overview. We’ll expand details as more official data becomes available.</p>

      <div className="mt-4 grid grid-cols-1 gap-5">
        <section>
          <h3 className="section-title">TL;DR</h3>
          <p className="mt-1 text-gray-900 dark:text-gray-100">{simplify(sections.tldr, level)}</p>
          {primary && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Source: <a href={primary.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline focus-ring rounded">{primary.label}</a></div>
          )}
        </section>
        <section>
          <h3 className="section-title">What it does</h3>
          <p className="mt-1 text-gray-900 dark:text-gray-100">{simple(simplify(sections.what, level))} {level === "5" && sections.example ? `For example: ${sections.example}` : ""}</p>
          {primary && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Source: <a href={primary.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline focus-ring rounded">{primary.label}</a></div>
          )}
        </section>
        <section>
          <h3 className="section-title">Who is affected</h3>
          <p className="mt-1 text-gray-900 dark:text-gray-100">{simple(simplify(sections.who, level))}</p>
          {primary && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Source: <a href={primary.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline focus-ring rounded">{primary.label}</a></div>
          )}
        </section>
        <section>
          <h3 className="section-title">Pros</h3>
          <p className="mt-1 text-gray-900 dark:text-gray-100">{simple(simplify(sections.pros, level))}</p>
          {primary && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Source: <a href={primary.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline focus-ring rounded">{primary.label}</a></div>
          )}
        </section>
        <section>
          <h3 className="section-title">Cons</h3>
          <p className="mt-1 text-gray-900 dark:text-gray-100">{simple(simplify(sections.cons, level))}</p>
          {primary && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Source: <a href={primary.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline focus-ring rounded">{primary.label}</a></div>
          )}
        </section>

        <section>
          <h3 className="section-title">Sources</h3>
          <ul className="mt-2 text-sm text-gray-800 list-disc list-inside">
            {fallbacks.slice(0, 6).map((f, i) => (
              <li key={i}>
                <a href={f.url} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline focus-ring rounded">{f.label}</a>
                <span className={"ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] border " + (f.kind === "official" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : f.kind === "analysis" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-gray-100 text-gray-700 border-gray-200")} title={f.hint}>{f.kind === "official" ? "Official" : f.kind === "analysis" ? "Analysis" : "Overview"}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-3">
            <button type="button" className="text-xs text-accent hover:underline focus-ring rounded" onClick={() => setWhy(true)}>Why isn’t this full?</button>
            <a href="/about#trust" className="text-xs text-accent hover:underline focus-ring rounded">Why trust this?</a>
          </div>
        </section>
      </div>
      <WhyMissingModal open={why} onClose={() => setWhy(false)} />
    </article>
  );
}


