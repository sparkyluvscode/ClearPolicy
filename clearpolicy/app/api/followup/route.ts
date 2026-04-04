import { NextRequest, NextResponse } from "next/server";
import { generateFollowUpAnswer } from "@/lib/policyEngine";
import { classifyFollowUpIntent, getDepthLevel, INTENT_LABELS } from "@/lib/followup-intent";
import { classifySource } from "@/lib/source-credibility";
import { searchWeb, filterValidResults, formatWebContext } from "@/lib/web-search";
import { fetchGovData, formatGovContext, govBillsToSources } from "@/lib/gov-data";
import { classifyQuery } from "@/lib/omni-classifier";
import type { AnswerSection as OmniAnswerSection, Source } from "@/lib/omni-types";
import type { AnswerSource as PolicySource, Answer } from "@/lib/policy-types";

export const dynamic = "force-dynamic";

function mapFollowUpToSections(answer: Answer, intent: string): OmniAnswerSection[] {
  const sections: OmniAnswerSection[] = [];
  const hasSources = (answer.sources?.length ?? 0) > 0;
  const baseConfidence = hasSources ? "verified" as const : "unverified" as const;

  if (intent === "more_data" && answer.sections.overview) {
    if (answer.sections.summary) {
      sections.push({
        heading: "Data Overview",
        content: answer.sections.summary,
        citations: [],
        confidence: baseConfidence,
      });
    }
    if (answer.sections.keyProvisions?.length) {
      sections.push({
        heading: "Key Statistics",
        content: answer.sections.keyProvisions.join("\n\n"),
        citations: [],
        confidence: baseConfidence,
      });
    }
    if (answer.sections.argumentsFor?.length) {
      sections.push({
        heading: "Economic Data",
        content: answer.sections.argumentsFor.map((p) => p.trim()).filter(Boolean).join("\n"),
        citations: [],
        confidence: hasSources ? "inferred" as const : "unverified" as const,
      });
    }
    if (answer.sections.argumentsAgainst?.length) {
      sections.push({
        heading: "Polling & Public Opinion",
        content: answer.sections.argumentsAgainst.map((p) => p.trim()).filter(Boolean).join("\n"),
        citations: [],
        confidence: hasSources ? "inferred" as const : "unverified" as const,
      });
    }
    if (answer.sections.overview) {
      sections.push({
        heading: "Additional Data Breakdown",
        content: answer.sections.overview,
        citations: [],
        confidence: hasSources ? "inferred" as const : "unverified" as const,
      });
    }
  } else {
    if (answer.sections.summary) {
      sections.push({
        heading: "Summary",
        content: answer.sections.summary,
        citations: [],
        confidence: baseConfidence,
      });
    }
    if (answer.sections.keyProvisions?.length) {
      sections.push({
        heading: "Key points",
        content: answer.sections.keyProvisions.join("\n\n"),
        citations: [],
        confidence: baseConfidence,
      });
    }
    if (answer.sections.argumentsFor?.length) {
      sections.push({
        heading: "Arguments for",
        content: answer.sections.argumentsFor.map((p) => p.trim()).filter(Boolean).join("\n"),
        citations: [],
        confidence: hasSources ? "inferred" as const : "unverified" as const,
      });
    }
    if (answer.sections.argumentsAgainst?.length) {
      sections.push({
        heading: "Arguments against",
        content: answer.sections.argumentsAgainst.map((p) => p.trim()).filter(Boolean).join("\n"),
        citations: [],
        confidence: hasSources ? "inferred" as const : "unverified" as const,
      });
    }
  }

  if (sections.length === 0) {
    sections.push({
      heading: "Follow-up",
      content: answer.fullTextSummary,
      citations: [],
      confidence: baseConfidence,
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

    const followUpIntent = classifyFollowUpIntent(query);
    const depthLevel = getDepthLevel(history.length);

    const classified = classifyQuery(query);
    const [govData, webSearchResults] = await Promise.all([
      fetchGovData({
        query,
        billId: classified.billId,
        state: classified.state,
        intent: classified.intent,
      }).catch(() => ({ bills: [] as any[], representatives: [] as any[], hadDirectBillLookup: false })),
      searchWeb(query, { maxResults: followUpIntent === "more_data" ? 8 : 4 }).catch(() => null),
    ]);
    const govSources = govBillsToSources(govData.bills);
    const rawWebResults = webSearchResults?.results ?? [];
    const validWebResults = filterValidResults(rawWebResults);

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

    const { text: govContextText, numberedCount: govNumberedCount } = formatGovContext(govData, 1);
    const webContextStr = formatWebContext(validWebResults, govNumberedCount + 1);
    const combinedContext = [govContextText, webContextStr].filter(Boolean).join("\n\n");

    const result = await generateFollowUpAnswer(
      query, history, persona,
      combinedContext || undefined,
      unifiedSources,
      followUpIntent,
      depthLevel,
    );
    const sections = mapFollowUpToSections(result.answer, result.intent);

    const sources: Source[] = result.answer.sources.map((s, i) => {
      const credibility = classifySource(s.url, s.title);
      return {
        id: `fu-src-${i}`,
        type: s.type === "Federal" ? "federal_bill" as const : s.type === "State" ? "state_bill" as const : "government_site" as const,
        title: s.title,
        url: s.url,
        snippet: s.excerpt || s.title,
        publisher: s.domain,
        relevance: s.verified ? 1 : 0.8,
        sourceCategory: credibility.category,
        sourceCategoryLabel: credibility.categoryLabel,
        bias: credibility.bias,
        biasLabel: credibility.biasLabel,
      };
    });

    const intentLabel = INTENT_LABELS[result.intent] || "Follow-up";

    return NextResponse.json({
      success: true,
      data: {
        heading: result.answer.policyName,
        cardType: "general",
        sections,
        followUpSuggestions: result.suggestions,
        sources,
        followUpMeta: {
          intent: result.intent,
          intentLabel,
          depthLevel: result.depthLevel,
        },
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
