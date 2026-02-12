import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { Source, Persona, AnswerSection } from "@/lib/omni-types";

/**
 * POST /api/followup
 *
 * Handles follow-up questions within a conversation thread.
 * Takes the full conversation history + new query and generates
 * a contextual answer card.
 */

let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return openai;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const {
      query,
      policyName,
      conversationHistory = [],
      sources = [],
      zip,
      persona = "general",
      readingLevel = "8",
    } = body as {
      query: string;
      policyName: string;
      conversationHistory: ConversationMessage[];
      sources: Source[];
      zip?: string;
      persona?: Persona;
      readingLevel?: string;
    };

    if (!query?.trim()) {
      return NextResponse.json({ success: false, error: "Query is required." }, { status: 400 });
    }

    const client = getOpenAI();

    // Build source context
    const sourceContext = sources
      .map((s: Source, i: number) => `[${i + 1}] ${s.title}\n    URL: ${s.url || "N/A"}\n    Snippet: ${s.snippet?.slice(0, 300) || "N/A"}`)
      .join("\n\n");

    const validSourceNums = sources.map((_: Source, i: number) => `[${i + 1}]`).join(", ") || "none available";

    const gradeDesc =
      readingLevel === "5" ? "5th-grade (very simple)" :
      readingLevel === "12" ? "college-level (detailed)" : "8th-grade (standard)";

    const systemPrompt = `You are ClearPolicy, a conversational policy research assistant.

You are continuing a conversation about "${policyName}". The user is asking a follow-up question.

CITATION RULES:
- Every factual claim must cite a source: [1], [2], etc.
- Valid sources: ${validSourceNums}
- If no source available, prefix with "(General Knowledge) "
- NEVER invent URLs or source titles

WRITING RULES:
- Write at ${gradeDesc} reading level
- Be factual and non-partisan
- Be conversational but professional
${zip ? `- Always consider local context for ZIP ${zip}` : ""}
${persona !== "general" ? `- Filter answer for ${persona} perspective` : ""}

AVAILABLE SOURCES:
${sourceContext || "No sources available. Label all claims as (General Knowledge)."}

Respond with valid JSON:
{
  "heading": "Clear heading for this answer (derived from user's question)",
  "sections": [
    {
      "label": "Summary" | "Key Provisions" | "Local Impact" | "Arguments For" | "Arguments Against" | "Details" | "Comparison",
      "content": "Paragraph with citations [1], [2]...",
      "citations": [1, 2],
      "confidence": "verified" | "inferred" | "unverified"
    }
  ],
  "followUpSuggestions": ["Next question 1?", "Next question 2?", "Next question 3?"],
  "cardType": "general" | "verified" | "debate" | "document"
}`;

    // Build message history
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history (limited to last 6 exchanges to stay within context)
    const recentHistory = conversationHistory.slice(-12);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Add the new follow-up question
    messages.push({ role: "user", content: query });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ success: false, error: "No response generated." }, { status: 500 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ success: false, error: "Failed to parse response." }, { status: 500 });
    }

    // Validate citations
    const sections: AnswerSection[] = (parsed.sections || []).map((s: any) => {
      const citationMatches = (s.content || "").match(/\[\d+\]/g);
      const hasCitations = citationMatches && citationMatches.length > 0;
      const hasGeneralKnowledge = (s.content || "").includes("(General Knowledge)");

      let confidence: "verified" | "inferred" | "unverified" = "unverified";
      if (hasCitations && !hasGeneralKnowledge) confidence = "verified";
      else if (hasCitations && hasGeneralKnowledge) confidence = "inferred";

      return {
        heading: s.label || s.heading || "Details",
        content: s.content || "",
        citations: hasCitations
          ? [...new Set(citationMatches!.map((m: string) => parseInt(m.replace(/[[\]]/g, ""), 10)))]
          : [],
        confidence,
      };
    });

    const processingTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        heading: parsed.heading || "Follow-up",
        sections,
        followUpSuggestions: Array.isArray(parsed.followUpSuggestions) ? parsed.followUpSuggestions.slice(0, 3) : [],
        cardType: parsed.cardType || "general",
        processingTimeMs,
      },
    });
  } catch (error) {
    console.error("[Followup] Error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
