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
      const tldr = abstract
        ? pickPolicySentence(abstract)
        : (subjects ? `This measure updates rules related to ${subjects}.` : `No summary available; see source for details.`);
      // Prefer concise, concrete statement of effect; fall back to latest action when no summary exists
      const whatItDoes = abstract
        ? pickPolicySentence(abstract).replace(/^this measure/i, "It")
        : (latestAction ? `Latest action: ${pickPolicySentence(latestAction)}` : `No summary available; see source for details.`);
      const whoStake = stakeholdersFrom(subjectsArr, title);
      const whoAffected = whoStake ? `It affects ${whoStake}.` : (subjects ? `Groups involved: ${subjects}.` : `No summary available; see source for details.`);
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
      if (citations.length === 0) citations.push({ quote: firstSentence(title), sourceName: "Open States", url: primaryUrl, location: "tldr" });
      const filtered = citations.filter((c) => c.url && !/^https?:\/\/openstates\.org\/?$/.test(c.url));
      const finalCitations = filtered.length ? filtered : citations;
      const blocks = [tldr, whatItDoes, whoAffected, pros, cons];
      const sourceRatio = sourceRatioFrom(blocks, finalCitations);
      const covered = new Set((finalCitations || []).map((c) => c.location).filter(Boolean) as string[]).size;

      return { tldr, whatItDoes, whoAffected, pros, cons, sourceRatio, citations: finalCitations, sourceCount: covered };
    }
    if (payload?.kind === "bill" && payload?.raw) {
      const raw = payload.raw;
      const bill = raw?.bill || {};
      const title = bill?.title || bill?.number || "Federal Bill";
      const latest = bill?.latestAction?.text || bill?.latest_action?.text || "See official source";
      const congressUrl = bill?.congressdotgovUrl || "https://www.congress.gov/";
      const summaryText = bill?.summaries?.[0]?.text || "";
      const subjectsArr = (bill?.subjects || []).map((s: any) => s?.name || "");
      const tldr = summaryText ? pickPolicySentence(summaryText) : (bill?.title ? `This bill addresses ${subjectsArr.slice(0, 5).join(", ") || "federal policy"}.` : `No summary available; see source for details.`);
      const whatItDoes = summaryText ? pickPolicySentence(summaryText) : pickPolicySentence(latest) || `No summary available; see source for details.`;
      const whoStake = stakeholdersFrom(subjectsArr, title);
      const whoAffected = whoStake ? `It affects ${whoStake}.` : (subjectsArr.length ? `Groups involved: ${subjectsArr.slice(0, 5).join(", ")}.` : `No summary available; see source for details.`);
      const pc = prosConsHeuristics(subjectsArr, title);
      const pros = pc.pros;
      const cons = pc.cons;
      const citations = [
        ...(summaryText ? [{ quote: pickPolicySentence(summaryText), sourceName: "Congress.gov — summary", url: congressUrl, location: "tldr" as const }] : []),
        { quote: pickPolicySentence(latest), sourceName: "Congress.gov — latest action", url: congressUrl, location: "what" as const },
        ...(subjectsArr.length ? [{ quote: `Subjects: ${subjectsArr.slice(0, 5).join(", ")}`, sourceName: "Congress.gov — subjects", url: congressUrl, location: "who" as const }] : []),
      ];
      const blocks = [tldr, whatItDoes, whoAffected, pros, cons];
      const sourceRatio = sourceRatioFrom(blocks, citations);
      const covered = new Set((citations || []).map((c) => c.location).filter(Boolean) as string[]).size;
      return { tldr, whatItDoes, whoAffected, pros, cons, sourceRatio, citations, sourceCount: covered };
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


