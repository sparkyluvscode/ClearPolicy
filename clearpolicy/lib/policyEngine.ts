import OpenAI from "openai";
import type { Answer, AnswerSection, AnswerSource } from "./policy-types";
import type { WebSearchResult } from "./web-search";
import { formatWebContext } from "./web-search";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

const PLACEHOLDER_DOMAINS = new Set([
  "example.com", "example.org", "example.net",
  "placeholder.com", "test.com", "fake.com",
  "source.com", "website.com", "domain.com",
]);

function isValidSourceUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const host = parsed.hostname.replace("www.", "");
    if (PLACEHOLDER_DOMAINS.has(host)) return false;
    if (!host.includes(".")) return false;
    return true;
  } catch {
    return false;
  }
}

function webResultsToSources(results: WebSearchResult[]): AnswerSource[] {
  return results.slice(0, 6).map((r, i) => {
    let domain = "";
    try { domain = new URL(r.url).hostname.replace("www.", ""); } catch { domain = "source"; }
    const isGov = domain.endsWith(".gov");
    return {
      id: i + 1,
      title: r.title,
      url: r.url,
      domain,
      type: isGov ? ("Federal" as const) : ("Web" as const),
      verified: true,
    };
  }).filter(s => isValidSourceUrl(s.url));
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
  webResults?: WebSearchResult[],
  govContext?: string,
): Promise<Answer> {
  const webContext = webResults?.length ? `\n\n${formatWebContext(webResults)}\n` : "";
  const govBlock = govContext ? `\n\n${govContext}\n` : "";
  const hasVerifiedData = !!(govContext || webResults?.length);

  const prompt = `The user asked: "${query}"
${govBlock}${webContext}
This is a general knowledge question. Provide a thorough, insightful, and well-structured answer that a curious, intelligent person would find genuinely useful. Go beyond surface-level - include context, nuance, relevant history, and "why it matters."

Return ONLY valid JSON (no markdown):
{
  "title": "Short, compelling descriptive title",
  "category": "One short category (e.g. 'People', 'Science', 'History', 'Technology')",
  "answer": "A detailed, well-written 4-8 sentence answer. Don't just state facts - explain them. Include context, significance, and connections that make the answer genuinely interesting and useful. Write in clear, engaging prose.",
  "keyFacts": ["Substantive fact with context 1", "Substantive fact with context 2", "Substantive fact with context 3", "Substantive fact with context 4", "Substantive fact with context 5"],
  "sources": []
}

Rules:
- Be thorough and insightful, not generic. The user chose this app over Google - reward that choice.
- Each key fact should be a complete, informative sentence (not just a fragment).
- Include 5 key facts that give the reader a real understanding of the topic.
- Include specific numbers, statistics, dollar amounts, dates, and percentages wherever possible. Quantitative data makes answers credible.
- IMPORTANT: Always return an empty sources array []. Sources are handled separately by the system. Do NOT generate any source URLs.${hasVerifiedData ? "\n- Government data and web search results are provided above. Use them as your PRIMARY factual basis." : ""}
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

  // ONLY use verified sources from web search. Never use AI-generated URLs.
  const sources: AnswerSource[] = webResults?.length
    ? webResultsToSources(webResults)
    : [];

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
  zipCode?: string | null,
  webResults?: WebSearchResult[],
  govContext?: string,
): Promise<Answer> {
  const client = getOpenAI();
  if (!client) return stubAnswer(query, zipCode);

  // Route general-knowledge queries to a flexible prompt
  if (!isPolicyQuery(query) && !govContext) {
    try {
      return await generateGeneralAnswer(client, query, webResults, govContext);
    } catch (error) {
      console.error("General answer AI failed, falling back to policy prompt:", error);
    }
  }

  const zipHint = zipCode ? ` The user is in ZIP code ${zipCode}; include specific local relevance - how this policy or legislation concretely affects people in their area.` : "";
  const webContext = webResults?.length ? `\n\n${formatWebContext(webResults)}\n` : "";
  const govBlock = govContext ? `\n\n${govContext}\n` : "";
  const hasGovData = !!govContext;
  const hasVerifiedData = hasGovData || !!webResults?.length;

  const prompt = `You are a world-class non-partisan civic education assistant. The user asked: "${query}".${zipHint}
${govBlock}${webContext}
Your job is to provide the most helpful, insightful, and thorough policy analysis possible - the kind of briefing a journalist, researcher, or engaged citizen would find genuinely valuable. Go beyond surface-level descriptions.

Return ONLY valid JSON with this exact structure (no markdown, no code fence):
{
  "policyName": "Clear, descriptive title (e.g. 'California Proposition 36 (2024): Tougher Penalties for Drug and Theft Crimes')",
  "level": "Federal" or "State" or "Local",
  "category": "One short category (e.g. 'Criminal Justice', 'Healthcare', 'Education')",
  "fullTextSummary": "A substantive 4-6 sentence overview that captures what this is, why it matters, and what the real-world implications are. Be specific - include dates, numbers, affected populations, and current status where relevant.",
  "sections": {
    "summary": "A thorough 4-6 sentence summary. Don't just describe - explain significance, context, and real-world impact. If this is a specific bill or proposition, include its current status (passed/pending/failed), when it was introduced, and its key sponsor(s) if notable.",
    "keyProvisions": ["Detailed provision 1 - explain what it actually does in practice, not just legal language", "Detailed provision 2 - include specific numbers, thresholds, or requirements where applicable", "Detailed provision 3 - explain who is directly affected and how", "Provision 4 - implementation timeline or effective date if known", "Provision 5 - any exceptions or notable carve-outs"],
    "localImpact": { "zipCode": "${zipCode || ""}", "location": "City/region name based on ZIP", "content": "2-3 specific sentences about how this affects residents in this area - reference local conditions, demographics, or existing local policies that interact with this." } or null if no ZIP,
    "argumentsFor": ["Substantive argument with supporting reasoning - explain WHY supporters believe this, not just WHAT they believe", "Another detailed argument - include specific data points, expert opinions, or real-world examples where possible", "A third argument - consider economic, social, or practical benefits"],
    "argumentsAgainst": ["Substantive counterargument with reasoning - explain the genuine concern, not a strawman", "Another detailed objection - include specific risks, costs, or unintended consequences", "A third argument - consider who bears the costs or downsides"]
  },
  "sources": [
    { "title": "Source name (prefer official government sites, major news outlets, and research institutions)", "url": "https://...", "domain": "domain.com", "type": "Federal" or "State" or "Local" or "Web" }
  ]
}

Critical rules:
- Be NEUTRAL and FACTUAL, but also substantive and ANALYTICAL. Don't just describe - explain mechanisms, trade-offs, and real-world consequences.
- Include QUANTITATIVE DATA: budget numbers, cost estimates, number of people affected, percentages, timelines, and statistical projections wherever available. Users need hard data, not vague summaries.${hasGovData ? `\n- CRITICAL: Official government data from Congress.gov and/or Open States is provided above. This is VERIFIED, AUTHORITATIVE data.
  • If the user asked about a SPECIFIC BILL (e.g. "HR 1", "SB 1047"), focus your answer on that bill using the government data. If multiple versions appear across sessions, use the web search context to determine which the user likely means.
  • If the user asked a TOPIC question (e.g. "education policy", "gun control"), use the government bills to illustrate your answer with REAL legislation - but only cite bills that are genuinely relevant to the topic. Skip bills that merely contain the keyword but aren't substantively about the topic.
  • Use the bill titles, status, sponsors, and summaries from the government data. Do NOT contradict or fabricate details beyond what the data states.` : ""}${hasVerifiedData ? "\n- CRITICAL SOURCE RULE: Government data and web search results are provided above WITH THEIR URLs. ONLY use URLs that appear in the provided data. Do NOT invent, guess, or fabricate any URLs. If a source does not have a URL in the provided data, do not include it." : "\n- CRITICAL SOURCE RULE: If you are not 100% certain a URL is real, do NOT include it. Return an empty sources array rather than risk fabricating URLs. Only cite URLs you are completely confident exist."}
- Each key provision should be a complete, informative sentence that helps someone understand what will actually change.
- Arguments for and against should be steel-manned - represent each side's BEST case, not a caricature. Include specific data points or expert opinions.
- Include 3-5 real, reputable sources. Prefer .gov, major news outlets (NYT, AP, Reuters, Politico), and research institutions.
- If the query references a specific bill number or proposition, be precise about what it does - don't generalize.
- The user chose this app to understand policy better than they could from a Google search. Deliver on that promise.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a world-class non-partisan policy analyst who provides thorough, insightful briefings. You explain complex policy in clear language while preserving important nuance. You always include specific details - dates, numbers, affected populations - rather than vague generalities. Return only valid JSON with the exact keys requested. No markdown or extra text.",
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

    // ONLY use verified sources from web search. Never use AI-generated URLs.
    const sources: AnswerSource[] = webResults?.length
      ? webResultsToSources(webResults)
      : [];

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
 * Generate a structured debate brief with multiple named perspectives.
 */
export async function generateDebateAnswer(
  query: string,
  zipCode?: string | null,
  webResults?: WebSearchResult[],
  govContext?: string,
): Promise<{ answer: Answer; perspectives: { label: string; summary: string; thinktank?: string }[] }> {
  const client = getOpenAI();
  if (!client) {
    return {
      answer: stubAnswer(query, zipCode),
      perspectives: [],
    };
  }

  const zipHint = zipCode ? ` The user is in ZIP code ${zipCode}.` : "";
  const webContext = webResults?.length ? `\n\n${formatWebContext(webResults)}\n` : "";
  const govBlock = govContext ? `\n\n${govContext}\n` : "";

  const prompt = `The user wants a balanced debate briefing on: "${query}".${zipHint}
${govBlock}${webContext}

Provide a thorough, multi-perspective analysis that would prepare someone for an informed discussion or debate. Present the STRONGEST version of each side's argument (steel-man, not strawman).

Return ONLY valid JSON:
{
  "policyName": "Clear title framing the debate (e.g. 'Should the US Adopt Universal Healthcare?')",
  "level": "Federal" or "State" or "Local",
  "category": "Short category",
  "fullTextSummary": "3-4 sentence overview of the debate - what is at stake, why reasonable people disagree, and what the key fault lines are.",
  "thesis": "One clear sentence framing the central question.",
  "perspectives": [
    {
      "label": "Progressive",
      "summary": "3-4 sentences presenting the progressive case. Include specific policy proposals, data points, or examples. Explain the underlying values and reasoning.",
      "thinktank": "Center for American Progress or similar"
    },
    {
      "label": "Conservative",
      "summary": "3-4 sentences presenting the conservative case. Include specific concerns, data, or historical examples. Explain the underlying values and reasoning.",
      "thinktank": "Heritage Foundation or similar"
    },
    {
      "label": "Libertarian",
      "summary": "3-4 sentences presenting the libertarian/free-market case. Focus on individual liberty, market solutions, and government overreach concerns.",
      "thinktank": "Cato Institute or similar"
    },
    {
      "label": "Pragmatic Center",
      "summary": "3-4 sentences presenting a centrist or pragmatic view. Focus on compromise positions, evidence-based approaches, and practical trade-offs.",
      "thinktank": "Brookings Institution or similar"
    }
  ],
  "commonGround": ["Area of agreement 1 - something most sides actually agree on", "Area of agreement 2"],
  "keyDisagreements": ["Core disagreement 1 - the fundamental value tension", "Core disagreement 2 - the empirical dispute"],
  "sources": [
    { "title": "Source", "url": "https://...", "domain": "domain.com", "type": "Web" }
  ]
}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a world-class debate coach and policy analyst. You present every perspective at its strongest. You never take sides but help the user understand ALL viewpoints deeply. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content);

    const perspectives: { label: string; summary: string; thinktank?: string }[] =
      Array.isArray(parsed.perspectives)
        ? parsed.perspectives.map((p: { label?: string; summary?: string; thinktank?: string }) => ({
            label: p.label || "Perspective",
            summary: p.summary || "",
            thinktank: p.thinktank,
          }))
        : [];

    const commonGround: string[] = Array.isArray(parsed.commonGround) ? parsed.commonGround : [];
    const keyDisagreements: string[] = Array.isArray(parsed.keyDisagreements) ? parsed.keyDisagreements : [];

    const sections: AnswerSection = {
      summary: parsed.fullTextSummary || "",
      keyProvisions: parsed.thesis ? [parsed.thesis, ...commonGround] : commonGround,
      argumentsFor: keyDisagreements,
      argumentsAgainst: undefined,
    };

    // ONLY use verified sources from web search. Never use AI-generated URLs.
    const sources: AnswerSource[] = webResults?.length
      ? webResultsToSources(webResults)
      : [];

    return {
      answer: {
        policyId: `debate-${Date.now()}`,
        policyName: parsed.policyName || query.slice(0, 100),
        level: ["Federal", "State", "Local"].includes(parsed.level) ? parsed.level : "Federal",
        category: parsed.category || "Debate",
        fullTextSummary: parsed.fullTextSummary || "",
        sections,
        sources,
      },
      perspectives,
    };
  } catch (error) {
    console.error("Debate engine AI failed:", error);
    return { answer: stubAnswer(query, zipCode), perspectives: [] };
  }
}

/**
 * Generate a follow-up answer using OpenAI when available.
 */
export async function generateFollowUpAnswer(
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
  persona?: string | null,
  webResults?: WebSearchResult[],
  govContext?: string,
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
  const personaHint = persona && persona !== "general" ? ` Tailor the answer specifically for a ${persona}'s perspective - focus on aspects that directly affect them.` : "";
  const webContext = webResults?.length ? `\n\n${formatWebContext(webResults)}\n` : "";
  const govBlock = govContext ? `\n\n${govContext}\n` : "";
  const hasVerifiedData = !!(govContext || webResults?.length);

  const prompt = `You are a world-class non-partisan civic education assistant. The user is asking a follow-up question in the context of an existing policy conversation. Your job is to provide a thorough, insightful answer that genuinely advances their understanding.

Previous context (recent messages):
${historyBlock}
${govBlock}${webContext}
Follow-up question: "${message}"${personaHint}

Return ONLY valid JSON (no markdown):
{
  "policyName": "Clear, descriptive heading for this follow-up (e.g. 'How Proposition 36 Affects Renters in California')",
  "fullTextSummary": "A substantive 4-6 sentence answer that directly addresses the follow-up question. Include specific details, examples, data points, or expert perspectives. Don't repeat what was already said - build on it with new information and deeper analysis.",
  "sections": {
    "summary": "A thorough 4-6 sentence answer. Be specific and actionable. If the user asks about impact, give concrete examples. If they ask about arguments, steel-man both sides. If they ask for comparison, highlight specific differences.",
    "keyProvisions": ["Detailed point 1 - substantive and specific", "Detailed point 2 - with context or data", "Detailed point 3 - with real-world implications", "Point 4 if relevant"],
    "argumentsFor": ["Substantive supporting argument with reasoning", "Another well-reasoned point with evidence"],
    "argumentsAgainst": ["Substantive counterargument with reasoning", "Another genuine concern with specifics"]
  },
  "suggestions": ["Thoughtful follow-up question that goes deeper into an interesting aspect", "A question that explores a different angle or affected group", "A practical question about implementation or timeline"]
}

Rules:
- Don't repeat content from previous messages. Build on what's already been discussed.
- Be specific - use real numbers, dollar amounts, statistics, dates, affected populations, and concrete examples. Quantitative data is essential.
- Be ANALYTICAL, not just descriptive. Identify trade-offs, unintended consequences, legal loopholes, and implementation challenges.${hasVerifiedData ? "\n- CRITICAL: Government data and/or web search results are provided above WITH THEIR URLs. Use them as your PRIMARY factual basis. Do NOT invent URLs or fabricate facts beyond what the data states." : ""}
- The follow-up suggestions should be genuinely interesting questions that a curious person would want to ask next.
- If the question is about impact on a specific group, explain the mechanisms - not just "it affects them" but HOW and WHY.`;

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
    const sources: AnswerSource[] = webResults?.length ? webResultsToSources(webResults) : [];

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
