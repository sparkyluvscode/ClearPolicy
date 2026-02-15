import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * POST /api/clarify
 *
 * Perplexity-style query disambiguation.
 * Given a potentially ambiguous query, determines if clarification is needed.
 * If so, returns clarifying questions. If not, signals "ready" to proceed.
 *
 * Examples:
 *   "prop 50" → needs clarification (which state? which year?)
 *   "California Prop 36 2024" → ready (specific enough)
 *   "healthcare" → needs clarification (what aspect? federal or state?)
 */

let openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export interface ClarifyResponse {
  needsClarification: boolean;
  /** If needsClarification, these are the options to show the user */
  questions?: {
    question: string;
    options: string[];
  }[];
  /** If needsClarification is false, the refined query to search */
  refinedQuery?: string;
}

export async function POST(req: NextRequest) {
  let rawQuery = "";
  try {
    const body = await req.json();
    const query = body?.query;
    rawQuery = typeof query === "string" ? query.trim() : "";
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ needsClarification: false, refinedQuery: query });
    }

    const trimmed = query.trim();

    // Fast-path: if query is already very specific, skip LLM call
    const isSpecific =
      // Has a year
      /\b(19|20)\d{2}\b/.test(trimmed) ||
      // Has a specific bill identifier with number
      /\b(H\.?R\.?|S\.?B\.?|A\.?B\.?)\s*\.?\s*\d+/.test(trimmed) ||
      // Is a full sentence/question (likely specific enough)
      (trimmed.length > 50 && /\?$/.test(trimmed)) ||
      // Has state AND prop/bill
      (/\b(california|texas|new york|florida|ohio)\b/i.test(trimmed) && /\b(prop|bill|measure)\b/i.test(trimmed)) ||
      // General questions that don't need disambiguation
      /^(what is|explain|how does|why|who|when|arguments|pros and cons)/i.test(trimmed);

    if (isSpecific) {
      return NextResponse.json({ needsClarification: false, refinedQuery: trimmed });
    }

    const client = getOpenAI();
    if (!client) {
      // No API key — just proceed without clarification
      return NextResponse.json({ needsClarification: false, refinedQuery: trimmed });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a query disambiguation assistant for a policy research engine called ClearPolicy.

Your job: determine if a user's query is specific enough to search, or if it needs clarification.

Queries that NEED clarification:
- "prop 50" — which state? which year? (many states have propositions)
- "healthcare bill" — which one? federal or state?
- "immigration" — too broad, what aspect?
- "SB 1234" — which state? which session?

Queries that DON'T need clarification:
- "California Prop 36 2024" — specific enough
- "What is the Inflation Reduction Act?" — clear intent
- "Explain F-1 visa work restrictions" — specific topic
- "Arguments for and against rent control" — clear request
- Any full question with enough context

Respond with valid JSON only:
{
  "needs_clarification": true/false,
  "questions": [
    {
      "question": "Which state's Proposition 50 do you mean?",
      "options": ["California", "Other state"]
    },
    {
      "question": "Which year?",
      "options": ["2002", "2024", "I'm not sure"]
    }
  ],
  "refined_query": null
}

If needs_clarification is false, set refined_query to the user's query (possibly slightly cleaned up).
If needs_clarification is true, provide 1-2 questions with 2-4 options each. Keep options concise.
Maximum 2 questions. Be helpful, not annoying.`
        },
        { role: "user", content: trimmed }
      ],
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ needsClarification: false, refinedQuery: trimmed });
    }

    const parsed = JSON.parse(raw);

    if (parsed.needs_clarification && parsed.questions?.length > 0) {
      return NextResponse.json({
        needsClarification: true,
        questions: parsed.questions.map((q: any) => ({
          question: q.question || "",
          options: Array.isArray(q.options) ? q.options : [],
        })),
      });
    }

    return NextResponse.json({
      needsClarification: false,
      refinedQuery: parsed.refined_query || trimmed,
    });
  } catch (error) {
    console.error("[Clarify] Error:", error);
    // On error, just proceed without clarification
    // On error, pass through the original query so the search still proceeds
    return NextResponse.json({ needsClarification: false, refinedQuery: rawQuery });
  }
}
