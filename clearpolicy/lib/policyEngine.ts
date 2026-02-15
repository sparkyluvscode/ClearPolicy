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

This is a general knowledge question. Provide a thorough, insightful, and well-structured answer that a curious, intelligent person would find genuinely useful. Go beyond surface-level — include context, nuance, relevant history, and "why it matters."

Return ONLY valid JSON (no markdown):
{
  "title": "Short, compelling descriptive title",
  "category": "One short category (e.g. 'People', 'Science', 'History', 'Technology')",
  "answer": "A detailed, well-written 4-8 sentence answer. Don't just state facts — explain them. Include context, significance, and connections that make the answer genuinely interesting and useful. Write in clear, engaging prose.",
  "keyFacts": ["Substantive fact with context 1", "Substantive fact with context 2", "Substantive fact with context 3", "Substantive fact with context 4", "Substantive fact with context 5"],
  "sources": [
    { "title": "Source name", "url": "https://...", "domain": "domain.com" }
  ]
}

Rules:
- Be thorough and insightful, not generic. The user chose this app over Google — reward that choice.
- Each key fact should be a complete, informative sentence (not just a fragment).
- Include 5 key facts that give the reader a real understanding of the topic.
- Provide 2-4 real, reputable sources (government sites, major publications, academic sources preferred).
- If the query is about a person, include their significance, major achievements, and current relevance.
- If the query is about an event, include the timeline, causes, effects, and why it matters today.
- Write as if explaining to an intelligent adult who deserves a complete picture, not a simplified blurb.`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert research assistant known for thorough, insightful answers. You explain topics with depth and clarity, always providing context that makes information genuinely useful. Return only valid JSON.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
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

  const zipHint = zipCode ? ` The user is in ZIP code ${zipCode}; include specific local relevance — how this policy or legislation concretely affects people in their area.` : "";

  const prompt = `You are a world-class non-partisan civic education assistant. The user asked: "${query}".${zipHint}

Your job is to provide the most helpful, insightful, and thorough policy analysis possible — the kind of briefing a journalist, researcher, or engaged citizen would find genuinely valuable. Go beyond surface-level descriptions.

Return ONLY valid JSON with this exact structure (no markdown, no code fence):
{
  "policyName": "Clear, descriptive title (e.g. 'California Proposition 36 (2024): Tougher Penalties for Drug and Theft Crimes')",
  "level": "Federal" or "State" or "Local",
  "category": "One short category (e.g. 'Criminal Justice', 'Healthcare', 'Education')",
  "fullTextSummary": "A substantive 4-6 sentence overview that captures what this is, why it matters, and what the real-world implications are. Be specific — include dates, numbers, affected populations, and current status where relevant.",
  "sections": {
    "summary": "A thorough 4-6 sentence summary. Don't just describe — explain significance, context, and real-world impact. If this is a specific bill or proposition, include its current status (passed/pending/failed), when it was introduced, and its key sponsor(s) if notable.",
    "keyProvisions": ["Detailed provision 1 — explain what it actually does in practice, not just legal language", "Detailed provision 2 — include specific numbers, thresholds, or requirements where applicable", "Detailed provision 3 — explain who is directly affected and how", "Provision 4 — implementation timeline or effective date if known", "Provision 5 — any exceptions or notable carve-outs"],
    "localImpact": { "zipCode": "${zipCode || ""}", "location": "City/region name based on ZIP", "content": "2-3 specific sentences about how this affects residents in this area — reference local conditions, demographics, or existing local policies that interact with this." } or null if no ZIP,
    "argumentsFor": ["Substantive argument with supporting reasoning — explain WHY supporters believe this, not just WHAT they believe", "Another detailed argument — include specific data points, expert opinions, or real-world examples where possible", "A third argument — consider economic, social, or practical benefits"],
    "argumentsAgainst": ["Substantive counterargument with reasoning — explain the genuine concern, not a strawman", "Another detailed objection — include specific risks, costs, or unintended consequences", "A third argument — consider who bears the costs or downsides"]
  },
  "sources": [
    { "title": "Source name (prefer official government sites, major news outlets, and research institutions)", "url": "https://...", "domain": "domain.com", "type": "Federal" or "State" or "Local" or "Web" }
  ]
}

Critical rules:
- Be NEUTRAL and FACTUAL, but also substantive. Shallow answers are worse than no answer.
- Use your knowledge of real laws and policies. When referencing specific legislation (e.g. SECURE Act, AB 1482, Prop 36), include the actual year, sponsor, and current status.
- Each key provision should be a complete, informative sentence that helps someone understand what will actually change.
- Arguments for and against should be steel-manned — represent each side's BEST case, not a caricature.
- Include 3-5 real, reputable sources. Prefer .gov, major news outlets (NYT, AP, Reuters, Politico), and research institutions.
- If the query references a specific bill number or proposition, be precise about what it does — don't generalize.
- The user chose this app to understand policy better than they could from a Google search. Deliver on that promise.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a world-class non-partisan policy analyst who provides thorough, insightful briefings. You explain complex policy in clear language while preserving important nuance. You always include specific details — dates, numbers, affected populations — rather than vague generalities. Return only valid JSON with the exact keys requested. No markdown or extra text.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
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
    .slice(-8)
    .map((h) => `${h.role}: ${h.content.slice(0, 400)}`)
    .join("\n");
  const personaHint = persona && persona !== "general" ? ` Tailor the answer specifically for a ${persona}'s perspective — focus on aspects that directly affect them.` : "";

  const prompt = `You are a world-class non-partisan civic education assistant. The user is asking a follow-up question in the context of an existing policy conversation. Your job is to provide a thorough, insightful answer that genuinely advances their understanding.

Previous context (recent messages):
${historyBlock}

Follow-up question: "${message}"${personaHint}

Return ONLY valid JSON (no markdown):
{
  "policyName": "Clear, descriptive heading for this follow-up (e.g. 'How Proposition 36 Affects Renters in California')",
  "fullTextSummary": "A substantive 4-6 sentence answer that directly addresses the follow-up question. Include specific details, examples, data points, or expert perspectives. Don't repeat what was already said — build on it with new information and deeper analysis.",
  "sections": {
    "summary": "A thorough 4-6 sentence answer. Be specific and actionable. If the user asks about impact, give concrete examples. If they ask about arguments, steel-man both sides. If they ask for comparison, highlight specific differences.",
    "keyProvisions": ["Detailed point 1 — substantive and specific", "Detailed point 2 — with context or data", "Detailed point 3 — with real-world implications", "Point 4 if relevant"],
    "argumentsFor": ["Substantive supporting argument with reasoning", "Another well-reasoned point with evidence"],
    "argumentsAgainst": ["Substantive counterargument with reasoning", "Another genuine concern with specifics"]
  },
  "suggestions": ["Thoughtful follow-up question that goes deeper into an interesting aspect", "A question that explores a different angle or affected group", "A practical question about implementation or timeline"]
}

Rules:
- Don't repeat content from previous messages. Build on what's already been discussed.
- Be specific — use real numbers, dates, affected populations, and concrete examples.
- The follow-up suggestions should be genuinely interesting questions that a curious person would want to ask next.
- If the question is about impact on a specific group, explain the mechanisms — not just "it affects them" but HOW and WHY.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a world-class non-partisan policy analyst. You provide thorough, specific, and genuinely insightful answers. You never give vague or generic responses. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
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
