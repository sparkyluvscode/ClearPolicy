import { NextRequest, NextResponse } from "next/server";
import { generateFollowUpAnswer } from "@/lib/policyEngine";
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
  if (answer.sections.argumentsFor?.length || answer.sections.argumentsAgainst?.length) {
    const parts: string[] = [];
    if (answer.sections.argumentsFor?.length) parts.push("For: " + answer.sections.argumentsFor.join(" "));
    if (answer.sections.argumentsAgainst?.length) parts.push("Against: " + answer.sections.argumentsAgainst.join(" "));
    sections.push({
      heading: "Arguments",
      content: parts.join("\n\n"),
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

    const { answer, suggestions } = await generateFollowUpAnswer(query, history, persona);
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
