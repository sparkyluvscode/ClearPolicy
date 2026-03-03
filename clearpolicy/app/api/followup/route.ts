import { NextRequest, NextResponse } from "next/server";
import { generateFollowUpAnswer } from "@/lib/policyEngine";
import { searchWeb } from "@/lib/web-search";
import { fetchGovData, formatGovContext } from "@/lib/gov-data";
import { classifyQuery } from "@/lib/omni-classifier";
import type { AnswerSection as OmniAnswerSection } from "@/lib/omni-types";

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
    const govContextStr = formatGovContext(govData) || undefined;
    const webResults = webSearchResults?.results ?? [];

    const { answer, suggestions } = await generateFollowUpAnswer(query, history, persona, webResults, govContextStr);
    const sections = mapFollowUpToSections(answer);

    return NextResponse.json({
      success: true,
      data: {
        heading: answer.policyName,
        cardType: "general",
        sections,
        followUpSuggestions: suggestions,
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
