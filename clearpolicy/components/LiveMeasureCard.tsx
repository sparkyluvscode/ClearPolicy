"use client";
import { useMemo, useState } from "react";
import BillCard from "@/components/BillCard";
import { sourceRatioFrom } from "@/lib/citations";
import { simplify } from "@/lib/reading";
import ReadingLevelToggle from "@/components/ReadingLevelToggle";

export default function LiveMeasureCard({ payload }: { payload: any }) {
  const [level, setLevel] = useState<"5" | "8" | "12">("8");


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
    if (payload?.kind === "prop" && payload?.raw) {
      const raw = payload.raw;
      const title = raw?.title || raw?.identifier || "California Measure";
      
      // Use AI summary if available (generated server-side)
      if (payload?.aiSummary) {
        const ai = payload.aiSummary;
        const whoStake = stakeholdersFrom(
          Array.isArray(raw?.subject) ? raw.subject : (raw?.subject ? [raw.subject] : []),
          title
        );
        const whoAffected = ai.whoAffected || (whoStake ? `It affects ${whoStake}.` : "See official sources for details.");
        
        // Build citations
        const citations: { quote: string; sourceName: string; url: string; location?: "tldr" | "what" | "who" | "pros" | "cons" }[] = [];
        const primaryUrl = raw?.openstates_url || raw?.openstatesUrl || raw?.sources?.[0]?.url || "";
        if (raw?.extras?.impact_clause) {
          citations.push({ quote: raw.extras.impact_clause, sourceName: "Open States — impact clause", url: primaryUrl, location: "tldr" });
        }
        if (raw?.latest_action_description) {
          citations.push({ quote: pickPolicySentence(raw.latest_action_description), sourceName: "Open States — latest action", url: primaryUrl, location: "what" });
        }
        if (citations.length === 0) {
          citations.push({ quote: firstSentence(title), sourceName: "Open States", url: primaryUrl, location: "tldr" });
        }
        
        const blocks = [ai.tldr, ai.whatItDoes, whoAffected, ai.pros.join(" "), ai.cons.join(" ")];
        const sourceRatio = sourceRatioFrom(blocks, citations);
        const covered = new Set((citations || []).map((c) => c.location).filter(Boolean) as string[]).size;
        
        return {
          tldr: ai.tldr,
          whatItDoes: ai.whatItDoes,
          whoAffected: simplify(ai.whoAffected || whoAffected, level),
          pros: simplify(ai.pros.join(" "), level),
          cons: simplify(ai.cons.join(" "), level),
          sourceRatio,
          citations,
          sourceCount: covered,
          example: "",
        };
      }
      
      // Fallback to rule-based extraction if AI not available
      const subjectsRaw = raw?.subjects || raw?.subject || [];
      const subjectsArr = cleanTopics(
        Array.isArray(subjectsRaw) ? subjectsRaw : (subjectsRaw ? [subjectsRaw] : []),
        title
      );
      if (raw?.classification && Array.isArray(raw.classification)) {
        subjectsArr.push(...raw.classification.filter((c: string) => !subjectsArr.includes(c)));
      }
      const subjects = subjectsArr.join(", ") || "policy";
      const latestAction = (
        raw?.latest_action?.description ||
        raw?.latestAction?.text ||
        (typeof (raw as any)?.latest_action_description === "string" ? (raw as any).latest_action_description : "") ||
        raw?.actions?.[0]?.description ||
        raw?.actions?.[raw.actions.length - 1]?.description ||
        ""
      ).trim();
      const primaryUrl = raw?.openstates_url || raw?.openstatesUrl || raw?.sources?.[0]?.url || "";

      const abstract = raw?.abstracts?.[0]?.abstract || raw?.summary || raw?.extras?.summary || "";
      const impactClause = raw?.extras?.impact_clause || "";
      const actions = raw?.actions || [];
      const firstAction = actions.find((a: any) => a.description && a.description.length > 20)?.description || "";
      
      let tldr = "";
      if (impactClause && impactClause.length > 30) {
        const cleanImpact = impactClause.replace(/^An act to /i, "").replace(/, relating to .*$/i, "").trim();
        tldr = cleanImpact.length > 20 ? cleanImpact : impactClause.slice(0, 200);
      } else if (abstract && abstract.length > 30) {
        tldr = pickPolicySentence(abstract);
      } else if (firstAction && firstAction.length > 30) {
        tldr = pickPolicySentence(firstAction);
      } else if (latestAction && latestAction.length > 30) {
        tldr = pickPolicySentence(latestAction);
      } else if (title && subjectsArr.length > 0) {
        tldr = `${title}. Relates to ${subjectsArr.slice(0, 3).join(", ")}.`;
      } else if (title) {
        tldr = `${title}.`;
      } else {
        tldr = subjects ? `This measure updates rules related to ${subjects}.` : `No summary available; see source for details.`;
      }
      
      let whatItDoes = "";
      if (impactClause && impactClause.length > 30) {
        const cleanImpact = impactClause.replace(/^An act to /i, "It would ").replace(/^add Section/i, "add section").replace(/^amend/i, "amend");
        whatItDoes = cleanImpact.length > 20 ? cleanImpact : impactClause;
      } else if (abstract && abstract.length > 30) {
        whatItDoes = pickPolicySentence(abstract).replace(/^this measure/i, "It");
      } else if (firstAction && firstAction.length > 30) {
        whatItDoes = `Latest action: ${pickPolicySentence(firstAction)}`;
      } else if (latestAction && latestAction.length > 20) {
        whatItDoes = `Latest action: ${pickPolicySentence(latestAction)}`;
      } else if (title && subjectsArr.length > 0) {
        whatItDoes = `It addresses ${subjectsArr.slice(0, 2).join(" and ")} as described in the title: ${title}.`;
      } else {
        whatItDoes = title ? `${title}. See official source for details.` : `No summary available; see source for details.`;
      }
      const whoStake = stakeholdersFrom(subjectsArr, title);
      const whoAffected = whoStake ? `It affects ${whoStake}.` : (subjects ? `Groups involved: ${subjects}.` : `No summary available; see source for details.`);
      const pc = prosConsHeuristics(subjectsArr, title);
      const pros = pc.pros;
      const cons = pc.cons;

      // Build citations prioritizing substantive quotes (impact clause/abstract/summary/latest action)
      const citations: { quote: string; sourceName: string; url: string; location?: "tldr" | "what" | "who" | "pros" | "cons" }[] = [];
      if (impactClause) citations.push({ quote: impactClause, sourceName: "Open States — impact clause", url: primaryUrl || raw?.openstates_url || "", location: "tldr" });
      if (abstract) citations.push({ quote: pickPolicySentence(abstract), sourceName: "Open States — abstract", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "tldr" });
      if (latestAction) citations.push({ quote: pickPolicySentence(latestAction), sourceName: "Open States — latest action", url: primaryUrl || raw?.openstates_url || "", location: "what" });
      if (Array.isArray(raw?.sources)) {
        raw.sources.slice(0, 3).forEach((s: any) => {
          if (s?.url) citations.push({ quote: s.note || "See source for details.", sourceName: s.note || "Open States", url: s.url });
        });
      }
      if (citations.length === 0) citations.push({ quote: firstSentence(title), sourceName: "Open States", url: primaryUrl, location: "tldr" });
      const filtered = citations.filter((c) => c.url && !/^https?:\/\/openstates\.org\/?$/.test(c.url));
      const finalCitations = filtered.length ? filtered : citations;
      const blocks = [tldr, whatItDoes, whoAffected, pros, cons];
      const sourceRatio = sourceRatioFrom(blocks, finalCitations);
      const covered = new Set((finalCitations || []).map((c) => c.location).filter(Boolean) as string[]).size;

      // Create a simple impact example for kid-friendly mode
      const example = (() => {
        const t = `${subjectsArr.join(" ")} ${title}`.toLowerCase();
        if (/advertis/.test(t)) return "For example: ads for candidates would include a clear label about who paid for them.";
        if (/budget|fund|revenue/.test(t)) return "For example: money could be moved or tracked differently to protect key programs.";
        if (/theft|crime|sentenc/.test(t)) return "For example: the rules for punishment could change to focus on fairness and safety.";
        return "";
      })();

      // Apply reading level simplification
      return { 
        tldr: simplify(tldr, level), 
        whatItDoes: simplify(whatItDoes, level), 
        whoAffected: simplify(whoAffected, level), 
        pros: simplify(pros, level), 
        cons: simplify(cons, level), 
        sourceRatio, 
        citations: finalCitations, 
        sourceCount: covered, 
        example 
      };
    }
    if (payload?.kind === "bill" && payload?.raw) {
      const raw = payload.raw;
      const bill = raw?.bill || {};
      const title = bill?.title || bill?.number || "Federal Bill";
      const latest = bill?.latestAction?.text || bill?.latest_action?.text || "See official source";
      const congressUrl = bill?.congressdotgovUrl || "https://www.congress.gov/";
      const summaryText = bill?.summaries?.[0]?.text || "";
      const subjectsArr = (bill?.subjects || []).map((s: any) => s?.name || "");
      const typeStr = String((bill as any)?.type || "");
      const isResolution = /(h|s)\.?res/i.test(typeStr) || /^A\s+resolution/i.test(String(title));
      const cleanedTitle = String(title).replace(/^A\s+resolution\s+/i, "").replace(/\.$/, "").trim();
      const tldr = summaryText
        ? pickPolicySentence(summaryText)
        : (isResolution
            ? (cleanedTitle ? pickPolicySentence(`Recognizes or expresses the sense of the Senate on ${cleanedTitle}.`) : "Recognizes or expresses the sense of the Senate on a specific topic.")
            : (bill?.title ? `This bill addresses ${subjectsArr.slice(0, 5).join(", ") || "federal policy"}.` : `No summary available; see source for details.`)
          );
      const whatItDoes = isResolution
        ? (cleanedTitle ? `Expresses the Senate’s position: ${cleanedTitle}.` : `Expresses the Senate’s position on a topic.`)
        : (summaryText ? pickPolicySentence(summaryText) : pickPolicySentence(latest) || `No summary available; see source for details.`);
      const whoStake = stakeholdersFrom(subjectsArr, title);
      const whoAffected = whoStake ? `It affects ${whoStake}.` : (subjectsArr.length ? `Groups involved: ${subjectsArr.slice(0, 5).join(", ")}.` : `No summary available; see source for details.`);
      const pc = prosConsHeuristics(subjectsArr, title);
      const pros = pc.pros;
      const cons = pc.cons;
      const citations: { quote: string; sourceName: string; url: string; location?: "tldr" | "what" | "who" | "pros" | "cons" }[] = [];
      if (summaryText) citations.push({ quote: pickPolicySentence(summaryText), sourceName: "Congress.gov — summary", url: congressUrl, location: "tldr" });
      citations.push({ quote: pickPolicySentence(latest), sourceName: "Congress.gov — latest action", url: congressUrl, location: "what" });
      if (subjectsArr.length) citations.push({ quote: `Subjects: ${subjectsArr.slice(0, 5).join(", ")}`, sourceName: "Congress.gov — subjects", url: congressUrl, location: "who" });
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
    // Debug: show what we received
    console.error("LiveMeasureCard: No summary computed", { 
      hasPayload: !!payload, 
      kind: payload?.kind, 
      hasRaw: !!payload?.raw,
      rawKeys: payload?.raw ? Object.keys(payload.raw) : []
    });
    return (
      <div className="card p-6 text-sm text-gray-400 dark:text-gray-600">
        <p>Unable to load live measure.</p>
        {payload?.error && <p className="mt-2 text-xs">Error: {payload.error}</p>}
        {!payload?.raw && <p className="mt-2 text-xs">No raw data available.</p>}
      </div>
    );
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


