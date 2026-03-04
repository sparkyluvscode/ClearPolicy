import { NextRequest, NextResponse } from "next/server";
import { generateFollowUpAnswer } from "@/lib/policyEngine";
import { searchWeb, filterValidResults, formatWebContext } from "@/lib/web-search";
import { fetchGovData, formatGovContext, govBillsToSources } from "@/lib/gov-data";
import { classifyQuery } from "@/lib/omni-classifier";
import type { AnswerSection as OmniAnswerSection, Source } from "@/lib/omni-types";
import type { AnswerSource as PolicySource } from "@/lib/policy-types";

export const dynamic = "force-dynamic";

function mapFollowUpToSections(answer: Awaited<ReturnType<typeof generateFollowUpAnswer>>["answer"]): OmniAnswerSection[] {
  const sections: OmniAnswerSection[] = [];
  if (answer.sections.summary) {
    sections.push({
      heading: "Summary",
      content: answer.sections.summary,
      citations: [],
      confidence: "verified",
    });
  }
  if (answer.sections.keyProvisions?.length) {
    sections.push({
      heading: "Key points",
      content: answer.sections.keyProvisions.join("\n\n"),
      citations: [],
      confidence: "verified",
    });
  }
  if (answer.sections.argumentsFor?.length) {
    sections.push({
      heading: "Arguments for",
      content: answer.sections.argumentsFor.map((p) => p.trim()).filter(Boolean).join("\n"),
      citations: [],
      confidence: "inferred",
    });
  }
  if (answer.sections.argumentsAgainst?.length) {
    sections.push({
      heading: "Arguments against",
      content: answer.sections.argumentsAgainst.map((p) => p.trim()).filter(Boolean).join("\n"),
      citations: [],
      confidence: "inferred",
    });
  }
  if (sections.length === 0) {
    sections.push({
      heading: "Follow-up",
      content: answer.fullTextSummary,
      citations: [],
      confidence: "verified",
    });
  }
  return sections;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json({ success: false, error: "Missing query" }, { status: 400 });
    }
    const history = Array.isArray(body?.conversationHistory) ? body.conversationHistory : [];
    const persona = typeof body?.persona === "string" ? body.persona : null;

    // Gov Data First: classify follow-up and fetch gov data + web in parallel
    const classified = classifyQuery(query);
    const [govData, webSearchResults] = await Promise.all([
      fetchGovData({
        query,
        billId: classified.billId,
        state: classified.state,
        intent: classified.intent,
      }).catch(() => ({ bills: [] as any[], representatives: [] as any[], hadDirectBillLookup: false })),
      searchWeb(query, { maxResults: 4 }).catch(() => null),
    ]);
    const govSources = govBillsToSources(govData.bills);
    const rawWebResults = webSearchResults?.results ?? [];
    const validWebResults = filterValidResults(rawWebResults);

    // Unified sources: gov first, then web
    const unifiedSources: PolicySource[] = [];
    for (let i = 0; i < govSources.length; i++) {
      unifiedSources.push({ ...govSources[i], id: i + 1 });
    }
    const govCount = govSources.length;
    for (let i = 0; i < validWebResults.length; i++) {
      const r = validWebResults[i];
      let domain = "";
      try { domain = new URL(r.url).hostname.replace("www.", ""); } catch { domain = "source"; }
      unifiedSources.push({
        id: govCount + i + 1,
        title: r.title,
        url: r.url,
        domain,
        type: domain.endsWith(".gov") ? "Federal" : "Web",
        verified: true,
        excerpt: r.content?.slice(0, 300) || "",
      });
    }

    // Unified context string with consistent numbering
    const { text: govContextText, numberedCount: govNumberedCount } = formatGovContext(govData, 1);
    const webContextStr = formatWebContext(validWebResults, govNumberedCount + 1);
    const combinedContext = [govContextText, webContextStr].filter(Boolean).join("\n\n");

    const { answer, suggestions } = await generateFollowUpAnswer(
      query, history, persona,
      combinedContext || undefined,
      unifiedSources,
    );
    const sections = mapFollowUpToSections(answer);

    const sources: Source[] = answer.sources.map((s, i) => ({
      id: `fu-src-${i}`,
      type: s.type === "Federal" ? "federal_bill" as const : s.type === "State" ? "state_bill" as const : "government_site" as const,
      title: s.title,
      url: s.url,
      snippet: s.excerpt || s.title,
      publisher: s.domain,
      relevance: s.verified ? 1 : 0.8,
    }));

    return NextResponse.json({
      success: true,
      data: {
        heading: answer.policyName,
        cardType: "general",
        sections,
        followUpSuggestions: suggestions,
        sources,
      },
    });
  } catch (e) {
    console.error("[api/followup]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Follow-up failed" },
      { status: 500 }
    );
  }
}
