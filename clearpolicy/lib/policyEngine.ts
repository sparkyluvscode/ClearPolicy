import OpenAI from "openai";
import type { Answer, AnswerSection, AnswerSource } from "./policy-types";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

/** Build a graceful fallback answer when AI is unavailable or fails */
function stubAnswer(query: string, zipCode?: string | null): Answer {
  const title = query.slice(0, 100) || "Policy overview";
  const sections: AnswerSection = {
    summary: `We're currently unable to generate a detailed analysis for "${title}". Our AI service may be temporarily unavailable. Please try again in a moment, or refine your search.`,
  };
  return {
    policyId: `fallback-${Date.now()}`,
    policyName: title,
    level: "State",
    category: "General",
    fullTextSummary: sections.summary || "",
    sections,
    sources: [],
  };
}

/* ── Query classification: policy vs general knowledge ── */
const POLICY_SIGNALS =
  /\b(bill|act|law|legislation|statute|regulation|ordinance|amendment|proposition|prop|measure|ballot|vote|policy|policies|zoning|tax|tariff|healthcare|medicaid|medicare|social\s+security|immigration|housing|education|criminal\s+justice|gun\s+control|climate|environment|epa|fda|sec\s+|fcc|irs|congress|senate|representative|governor|mayor|scotus|supreme\s+court|executive\s+order|ab\s*\d|sb\s*\d|hr\s*\d|hb\s*\d|h\.?r\.?\s*\d)\b/i;

function isPolicyQuery(query: string): boolean {
  return POLICY_SIGNALS.test(query);
}

/**
 * Generate a general-knowledge answer (non-policy) using OpenAI.
 */
async function generateGeneralAnswer(
  client: OpenAI,
  query: string,
): Promise<Answer> {
  const prompt = `The user asked: "${query}"

This is a general knowledge question (not specifically about policy or legislation).
Provide a helpful, factual, and concise answer. Return ONLY valid JSON (no markdown):
{
  "title": "Short descriptive title",
  "category": "One short category (e.g. 'People', 'Science', 'History')",
  "answer": "A clear, thorough 2-5 sentence answer to the question.",
  "keyFacts": ["Fact 1", "Fact 2", "Fact 3"],
  "sources": [
    { "title": "Source name", "url": "https://...", "domain": "domain.com" }
  ]
}

Rules: Be factual and helpful. If unsure about something, say so. Include 1-3 real sources where applicable.`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a knowledgeable assistant. Answer general questions clearly and factually. Return only valid JSON.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");

  const parsed = JSON.parse(content);
  const keyFacts: string[] = Array.isArray(parsed.keyFacts) ? parsed.keyFacts : [];
  const rawSources = Array.isArray(parsed.sources) ? parsed.sources : [];
  const sources: AnswerSource[] = rawSources
    .filter((s: any) => s.url && s.url !== "https://example.com")
    .slice(0, 4)
    .map((s: any, i: number) => ({
      id: i + 1,
      title: s.title || "Source",
      url: s.url,
      domain: s.domain || (() => { try { return new URL(s.url).hostname; } catch { return "source"; } })(),
      type: "Web" as const,
      verified: true,
    }));

  return {
    policyId: `general-${Date.now()}`,
    policyName: parsed.title || query.slice(0, 100),
    level: "Federal",
    category: parsed.category || "General",
    fullTextSummary: parsed.answer || "",
    sections: {
      summary: parsed.answer || "",
      keyProvisions: keyFacts.length > 0 ? keyFacts : undefined,
    },
    sources,
  };
}

/**
 * Generate a policy answer from a user query using OpenAI when available.
 * Detects whether the query is policy-related or general knowledge and
 * uses the appropriate prompt.
 * Falls back to stub content if no API key or on error.
 */
