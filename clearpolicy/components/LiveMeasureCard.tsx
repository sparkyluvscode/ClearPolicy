"use client";
import { useMemo, useState } from "react";
import BillCard from "@/components/BillCard";
import { sourceRatioFrom } from "@/lib/citations";
import { simplify } from "@/lib/reading";
import ReadingLevelToggle from "@/components/ReadingLevelToggle";

export default function LiveMeasureCard({ payload }: { payload: any }) {
  const [level, setLevel] = useState<"5" | "8" | "12">("8");

  // Basic adaptation: build a minimal SummaryLike from live payload
  const summary = useMemo(() => {
    const firstSentence = (text: string) => {
      if (!text) return "";
      const parts = text.split(/(?<=[.!?])\s+/);
      const s = parts[0] || text;
      return s.length > 220 ? s.slice(0, 220) + "…" : s;
    };
    const pickPolicySentence = (text: string) => {
      if (!text) return "";
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      const score = (s: string) => {
        const t = s.toLowerCase();
        let v = 0;
        if (/require|prohibit|allow|authorize|ban|fund|create|establish|amend|repeal/.test(t)) v += 3;
        if (/program|agency|department|committee|report|disclosure/.test(t)) v += 2;
        if (/effective|until|by\s+date|penalt|fine|fee|appropriat/.test(t)) v += 1;
        return v;
      };
      const best = sentences.reduce((a, b) => (score(b) > score(a) ? b : a), sentences[0] || "");
      return best || firstSentence(text);
    };
    const cleanTopics = (subjects: any, title?: string) => {
      const arr: string[] = Array.isArray(subjects)
        ? subjects.map((x) => (typeof x === "string" ? x : x?.name || "")).filter(Boolean)
        : [];
      const unique = Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
      return unique;
    };
    const stakeholdersFrom = (subjectsArr: string[], title: string) => {
      const text = `${subjectsArr.join(" ")} ${title}`.toLowerCase();
      const out: string[] = [];
      if (/school|education|student/.test(text)) out.push("students", "schools", "teachers");
      if (/voter|election|ballot|campaign/.test(text)) out.push("voters", "campaigns", "election officials");
      if (/canvass|certif|recount/.test(text)) out.push("county clerks", "registrars of voters");
      if (/tax|revenue|budget/.test(text)) out.push("taxpayers", "state agencies", "local governments");
      if (/health|medic/.test(text)) out.push("patients", "providers");
      if (/business|employer|worker|labor/.test(text)) out.push("businesses", "workers", "employers");
      if (/advertis/.test(text)) out.push("advertisers", "media platforms");
      if (/environment|climate|water|energy|wildlife/.test(text)) out.push("environmental agencies", "local communities");
      if (/criminal|penal|probation|parole|correction/.test(text)) out.push("people in the justice system", "law enforcement");
      if (/housing|tenant|landlord|zoning/.test(text)) out.push("tenants", "landlords", "local governments");
      if (/criminal|penal|probation|parole|correction/.test(text)) out.push("people in the justice system", "law enforcement");
      if (/housing|tenant|landlord|zoning/.test(text)) out.push("tenants", "landlords", "local governments");
      if (out.length === 0 && subjectsArr.length) out.push("groups mentioned in the measure");
      return Array.from(new Set(out)).join(", ");
    };
    const prosConsHeuristics = (subjectsArr: string[], title: string) => {
      const text = `${subjectsArr.join(" ")} ${title}`.toLowerCase();
      const pros: string[] = [];
      const cons: string[] = [];
      if (/election|canvass|certif|recount/.test(text)) {
        pros.push("Standardizes canvass and certification to improve accuracy and transparency.");
        cons.push("May raise workload or extend timelines for local election officials.");
      }
      if (/independent\s*contractor|gig|worker\s+classif/.test(text)) {
        pros.push("Expands worker protections and benefits by treating more workers as employees.");
        cons.push("Could reduce scheduling flexibility and increase costs for employers.");
      }
      // Named measures
      if (/\bab\s*257\b|fast\s*food/.test(text)) {
        pros.push("Improves wage and safety standards for fast‑food workers through a statewide council.");
        cons.push("Could raise costs for franchise owners and consumers; governance concerns.");
      }
      if (/\bsb\s*1383\b|family\s+leave|cfra/.test(text)) {
        pros.push("Expands job‑protected family leave to more workers at small employers.");
        cons.push("Small businesses may face staffing and cost pressures during leave periods.");
      }
      if (/budget\s*act|state\s+budget|appropriation/.test(text)) {
        pros.push("Provides fiscal stability and funds core programs like schools and safety.");
        cons.push("Trade‑offs may reduce flexibility or delay certain projects.");
      }
      if (/fair\s+sentencing\s+act/.test(text)) {
        pros.push("Reduces sentencing disparities; aims for fairer penalties.");
        cons.push("Some argue changes may not address broader public‑safety concerns.");
      }
      if (/campaign|advertis|disclosure|transparen/.test(text)) {
        pros.push("Improves transparency and disclosure for the public.");
        cons.push("May add compliance steps or costs for organizations.");
      }
      if (/crime|penal|sentenc|drug/.test(text)) {
        pros.push("Adjusts penalties with the goal of fairness or safety.");
        cons.push("Could affect deterrence or incarceration rates.");
      }
      if (/budget|tax|revenue/.test(text)) {
        pros.push("Clarifies fiscal rules and budgeting.");
        cons.push("May reduce flexibility or impact programs.");
      }
      if (pros.length === 0) pros.push("Clarifies rules in the affected topic.");
      if (cons.length === 0) cons.push("Could require new processes or resources.");
      return { pros: pros.join(" "), cons: cons.join(" ") };
    };
      const namedWhatWho = (title: string, subjectsArr: string[]) => {
      const t = `${title} ${subjectsArr.join(" ")}`.toLowerCase();
        if (/election|canvass|certif|recount/.test(t)) {
          return {
            what: "Updates procedures for official canvass and certification of election results.",
            who: "voters, campaigns, election officials, county clerks, registrars of voters",
            example: "For example: counties may follow a clearer, uniform checklist before certifying results.",
          };
        }
        if (/independent\s*contractor|gig|worker\s+classif|\bab\s*5\b/.test(t)) {
          return {
            what: "Classifies many contractors as employees using the ABC test, expanding wage and benefit protections.",
            who: "app‑based drivers, delivery workers, contractors, hiring businesses",
            example: "For example: drivers for an app could be treated like regular employees with benefits.",
          };
        }
      if (/\bab\s*257\b|fast\s*food/.test(t)) {
        return {
          what: "Creates a Fast Food Council to set wage and safety standards; increases worker protections across large chains.",
          who: "fast‑food workers, franchise owners, franchisors, consumers",
          example: "For example: rules could set a higher minimum wage and require safer kitchen practices.",
        };
      }
      if (/\bsb\s*1383\b|family\s+leave|cfra/.test(t)) {
        return {
          what: "Expands California Family Rights Act job‑protected leave to smaller employers and more family caregiving situations.",
          who: "workers, small employers, families, caregivers",
          example: "For example: a worker at a 10‑person company could take job‑protected time to care for a family member.",
        };
      }
      if (/budget\s*act|state\s+budget|appropriation/.test(t)) {
        return {
          what: "Sets the state’s annual spending plan and appropriations across education, health, safety, and infrastructure.",
          who: "taxpayers, state agencies, local programs, schools",
          example: "For example: funding levels for schools and public safety are approved for the year.",
        };
      }
      if (/fair\s+sentencing\s+act/.test(t)) {
        return {
          what: "Reduces the sentencing disparity between crack and powder cocaine offenses and adjusts penalties.",
          who: "defendants, courts, prosecutors, communities",
          example: "For example: people convicted under older rules may see fairer treatment under new standards.",
        };
      }
      return null;
    };
    if (payload?.kind === "prop" && payload?.raw) {
      const raw = payload.raw;
      const title = raw?.title || raw?.identifier || "California Measure";
      const subjectsArr = cleanTopics(raw?.subjects || raw?.subject || raw?.classification, title);
      const subjects = subjectsArr.join(", ") || "policy";
      const latestAction = (
        raw?.latest_action?.description ||
        raw?.latestAction?.text ||
        (typeof (raw as any)?.latest_action_description === "string" ? (raw as any).latest_action_description : "") ||
        raw?.actions?.[0]?.description ||
        ""
      ).trim();
      const primaryUrl = raw?.openstates_url || raw?.openstatesUrl || raw?.sources?.[0]?.url || "";

      // Try to synthesize helpful content using available fields
      const abstract = raw?.abstracts?.[0]?.abstract || raw?.summary || "";
      const named = namedWhatWho(title, subjectsArr);
      const tldr = abstract
        ? pickPolicySentence(abstract)
        : (named ? pickPolicySentence(named.what) : (subjects ? `This measure updates rules related to ${subjects}.` : `No summary available; see source for details.`));
      // Prefer concise, concrete statement of effect; fall back to latest action when no summary exists
      const whatItDoes = named?.what || (abstract
        ? pickPolicySentence(abstract).replace(/^this measure/i, "It")
        : (/election|canvass|certif|recount/i.test(`${title} ${subjectsArr.join(" ")}`)
          ? "Updates procedures for official canvass and certification of election results."
          : (latestAction ? `Latest action: ${pickPolicySentence(latestAction)}` : `No summary available; see source for details.`)));
      const whoStake = named?.who || stakeholdersFrom(subjectsArr, title);
      const whoAffected = whoStake ? (whoStake.startsWith("It ") ? whoStake : `It affects ${whoStake}.`) : (subjects ? `Groups involved: ${subjects}.` : `No summary available; see source for details.`);
      const pc = prosConsHeuristics(subjectsArr, title);
      const pros = pc.pros;
      const cons = pc.cons;

      // Build citations prioritizing substantive quotes (abstract/summary/latest action)
      const citations: { quote: string; sourceName: string; url: string; location?: "tldr" | "what" | "who" | "pros" | "cons" }[] = [];
      if (abstract) citations.push({ quote: pickPolicySentence(abstract), sourceName: "Open States — abstract", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "tldr" });
      if (latestAction) citations.push({ quote: pickPolicySentence(latestAction), sourceName: "Open States — latest action", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "what" });
      if (Array.isArray(raw?.sources)) {
        raw.sources.slice(0, 3).forEach((s: any) => {
          if (s?.url) citations.push({ quote: s.note || "See source for details.", sourceName: s.note || "Open States", url: s.url });
        });
      }
      // Named measure citations (official/analysis)
      try {
        const ab257 = /\bab\s*257\b/i.test(title);
        const sb1383 = /\bsb\s*1383\b/i.test(title);
        if (ab257) {
          const ident = "AB 257";
          const legInfo = `https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml?search_text=${encodeURIComponent(ident)}`;
          citations.push({ quote: "See bill analyses for stakeholder arguments.", sourceName: "CA LegInfo — analyses", url: legInfo, location: "pros" });
          citations.push({ quote: "See bill analyses for fiscal and implementation concerns.", sourceName: "CA LegInfo — analyses", url: legInfo, location: "cons" });
        }
        if (sb1383) {
          const ident = "SB 1383";
          const legInfo = `https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml?search_text=${encodeURIComponent(ident)}`;
          citations.push({ quote: "See committee analyses for employer/worker impacts.", sourceName: "CA LegInfo — analyses", url: legInfo, location: "who" });
          citations.push({ quote: "See committee analyses for arguments for and against.", sourceName: "CA LegInfo — analyses", url: legInfo, location: "pros" });
          citations.push({ quote: "See committee analyses for arguments for and against.", sourceName: "CA LegInfo — analyses", url: legInfo, location: "cons" });
        }
      } catch {}
      if (citations.length === 0) citations.push({ quote: firstSentence(title), sourceName: "Open States", url: primaryUrl, location: "tldr" });
      const filtered = citations.filter((c) => c.url && !/^https?:\/\/openstates\.org\/?$/.test(c.url));
      // Add helpful official links when we can infer them
      try {
        const ab = title.match(/\bAB\s*(\d{1,5})\b/i);
        const sb = title.match(/\bSB\s*(\d{1,5})\b/i);
        const num = ab?.[1] || sb?.[1];
        const billCode = ab ? `AB ${ab[1]}` : sb ? `SB ${sb[1]}` : null;
        if (num && billCode) {
          filtered.push({
            quote: `${billCode} on CA LegInfo`,
            sourceName: "CA LegInfo — bill page",
            url: `https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml?search_text=${encodeURIComponent(billCode)}`,
            location: "what",
          });
        }
        // Analysis links for AB 5 classification context
        const textLower = `${title} ${subjectsArr.join(" ")}`.toLowerCase();
        if (/independent\s*contractor|gig|worker\s+classif|\bab\s*5\b/.test(textLower)) {
          filtered.push({ quote: "Assembly Bill 5 background and analyses.", sourceName: "CA LegInfo — analyses", url: "https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml?search_text=AB%205", location: "pros" });
          filtered.push({ quote: "Assembly Bill 5 background and analyses.", sourceName: "CA LegInfo — analyses", url: "https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml?search_text=AB%205", location: "cons" });
          filtered.push({ quote: "Overview of AB 5 and worker classification.", sourceName: "Ballotpedia — AB 5 overview", url: "https://ballotpedia.org/California_Assembly_Bill_5_(2019)", location: "tldr" });
        }
        if (/budget\s*act/i.test(title)) {
          filtered.push({
            quote: "LAO budget analyses",
            sourceName: "LAO — Budget analyses",
            url: "https://lao.ca.gov/Budget",
            location: "pros",
          });
        }
      } catch {}
      const finalCitations = filtered.length ? filtered : citations;
      const blocks = [tldr, whatItDoes, whoAffected, pros, cons];
      const sourceRatio = sourceRatioFrom(blocks, finalCitations);
      const covered = new Set((finalCitations || []).map((c) => c.location).filter(Boolean) as string[]).size;

      // Create a simple impact example for kid-friendly mode
      const example = named?.example || (() => {
        const t = `${subjectsArr.join(" ")} ${title}`.toLowerCase();
        if (/advertis/.test(t)) return "For example: ads for candidates would include a clear label about who paid for them.";
        if (/budget|fund|revenue/.test(t)) return "For example: money could be moved or tracked differently to protect key programs.";
        if (/theft|crime|sentenc/.test(t)) return "For example: the rules for punishment could change to focus on fairness and safety.";
        return "";
      })();

      return { tldr, whatItDoes, whoAffected, pros, cons, sourceRatio, citations: finalCitations, sourceCount: covered, example };
    }
    if (payload?.kind === "bill" && payload?.raw) {
      const raw = payload.raw;
      const bill = raw?.bill || {};
      const title = bill?.title || bill?.number || "Federal Bill";
      const latest = bill?.latestAction?.text || bill?.latest_action?.text || "See official source";
      const congressUrl: string = String(bill?.congressdotgovUrl || "https://www.congress.gov/");
      const summaryText = bill?.summaries?.[0]?.text || "";
      const subjectsArr = (bill?.subjects || []).map((s: any) => s?.name || "");
      const named = namedWhatWho(title, subjectsArr);
      const tldr = summaryText ? pickPolicySentence(summaryText) : (bill?.title ? `This bill addresses ${subjectsArr.slice(0, 5).join(", ") || "federal policy"}.` : `No summary available; see source for details.`);
      const whatItDoes = named?.what || (summaryText ? pickPolicySentence(summaryText) : pickPolicySentence(latest) || `No summary available; see source for details.`);
      const whoStake = named?.who || stakeholdersFrom(subjectsArr, title);
      const whoAffected = whoStake ? `It affects ${whoStake}.` : (subjectsArr.length ? `Groups involved: ${subjectsArr.slice(0, 5).join(", ")}.` : `No summary available; see source for details.`);
      const pc = prosConsHeuristics(subjectsArr, title);
      const pros = pc.pros;
      const cons = pc.cons;
      type Loc = "tldr" | "what" | "who" | "pros" | "cons";
      type Cite = { quote: string; sourceName: string; url: string; location?: Loc };
      const citations: Cite[] = [];
      if (summaryText) citations.push({ quote: pickPolicySentence(summaryText), sourceName: "Congress.gov — summary", url: congressUrl, location: "tldr" });
      citations.push({ quote: pickPolicySentence(latest), sourceName: "Congress.gov — latest action", url: congressUrl, location: "what" });
      if (subjectsArr.length) citations.push({ quote: `Subjects: ${subjectsArr.slice(0, 5).join(", ")}`, sourceName: "Congress.gov — subjects", url: congressUrl, location: "who" });
      // Named federal measure citations
      try {
        const fsa = /fair\s+sentencing\s+act/i.test(title);
        if (fsa) {
          citations.push({ quote: "Overview and history.", sourceName: "GovTrack — overview", url: "https://www.govtrack.us/congress/bills/111/s1789", location: "pros" });
          citations.push({ quote: "Overview and history.", sourceName: "GovTrack — overview", url: "https://www.govtrack.us/congress/bills/111/s1789", location: "cons" });
        }
      } catch {}
      const blocks = [tldr, whatItDoes, whoAffected, pros, cons];
      const sourceRatio = sourceRatioFrom(blocks, citations);
      const covered = new Set((citations || []).map((c) => c.location).filter(Boolean) as string[]).size;
      const example = (() => {
        const t = `${subjectsArr.join(" ")} ${title}`.toLowerCase();
        if (/education|school/.test(t)) return "For example: schools could get more help for students who need it.";
        if (/energy|environment|water/.test(t)) return "For example: the state might set stronger rules to save water or power.";
        return "";
      })();
      return { tldr, whatItDoes, whoAffected, pros, cons, sourceRatio, citations, sourceCount: covered, example };
    }
    return null;
  }, [payload]);

  if (!summary) {
    return <div className="card p-6 text-sm text-gray-600 dark:text-gray-400">Unable to load live measure.</div>;
  }

  const limitedData = !payload?.raw || (summary?.citations?.length || 0) < 1;

  return (
    <div className="space-y-4">
      {limitedData && (
        <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-900" role="status" aria-live="polite">
          Some sections may be limited by available live data. See source links for full details.
        </div>
      )}
      <div className="flex justify-end">
        <ReadingLevelToggle level={level} onChange={setLevel} />
      </div>
      <BillCard data={summary as any} level={level} />
    </div>
  );
}


