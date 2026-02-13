import { NextRequest, NextResponse } from "next/server";
import { generatePolicyAnswer } from "@/lib/policyEngine";
import type { OmniResponse, AnswerSection as OmniAnswerSection, Source } from "@/lib/omni-types";
import type { Answer, AnswerSource as PolicySource } from "@/lib/policy-types";

export const dynamic = "force-dynamic";

function mapPolicyAnswerToOmni(answer: Answer, persona: string, intent: "general_policy" | "bill_lookup" = "general_policy"): OmniResponse {
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
      heading: "Key provisions",
      content: answer.sections.keyProvisions.join("\n\n"),
      citations: [],
      confidence: "verified",
    });
  }
  if (answer.sections.localImpact?.content) {
    sections.push({
      heading: `Local impact (${answer.sections.localImpact.location})`,
      content: answer.sections.localImpact.content,
      citations: [],
      confidence: "verified",
    });
  }
  if (answer.sections.argumentsFor?.length || answer.sections.argumentsAgainst?.length) {
    const parts: string[] = [];
    if (answer.sections.argumentsFor?.length) parts.push("For: " + answer.sections.argumentsFor.join(" "));
    if (answer.sections.argumentsAgainst?.length) parts.push("Against: " + answer.sections.argumentsAgainst.join(" "));
    sections.push({
      heading: "Arguments for and against",
      content: parts.join("\n\n"),
      citations: [],
      confidence: "inferred",
    });
  }
  if (sections.length === 0) {
    sections.push({
      heading: "Overview",
      content: answer.fullTextSummary,
      citations: [],
      confidence: "verified",
    });
  }

  const sources: Source[] = answer.sources.map((s: PolicySource, i: number) => ({
    id: `src-${i}`,
    type: s.type === "Federal" ? "federal_bill" : s.type === "State" ? "state_bill" : "government_site",
    title: s.title,
    url: s.url,
    snippet: s.title,
    publisher: s.domain,
    relevance: s.verified ? 1 : 0.8,
    jurisdiction: (s.type.toLowerCase() as "federal" | "state" | "local") || undefined,
  }));

  return {
    id: answer.policyId,
    intent,
    title: answer.policyName,
    tldr: answer.fullTextSummary.slice(0, 200),
    sections,
    sources,
    persona: (persona as "general") || "general",
    followUps: [
      "What are the main arguments for and against?",
      "How does this affect my area?",
      "Compare to similar policies",
    ],
    model: "policy-engine",
    processingTimeMs: 0,
    warnings: [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json({ success: false, error: "Missing query" }, { status: 400 });
    }
    const zip = typeof body?.zip === "string" ? body.zip : undefined;
    const persona = typeof body?.persona === "string" ? body.persona : "general";

    const answer = await generatePolicyAnswer(query, zip ?? null);
    const data = mapPolicyAnswerToOmni(answer, persona);

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("[api/omni]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 }
    );
  }
}