export async function generatePolicyAnswer(
  query: string,
  zipCode?: string | null
): Promise<Answer> {
  const client = getOpenAI();
  if (!client) return stubAnswer(query, zipCode);

  // Route general-knowledge queries to a flexible prompt
  if (!isPolicyQuery(query)) {
    try {
      return await generateGeneralAnswer(client, query);
    } catch (error) {
      console.error("General answer AI failed, falling back to policy prompt:", error);
      // Fall through to policy prompt as a safety net
    }
  }

  const zipHint = zipCode ? ` The user is in ZIP code ${zipCode}; include brief local relevance if applicable.` : "";

  const prompt = `You are a non-partisan civic education assistant. The user asked: "${query}".${zipHint}

Provide a clear, neutral policy overview in plain English. Return ONLY valid JSON with this exact structure (no markdown, no code fence):
{
  "policyName": "Short title for this topic (e.g. 'SECURE Act and retirement savings')",
  "level": "Federal" or "State" or "Local",
  "category": "One short category (e.g. 'Retirement', 'Healthcare')",
  "fullTextSummary": "2-4 sentences summarizing the policy or topic. Be specific and factual.",
  "sections": {
    "summary": "Same or slightly expanded summary paragraph.",
    "keyProvisions": ["Bullet 1", "Bullet 2", "Bullet 3"],
    "localImpact": { "zipCode": "${zipCode || ""}", "location": "Brief location label", "content": "1-2 sentences on local impact" } or null if no ZIP,
    "argumentsFor": ["Pro 1", "Pro 2"],
    "argumentsAgainst": ["Con 1", "Con 2"]
  },
  "sources": [
    { "title": "Source name", "url": "https://...", "domain": "domain.com", "type": "Federal" or "State" or "Local" or "Web" }
  ]
}

Rules: Be neutral and factual. Use your knowledge of real laws and policies when the query references them (e.g. SECURE Act, AB 1482, Prop 47). Include 2-4 real or plausible sources. If no ZIP, omit localImpact or set to null.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a non-partisan policy explainer. Return only valid JSON with the exact keys requested. No markdown or extra text.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return stubAnswer(query, zipCode);

    const parsed = JSON.parse(content);
    const sec = parsed.sections || {};
    const localImpact = sec.localImpact && sec.localImpact.content
      ? {
          zipCode: sec.localImpact.zipCode || zipCode || "",
          location: sec.localImpact.location || (zipCode ? `ZIP ${zipCode}` : ""),
          content: sec.localImpact.content,
        }
      : undefined;

    const sections: AnswerSection = {
      summary: sec.summary || parsed.fullTextSummary || "",
      keyProvisions: Array.isArray(sec.keyProvisions) ? sec.keyProvisions : [],
      localImpact,
      argumentsFor: Array.isArray(sec.argumentsFor) ? sec.argumentsFor : [],
      argumentsAgainst: Array.isArray(sec.argumentsAgainst) ? sec.argumentsAgainst : [],
    };

    const rawSources = Array.isArray(parsed.sources) ? parsed.sources : [];
    const sources: AnswerSource[] = rawSources
      .filter((s: any) => s.url && s.url !== "https://example.com")
      .slice(0, 6)
      .map((s: any, i: number) => ({
        id: i + 1,
        title: s.title || "Source",
        url: s.url,
        domain: s.domain || (() => { try { return new URL(s.url).hostname; } catch { return "source"; } })(),
        type: ["Federal", "State", "Local", "Web"].includes(s.type) ? s.type : "Web",
        verified: true,
      }));

    return {
      policyId: `policy-${Date.now()}`,
      policyName: parsed.policyName || query.slice(0, 100),
      level: ["Federal", "State", "Local"].includes(parsed.level) ? parsed.level : "State",
      category: parsed.category || "General",
      fullTextSummary: parsed.fullTextSummary || sections.summary || "",
      sections,
      sources,
    };
  } catch (error) {
    console.error("Policy engine AI failed:", error);
    return stubAnswer(query, zipCode);
  }
}

/**
 * Generate a follow-up answer using OpenAI when available.
 */
export async function generateFollowUpAnswer(
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
  persona?: string | null
): Promise<{ answer: Answer; suggestions: string[] }> {
  const client = getOpenAI();
  const lastAssistant = history.filter((h) => h.role === "assistant").pop();
  const context = lastAssistant?.content ?? "the previous answer";

  if (!client) {
    const sections: AnswerSection = {
      summary: `We're currently unable to generate a follow-up answer. Our AI service may be temporarily unavailable. Please try again in a moment.`,
    };
    return {
      answer: {
        policyId: "fallback-followup",
        policyName: "Follow-up unavailable",
        level: "State",
        category: "General",
        fullTextSummary: sections.summary || "",
        sections,
        sources: [],
      },
      suggestions: ["Try again", "Ask a different question"],
    };
  }

  const historyBlock = history
    .slice(-6)
    .map((h) => `${h.role}: ${h.content.slice(0, 200)}`)
    .join("\n");
  const personaHint = persona && persona !== "general" ? ` Tailor the answer for a ${persona} perspective.` : "";

  const prompt = `You are a non-partisan civic education assistant. The user is asking a follow-up question in the context of an existing policy conversation.

Previous context (recent messages):
${historyBlock}

Follow-up question: "${message}"${personaHint}

Return ONLY valid JSON (no markdown):
{
  "policyName": "Short heading for this follow-up (e.g. 'Local implications')",
  "fullTextSummary": "2-4 sentences answering the follow-up. Be specific and neutral.",
  "sections": {
    "summary": "Same or slightly expanded.",
    "keyProvisions": ["Point 1", "Point 2", "Point 3"],
    "argumentsFor": ["Pro 1", "Pro 2"],
    "argumentsAgainst": ["Con 1", "Con 2"]
  },
  "suggestions": ["Suggested follow-up question 1", "Suggested follow-up question 2", "Suggested follow-up question 3"]
}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a non-partisan policy explainer. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    const parsed = JSON.parse(content);
    const sec = parsed.sections || {};
    const sections: AnswerSection = {
      summary: sec.summary || parsed.fullTextSummary || "",
      keyProvisions: Array.isArray(sec.keyProvisions) ? sec.keyProvisions : [],
      argumentsFor: Array.isArray(sec.argumentsFor) ? sec.argumentsFor : [],
      argumentsAgainst: Array.isArray(sec.argumentsAgainst) ? sec.argumentsAgainst : [],
    };
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [
      "How does this affect renters?",
      "What are the main criticisms?",
      "Compare to similar policies",
    ];
    const sources: AnswerSource[] = [];

    return {
      answer: {
        policyId: `followup-${Date.now()}`,
        policyName: parsed.policyName || "Follow-up",
        level: "State",
        category: "General",
        fullTextSummary: parsed.fullTextSummary || sections.summary || "",
        sections,
        sources,
      },
      suggestions,
    };
  } catch (error) {
    console.error("Follow-up AI failed:", error);
    return {
      answer: {
        policyId: "fallback-followup",
        policyName: "Follow-up",
        level: "State",
        category: "General",
        fullTextSummary: "We encountered an issue generating your follow-up answer. Please try again.",
        sections: {
          summary: "We encountered an issue generating your follow-up answer. Please try again.",
        },
        sources: [],
      },
      suggestions: ["Try again", "Ask a different question"],
    };
  }
}
