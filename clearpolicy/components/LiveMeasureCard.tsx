"use client";
import { useMemo, useState } from "react";
import BillCard from "@/components/BillCard";
import { sourceRatioFrom } from "@/lib/citations";
import ReadingLevelToggle from "@/components/ReadingLevelToggle";
import { Card, ToggleButton } from "@/components/ui";
import type { SummaryLike } from "@/lib/summary-types";

export default function LiveMeasureCard({ payload }: { payload: any }) {
  const [level, setLevel] = useState<"5" | "8" | "12">("8");
  const [evidenceMode, setEvidenceMode] = useState(false);


  const summary = useMemo((): SummaryLike | null => {
    const MAX_EVIDENCE_LEN = 600;
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
    const normalizeQuote = (text: string) => (text || "").replace(/\s+/g, " ").trim();
    const isSimilar = (a: string, b: string) => {
      if (!a || !b) return false;
      if (a === b) return true;
      const longer = a.length >= b.length ? a : b;
      const shorter = a.length >= b.length ? b : a;
      return longer.includes(shorter) && shorter.length / longer.length > 0.8;
    };
    const addEvidence = (
      list: { quote: string; sourceName: string; url?: string; location?: "tldr" | "what" | "who" | "pros" | "cons" }[],
      seen: string[],
      text: string,
      sourceName: string,
      url?: string,
      location?: "tldr" | "what" | "who" | "pros" | "cons"
    ) => {
      const cleaned = normalizeQuote(text);
      if (!cleaned || !/[a-z0-9]/i.test(cleaned)) return;
      const norm = cleaned.toLowerCase();
      if (seen.some((s) => isSimilar(s, norm))) return;
      seen.push(norm);
      const capped = cleaned.length > MAX_EVIDENCE_LEN ? `${cleaned.slice(0, MAX_EVIDENCE_LEN)}…` : cleaned;
      list.push({ quote: capped, sourceName, url, location });
    };
    const addEvidenceList = (
      list: { quote: string; sourceName: string; url?: string; location?: "tldr" | "what" | "who" | "pros" | "cons" }[],
      seen: string[],
      items: Array<{ text?: string; label: string; url?: string; location?: "tldr" | "what" | "who" | "pros" | "cons" }>
    ) => {
      items.forEach((item) => {
        if (!item?.text) return;
        addEvidence(list, seen, item.text, item.label, item.url, item.location);
      });
    };
    if (payload?.aiSummary?.levels) {
      const ai = payload.aiSummary.levels[level] || payload.aiSummary.levels["8"] || payload.aiSummary.levels["12"];
      const citations = Array.isArray(payload?.aiSummary?.citations) ? payload.aiSummary.citations : [];
      const blocks = [ai?.tldr, ai?.whatItDoes, ai?.whoAffected, (ai?.pros || []).join(" "), (ai?.cons || []).join(" ")];
      const sourceRatio = citations.length ? sourceRatioFrom(blocks, citations as any) : 0;
      const covered = new Set((citations || []).map((c: any) => c.location).filter(Boolean) as string[]).size;
      return {
        tldr: ai?.tldr || "",
        whatItDoes: ai?.whatItDoes || "",
        whoAffected: ai?.whoAffected || "",
        pros: Array.isArray(ai?.pros) ? ai.pros : ai?.pros ? [ai.pros] : [],
        cons: Array.isArray(ai?.cons) ? ai.cons : ai?.cons ? [ai.cons] : [],
        sourceRatio,
        citations,
        sourceCount: covered,
        example: "",
      };
    }
    if (payload?.kind === "prop" && payload?.raw) {
      const raw = payload.raw;
      const title = raw?.title || raw?.identifier || "California Measure";
      
      // Use AI summary if available (generated server-side)
      if (payload?.aiSummary?.levels) {
        const ai = payload.aiSummary.levels[level] || payload.aiSummary.levels["8"] || payload.aiSummary;
        const whoStake = stakeholdersFrom(
          Array.isArray(raw?.subject) ? raw.subject : (raw?.subject ? [raw.subject] : []),
          title
        );
        const whoAffected = ai.whoAffected || (whoStake ? `It affects ${whoStake}.` : "See official sources for details.");
        
        // Build citations
        const citations: { quote: string; sourceName: string; url?: string; location?: "tldr" | "what" | "who" | "pros" | "cons" }[] = [];
        const seen: string[] = [];
        const primaryUrl = raw?.openstates_url || raw?.openstatesUrl || raw?.sources?.[0]?.url || "";
        const aiCitations = Array.isArray(payload?.aiSummary?.citations) ? payload.aiSummary.citations : [];
        addEvidenceList(citations, seen, [
          { text: raw?.extras?.impact_clause, label: "Open States — impact clause", url: primaryUrl, location: "tldr" },
          { text: raw?.latest_action_description, label: "Open States — latest action", url: primaryUrl, location: "what" },
          { text: raw?.latest_action?.description, label: "Open States — latest action", url: primaryUrl, location: "what" },
          { text: raw?.latest_action?.text, label: "Open States — latest action", url: primaryUrl, location: "what" },
          { text: raw?.summary, label: "Open States — summary", url: primaryUrl, location: "tldr" },
          { text: raw?.summary_text, label: "Open States — summary", url: primaryUrl, location: "tldr" },
          { text: raw?.description, label: "Open States — description", url: primaryUrl, location: "tldr" },
          { text: raw?.purpose, label: "Open States — purpose", url: primaryUrl, location: "what" },
          { text: raw?.abstracts?.[0]?.abstract, label: "Open States — abstract", url: primaryUrl, location: "tldr" },
          { text: raw?.extras?.summary, label: "Open States — official summary", url: primaryUrl, location: "tldr" },
          { text: raw?.extras?.digest, label: "Open States — digest", url: primaryUrl, location: "tldr" },
          { text: raw?.extras?.official_summary, label: "Open States — official summary", url: primaryUrl, location: "tldr" },
          { text: raw?.extras?.analysis, label: "Open States — analysis", url: primaryUrl, location: "what" },
          { text: raw?.extras?.purpose, label: "Open States — purpose", url: primaryUrl, location: "what" },
          { text: raw?.extras?.fiscal_impact, label: "Open States — fiscal impact", url: primaryUrl, location: "what" },
          { text: raw?.extras?.fiscal_note, label: "Open States — fiscal note", url: primaryUrl, location: "what" },
          { text: raw?.short_title || raw?.shortTitle, label: "Open States — short title", url: primaryUrl, location: "tldr" },
          { text: title, label: "Open States — title", url: primaryUrl, location: "tldr" },
        ]);
        if (Array.isArray(raw?.subjects) && raw.subjects.length) {
          addEvidence(citations, seen, `Subjects: ${raw.subjects.slice(0, 12).join(", ")}`, "Open States — subjects", primaryUrl, "who");
        }
        if (Array.isArray(raw?.subject) && raw.subject.length) {
          addEvidence(citations, seen, `Subjects: ${raw.subject.slice(0, 12).join(", ")}`, "Open States — subjects", primaryUrl, "who");
        }
        if (Array.isArray(raw?.classification) && raw.classification.length) {
          addEvidence(citations, seen, `Classification: ${raw.classification.slice(0, 8).join(", ")}`, "Open States — classification", primaryUrl, "who");
        }
        if (Array.isArray(raw?.committees) && raw.committees.length) {
          addEvidence(citations, seen, `Committees: ${raw.committees.slice(0, 6).map((c: any) => c?.name || c).filter(Boolean).join(", ")}`, "Open States — committees", primaryUrl, "who");
        }
        if (Array.isArray(raw?.actions)) {
          raw.actions.slice(0, 4).forEach((a: any) => {
            addEvidence(citations, seen, a?.description, "Open States — action", primaryUrl, "what");
          });
        }
        if (citations.length === 0) {
          addEvidence(citations, seen, firstSentence(title), "Open States", primaryUrl, "tldr");
        }
        if (aiCitations.length) {
          aiCitations.forEach((c: any) => {
            addEvidence(citations, seen, c?.quote || "", c?.sourceName || "Official source", c?.url, c?.location);
          });
        }
        
        const blocks = [ai.tldr, ai.whatItDoes, whoAffected, ai.pros?.join(" ") || "", ai.cons?.join(" ") || ""];
        const sourceRatio = sourceRatioFrom(blocks, citations);
        const covered = new Set((citations || []).map((c) => c.location).filter(Boolean) as string[]).size;
        
        return {
          tldr: ai.tldr,
          whatItDoes: ai.whatItDoes,
          whoAffected: ai.whoAffected || whoAffected,
          pros: Array.isArray(ai.pros) ? ai.pros : ai.pros ? [ai.pros] : [],
          cons: Array.isArray(ai.cons) ? ai.cons : ai.cons ? [ai.cons] : [],
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

      // Build citations from available payload text
      const citations: { quote: string; sourceName: string; url?: string; location?: "tldr" | "what" | "who" | "pros" | "cons" }[] = [];
      const seen: string[] = [];
      addEvidenceList(citations, seen, [
        { text: impactClause, label: "Open States — impact clause", url: primaryUrl || raw?.openstates_url || "", location: "tldr" },
        { text: abstract, label: "Open States — abstract", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "tldr" },
        { text: raw?.summary, label: "Open States — summary", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "tldr" },
        { text: raw?.summary_text, label: "Open States — summary", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "tldr" },
        { text: raw?.description, label: "Open States — description", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "tldr" },
        { text: raw?.purpose, label: "Open States — purpose", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "what" },
        { text: raw?.extras?.summary, label: "Open States — official summary", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "tldr" },
        { text: raw?.extras?.digest, label: "Open States — digest", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "tldr" },
        { text: raw?.extras?.official_summary, label: "Open States — official summary", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "tldr" },
        { text: raw?.extras?.analysis, label: "Open States — analysis", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "what" },
        { text: raw?.extras?.purpose, label: "Open States — purpose", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "what" },
        { text: raw?.extras?.fiscal_impact, label: "Open States — fiscal impact", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "what" },
        { text: raw?.extras?.fiscal_note, label: "Open States — fiscal note", url: primaryUrl || raw?.sources?.[0]?.url || "", location: "what" },
        { text: latestAction, label: "Open States — latest action", url: primaryUrl || raw?.openstates_url || "", location: "what" },
        { text: title, label: "Open States — title", url: primaryUrl || raw?.openstates_url || "", location: "tldr" },
        { text: raw?.short_title || raw?.shortTitle, label: "Open States — short title", url: primaryUrl || raw?.openstates_url || "", location: "tldr" },
        { text: raw?.latest_action?.description, label: "Open States — latest action", url: primaryUrl || raw?.openstates_url || "", location: "what" },
        { text: raw?.latest_action_description, label: "Open States — latest action", url: primaryUrl || raw?.openstates_url || "", location: "what" },
      ]);
      if (subjectsArr.length) {
        addEvidence(citations, seen, `Subjects: ${subjectsArr.slice(0, 10).join(", ")}`, "Open States — subjects", primaryUrl || raw?.openstates_url || "", "who");
      }
      if (Array.isArray(raw?.subject) && raw.subject.length) {
        addEvidence(citations, seen, `Subjects: ${raw.subject.slice(0, 10).join(", ")}`, "Open States — subjects", primaryUrl || raw?.openstates_url || "", "who");
      }
      if (Array.isArray(raw?.classification) && raw.classification.length) {
        addEvidence(citations, seen, `Classification: ${raw.classification.slice(0, 8).join(", ")}`, "Open States — classification", primaryUrl || raw?.openstates_url || "", "who");
      }
      if (Array.isArray(raw?.committees) && raw.committees.length) {
        addEvidence(citations, seen, `Committees: ${raw.committees.slice(0, 6).map((c: any) => c?.name || c).filter(Boolean).join(", ")}`, "Open States — committees", primaryUrl || raw?.openstates_url || "", "who");
      }
      if (Array.isArray(raw?.actions)) {
        raw.actions.slice(0, 4).forEach((a: any) => {
          addEvidence(citations, seen, a?.description, "Open States — action", primaryUrl || raw?.openstates_url || "", "what");
        });
      }
      if (Array.isArray(raw?.sources)) {
        raw.sources.slice(0, 3).forEach((s: any) => {
          if (s?.url) {
            addEvidence(citations, seen, s.note || "See source for details.", s.note || "Open States — source", s.url);
          }
        });
      }
      if (citations.length === 0) addEvidence(citations, seen, firstSentence(title), "Open States", primaryUrl, "tldr");
      const filtered = citations.filter((c) => c.url && !/^https?:\/\/openstates\.org\/?$/.test(c.url));
      const ratioCitations = filtered.length ? filtered : citations;
      const blocks = [tldr, whatItDoes, whoAffected, pros, cons];
      const sourceRatio = sourceRatioFrom(blocks, ratioCitations);
      const covered = new Set((ratioCitations || []).map((c) => c.location).filter(Boolean) as string[]).size;

      // Create a simple impact example for kid-friendly mode
      const example = (() => {
        const t = `${subjectsArr.join(" ")} ${title}`.toLowerCase();
        if (/advertis/.test(t)) return "For example: ads for candidates would include a clear label about who paid for them.";
        if (/budget|fund|revenue/.test(t)) return "For example: money could be moved or tracked differently to protect key programs.";
        if (/theft|crime|sentenc/.test(t)) return "For example: the rules for punishment could change to focus on fairness and safety.";
        return "";
      })();

      return { 
        tldr, 
        whatItDoes, 
        whoAffected, 
        pros,
        cons,
        sourceRatio, 
        citations, 
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
      const subjectsArr = Array.isArray(bill?.subjects)
        ? bill.subjects.map((s: any) => s?.name || "")
        : [];
      const policyArea = bill?.policyArea?.name || "";
      const committees = Array.isArray(bill?.committees) ? bill.committees.map((c: any) => c?.name || "").filter(Boolean) : [];
      const actions = Array.isArray(bill?.actions) ? bill.actions : [];
      const textVersions = Array.isArray(bill?.textVersions) ? bill.textVersions : [];
      const typeStr = String((bill as any)?.type || "");
      const isResolution = /(h|s)\.?res/i.test(typeStr) || /^A\s+resolution/i.test(String(title));
      const cleanedTitle = String(title).replace(/^A\s+resolution\s+/i, "").replace(/\.$/, "").trim();
      const tldr = summaryText
        ? pickPolicySentence(summaryText)
        : (bill?.title
            ? (isResolution
                ? pickPolicySentence(cleanedTitle ? `Recognizes or expresses the sense of the Senate on ${cleanedTitle}.` : bill.title)
                : pickPolicySentence(bill.title))
            : (isResolution
                ? "Recognizes or expresses the sense of the Senate on a specific topic."
                : `No summary available; see source for details.`)
          );
      const whatItDoes = isResolution
        ? (cleanedTitle ? `Expresses the Senate’s position: ${cleanedTitle}.` : `Expresses the Senate’s position on a topic.`)
        : (summaryText ? pickPolicySentence(summaryText) : pickPolicySentence(latest) || `No summary available; see source for details.`);
      const whoStake = stakeholdersFrom(subjectsArr, title);
      const whoAffected = whoStake
        ? `It affects ${whoStake}.`
        : subjectsArr.length
          ? `Groups involved: ${subjectsArr.slice(0, 5).join(", ")}.`
          : "It may affect people or organizations connected to this topic.";
      const pc = prosConsHeuristics(subjectsArr, title);
      const pros = pc.pros;
      const cons = pc.cons;
      const citations: { quote: string; sourceName: string; url?: string; location?: "tldr" | "what" | "who" | "pros" | "cons" }[] = [];
      const seen: string[] = [];
      addEvidenceList(citations, seen, [
        { text: summaryText, label: "Congress.gov — summary", url: congressUrl, location: "tldr" },
        { text: bill?.summaries?.[1]?.text, label: "Congress.gov — summary", url: congressUrl, location: "tldr" },
        { text: bill?.summaries?.[2]?.text, label: "Congress.gov — summary", url: congressUrl, location: "tldr" },
        { text: bill?.summary?.text, label: "Congress.gov — summary", url: congressUrl, location: "tldr" },
        { text: latest, label: "Congress.gov — latest action", url: congressUrl, location: "what" },
        { text: bill?.latestAction?.text, label: "Congress.gov — latest action", url: congressUrl, location: "what" },
        { text: title, label: "Congress.gov — title", url: congressUrl, location: "tldr" },
        { text: bill?.shortTitle || bill?.short_title, label: "Congress.gov — short title", url: congressUrl, location: "tldr" },
        { text: bill?.description, label: "Congress.gov — description", url: congressUrl, location: "tldr" },
        { text: bill?.purpose, label: "Congress.gov — purpose", url: congressUrl, location: "what" },
      ]);
      if (Array.isArray(bill?.titles) && bill.titles.length) {
        const titleList = bill.titles
          .slice(0, 5)
          .map((t: any) => `${t?.titleType ? `${t.titleType}: ` : ""}${t?.title || ""}`.trim())
          .filter(Boolean)
          .join(" | ");
        addEvidence(citations, seen, titleList, "Congress.gov — titles", congressUrl, "tldr");
      }
      if (subjectsArr.length) {
        addEvidence(citations, seen, `Subjects: ${subjectsArr.slice(0, 10).join(", ")}`, "Congress.gov — subjects", congressUrl, "who");
      }
      if (policyArea) {
        addEvidence(citations, seen, `Policy area: ${policyArea}`, "Congress.gov — policy area", congressUrl, "who");
      }
      if (Array.isArray(bill?.sponsors) && bill.sponsors.length) {
        const sponsors = bill.sponsors
          .slice(0, 4)
          .map((s: any) => [s?.firstName, s?.lastName].filter(Boolean).join(" ").trim() || s?.name)
          .filter(Boolean)
          .join(", ");
        addEvidence(citations, seen, `Sponsors: ${sponsors}`, "Congress.gov — sponsors", congressUrl, "who");
      }
      if (committees.length) {
        addEvidence(citations, seen, `Committees: ${committees.slice(0, 6).join(", ")}`, "Congress.gov — committees", congressUrl, "who");
      }
      actions.slice(0, 4).forEach((a: any) => {
        addEvidence(citations, seen, a?.text || a?.description, "Congress.gov — action", congressUrl, "what");
      });
      if (textVersions.length) {
        const versions = textVersions
          .map((v: any) => [v?.type, v?.date].filter(Boolean).join(" "))
          .filter(Boolean)
          .join(", ");
        addEvidence(citations, seen, `Text versions: ${versions}`, "Congress.gov — text versions", congressUrl, "tldr");
      }
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
  }, [payload, level]);

  if (!summary) {
    // Debug: show what we received
    console.error("LiveMeasureCard: No summary computed", { 
      hasPayload: !!payload, 
      kind: payload?.kind, 
      hasRaw: !!payload?.raw,
      rawKeys: payload?.raw ? Object.keys(payload.raw) : []
    });
    return (
      <Card className="text-sm text-[var(--cp-muted)]">
        <p>Unable to load live measure.</p>
        {payload?.error && <p className="mt-2 text-xs">Error: {payload.error}</p>}
        {!payload?.raw && <p className="mt-2 text-xs">No raw data available.</p>}
      </Card>
    );
  }

  const limitedData = !payload?.raw || (summary?.citations?.length || 0) < 1;

  return (
    <div className="space-y-4">
      {limitedData && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100" role="status" aria-live="polite">
          <div className="px-3 py-2">
            Some sections may be limited by available live data. See source links for full details.
          </div>
        </div>
      )}
      <Card variant="subtle" className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--cp-muted)]">Reading level</div>
        <div className="flex flex-wrap items-center gap-2">
          <ReadingLevelToggle level={level} onChange={setLevel} />
          <ToggleButton
            pressed={evidenceMode}
            onPressedChange={setEvidenceMode}
            label="Evidence Mode (beta)"
            data-testid="evidence-toggle"
          />
        </div>
      </Card>
      <BillCard data={summary as any} level={level} evidenceMode={evidenceMode} />
    </div>
  );
}


