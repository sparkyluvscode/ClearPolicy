import OpenAI from "openai";
import type { Answer, AnswerSection, AnswerSource } from "./policy-types";
import type { WebSearchResult } from "./web-search";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

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

const POLICY_SIGNALS =
  /\b(bill|act|law|legislation|statute|regulation|ordinance|amendment|proposition|prop|measure|ballot|vote|policy|policies|zoning|tax|tariff|healthcare|medicaid|medicare|social\s+security|immigration|housing|education|criminal\s+justice|gun\s+control|climate|environment|epa|fda|sec\s+|fcc|irs|congress|senate|representative|governor|mayor|scotus|supreme\s+court|executive\s+order|ab\s*\d|sb\s*\d|hr\s*\d|hb\s*\d|h\.?r\.?\s*\d)\b/i;

function isPolicyQuery(query: string): boolean {
  return POLICY_SIGNALS.test(query);
}

const CITATION_RULES = `
CITATION RULES (CRITICAL - this is what makes our tool better than ChatGPT):
- You MUST embed inline citations as [1], [2], [3] etc. throughout your answer text, referencing the numbered sources provided above.
- Place citations immediately after the specific claim or fact they support, not at the end of paragraphs.
- Every factual claim SHOULD have a citation. Reuse source numbers liberally -- if source [1] supports multiple points, cite [1] each time.
- Multiple citations can support one claim: "The bill passed with bipartisan support [1][3]."
- Do NOT fabricate citation numbers. Only use numbers that correspond to the provided numbered sources.
- If a claim is common knowledge (e.g. "The US has three branches of government"), you do NOT need to mark it. Only truly speculative or uncertain claims should be marked (General Knowledge).
- IMPORTANT: Avoid overusing (General Knowledge). Most of your answer should be cited. If you find yourself marking many claims as (General Knowledge), try harder to connect them to the provided sources.`;

const NO_SOURCES_RULES = `
NO SOURCES AVAILABLE - CRITICAL:
- We have NO verified sources for this query. Do NOT use any citation numbers [1], [2], [3], etc.
- Do NOT invent specific statistics, percentages, dates, or numbers (e.g. "3.41%", "Class of 2027", "SAT 1480-1570"). These would be hallucinations.
- Be general and qualitative. Use phrases like "typically", "generally", "admissions are highly competitive" instead of specific figures.
- If you cannot verify a claim, do not state it as fact. Mark uncertain claims with (General Knowledge).
- Your answer will be shown as uncited. Do not pretend to have sources.`;

/**
 * All generate* functions now receive pre-built `sourcesContext` (the numbered
 * text block the AI sees) and `sources` (the matching AnswerSource array for the UI).
 * The omni route builds both to guarantee consistent numbering.
 */

async function generateGeneralAnswer(
  client: OpenAI,
  query: string,
  sourcesContext: string,
  sources: AnswerSource[],
): Promise<Answer> {
  const hasContext = sourcesContext.length > 0;

  const hasSources = sources.length > 0;
  const prompt = `The user asked: "${query}"
${hasContext ? `\n${sourcesContext}\n` : ""}
This is a general knowledge question. Provide a thorough, insightful, and well-structured answer.
${hasSources && hasContext ? CITATION_RULES : !hasSources ? NO_SOURCES_RULES : ""}
Return ONLY valid JSON (no markdown):
{
  "title": "Short, compelling descriptive title",
  "category": "One short category",
  "answer": "A detailed 4-8 sentence answer${hasSources && hasContext ? " with inline citations [N] after each claim" : ""}. ${hasSources ? "Include context, significance, and specific numbers/dates/statistics from the sources." : "Be general and qualitative. Do NOT invent specific statistics, percentages, or dates."}",
  "keyFacts": ["Fact 1${hasSources && hasContext ? " [N]" : ""}", "Fact 2", "Fact 3", "Fact 4", "Fact 5"],
  "sources": []
}

Rules:
${hasSources ? "- Be thorough and insightful. Include specific numbers, statistics, dollar amounts, dates, and percentages from the provided sources.\n- Each key fact should be a complete, informative sentence with a citation.\n- Always return an empty sources array []. Sources are handled separately.\n- Use the provided numbered sources as your PRIMARY factual basis. Cite them with [N]." : "- Be thorough but general. Do NOT invent specific statistics (e.g. '3.41%', 'Class of 2027'). Use qualitative language like 'highly competitive', 'typically requires'.\n- Always return an empty sources array []. Sources are handled separately."}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert research assistant. You provide thorough, citation-backed answers. Every factual claim must be traced to a numbered source. Return only valid JSON.",
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

export async function generatePolicyAnswer(
  query: string,
  zipCode?: string | null,
  sourcesContext?: string,
  sources?: AnswerSource[],
  documentContext?: string,
): Promise<Answer> {
  const client = getOpenAI();
  if (!client) return stubAnswer(query, zipCode);

  const ctx = sourcesContext || "";
  const srcs = sources || [];
  const hasSources = srcs.length > 0;

  if (!isPolicyQuery(query) && !ctx && !documentContext) {
    try {
      return await generateGeneralAnswer(client, query, ctx, srcs);
    } catch (error) {
      console.error("General answer AI failed, falling back to policy prompt:", error);
    }
  }

  const zipHint = zipCode ? ` The user is located in ZIP code ${zipCode}. You MUST include a localImpact section explaining how this policy specifically affects people in their area. Reference their state, local representatives, or regional context. Never return null for localImpact when a ZIP is provided.` : "";
  const docBlock = documentContext ? `\n\n--- UPLOADED DOCUMENT ---\n${documentContext}\n--- END DOCUMENT ---\n` : "";
  const hasContext = ctx.length > 0;
  const hasDocument = !!documentContext;

  const prompt = `You are a world-class non-partisan civic education assistant. The user asked: "${query}".${zipHint}
${hasContext ? `\n${ctx}\n` : ""}${docBlock}
Your job is to provide the most helpful, insightful, and thorough policy analysis possible - the kind of briefing a journalist, researcher, or debater would find genuinely valuable.
${!hasSources ? NO_SOURCES_RULES : (hasContext || hasDocument ? CITATION_RULES : "")}${hasDocument ? `
DOCUMENT CITATION RULES:
- When citing the uploaded document, use [Doc] followed by the section or paragraph reference, e.g. [Doc, Section 3(a)] or [Doc, p.12] or [Doc, paragraph 4].
- Quote the specific text from the document that supports your claim.
- Be precise about where in the document each claim comes from.` : ""}

Return ONLY valid JSON with this exact structure (no markdown, no code fence):
{
  "policyName": "Clear, descriptive title",
  "level": "Federal" or "State" or "Local",
  "category": "One short category",
  "fullTextSummary": "A substantive 4-6 sentence overview${hasSources && (hasContext || hasDocument) ? " with inline citations [N] after each claim" : ". Do NOT use [1][2] etc. when no sources are provided."}.",
  "sections": {
    "summary": "A thorough 4-6 sentence summary${hasSources ? " with inline citations [N] after each factual claim" : ". Be general; do NOT invent specific statistics or percentages."}.",
    "keyProvisions": [${hasSources ? '"Provision 1 with citation [N]", "Provision 2 [N]", "Provision 3", "Provision 4", "Provision 5"' : '"Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"'}],
    "localImpact": ${zipCode ? `{ "zipCode": "${zipCode}", "location": "City/region name for this ZIP", "content": "2-3 specific sentences about how this affects people in ZIP ${zipCode}, with citations." }` : "null"},
    "argumentsFor": ["Argument with evidence [N]", "Another argument [N]", "Third argument"],
    "argumentsAgainst": ["Counterargument with evidence [N]", "Another objection [N]", "Third argument"]
  },
  "sources": []
}

Critical rules:
- Be NEUTRAL and FACTUAL, but substantive and ANALYTICAL.
${hasSources ? "- Include QUANTITATIVE DATA: budget numbers, cost estimates, percentages, timelines.\n- Always return an empty sources array []. Sources are handled separately.\n- Use the provided numbered sources as your PRIMARY factual basis. Cite them with [N].\n- Arguments for and against should be steel-manned with specific data points.\n- Deliver citation-backed analysis, not vague summaries." : "- Do NOT invent specific numbers, percentages, or dates. Be qualitative and general.\n- Always return an empty sources array []. Sources are handled separately.\n- Be honest that we have no verified sources for this query."}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: hasSources ? "You are a world-class non-partisan policy analyst. Every factual claim must be backed by an inline citation [N] referencing the provided numbered sources. Return only valid JSON." : "You are a world-class non-partisan policy analyst. We have NO verified sources. Do NOT use [1], [2], etc. Do NOT invent specific statistics or percentages. Be general and qualitative. Return only valid JSON.",
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

    return {
      policyId: `policy-${Date.now()}`,
      policyName: parsed.policyName || query.slice(0, 100),
      level: ["Federal", "State", "Local"].includes(parsed.level) ? parsed.level : "State",
      category: parsed.category || "General",
      fullTextSummary: parsed.fullTextSummary || sections.summary || "",
      sections,
      sources: srcs,
    };
  } catch (error) {
    console.error("Policy engine AI failed:", error);
    return stubAnswer(query, zipCode);
  }
}

export async function generateDebateAnswer(
  query: string,
  zipCode?: string | null,
  sourcesContext?: string,
  sources?: AnswerSource[],
): Promise<{ answer: Answer; perspectives: { label: string; summary: string; thinktank?: string }[] }> {
  const client = getOpenAI();
  if (!client) return { answer: stubAnswer(query, zipCode), perspectives: [] };

  const ctx = sourcesContext || "";
  const srcs = sources || [];
  const hasSources = srcs.length > 0;
  const zipHint = zipCode ? ` The user is located in ZIP code ${zipCode}. Include how this debate topic specifically affects their area.` : "";
  const hasContext = ctx.length > 0;

  const prompt = `The user wants a balanced debate briefing on: "${query}".${zipHint}
${hasContext ? `\n${ctx}\n` : ""}
Provide a thorough, multi-perspective analysis for informed debate preparation.
${!hasSources ? NO_SOURCES_RULES : (hasContext ? CITATION_RULES : "")}
Return ONLY valid JSON:
{
  "policyName": "Clear title framing the debate",
  "level": "Federal" or "State" or "Local",
  "category": "Short category",
  "fullTextSummary": "3-4 sentence overview${hasSources && hasContext ? " with inline citations [N]" : ". Be general; do NOT invent specific statistics."}.",
  "thesis": "One clear sentence framing the central question.",
  "perspectives": [
    { "label": "Progressive", "summary": "3-4 sentences${hasSources ? " with citations [N]" : ""}.", "thinktank": "CAP or similar" },
    { "label": "Conservative", "summary": "3-4 sentences${hasSources ? " with citations [N]" : ""}.", "thinktank": "Heritage or similar" },
    { "label": "Libertarian", "summary": "3-4 sentences${hasSources ? " with citations [N]" : ""}.", "thinktank": "Cato or similar" },
    { "label": "Pragmatic Center", "summary": "3-4 sentences${hasSources ? " with citations [N]" : ""}.", "thinktank": "Brookings or similar" }
  ],
  "commonGround": ["Area of agreement 1${hasSources ? " [N]" : ""}", "Area of agreement 2"],
  "keyDisagreements": ["Core disagreement 1${hasSources ? " [N]" : ""}", "Core disagreement 2"],
  "sources": []
}

Always return an empty sources array []. Sources are handled separately.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: hasSources ? "You are a world-class debate coach. Every factual claim must have inline citations [N]. Present every perspective at its strongest. Return only valid JSON." : "You are a world-class debate coach. We have no verified sources. Do NOT use citation numbers. Do NOT invent specific statistics. Be general and qualitative. Return only valid JSON." },
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

    return {
      answer: {
        policyId: `debate-${Date.now()}`,
        policyName: parsed.policyName || query.slice(0, 100),
        level: ["Federal", "State", "Local"].includes(parsed.level) ? parsed.level : "Federal",
        category: parsed.category || "Debate",
        fullTextSummary: parsed.fullTextSummary || "",
        sections,
        sources: srcs,
      },
      perspectives,
    };
  } catch (error) {
    console.error("Debate engine AI failed:", error);
    return { answer: stubAnswer(query, zipCode), perspectives: [] };
  }
}

export async function generateFollowUpAnswer(
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
  persona?: string | null,
  sourcesContext?: string,
  sources?: AnswerSource[],
): Promise<{ answer: Answer; suggestions: string[] }> {
  const client = getOpenAI();
  if (!client) {
    return {
      answer: {
        policyId: "fallback-followup", policyName: "Follow-up unavailable",
        level: "State", category: "General",
        fullTextSummary: "Our AI service may be temporarily unavailable. Please try again.",
        sections: { summary: "Our AI service may be temporarily unavailable. Please try again." },
        sources: [],
      },
      suggestions: ["Try again", "Ask a different question"],
    };
  }

  const ctx = sourcesContext || "";
  const srcs = sources || [];
  const historyBlock = history.slice(-8).map((h) => `${h.role}: ${h.content.slice(0, 400)}`).join("\n");
  const personaHint = persona && persona !== "general" ? ` Tailor for a ${persona}'s perspective.` : "";
  const hasContext = ctx.length > 0;

  const prompt = `You are a world-class non-partisan civic education assistant answering a follow-up question.

Previous context:
${historyBlock}
${hasContext ? `\n${ctx}\n` : ""}
Follow-up question: "${message}"${personaHint}
${hasContext ? CITATION_RULES : ""}
Return ONLY valid JSON:
{
  "policyName": "Clear heading for this follow-up",
  "fullTextSummary": "4-6 sentence answer${hasContext ? " with inline citations [N]" : ""}.",
  "sections": {
    "summary": "Thorough answer with inline citations.",
    "keyProvisions": ["Point 1 [N]", "Point 2 [N]", "Point 3", "Point 4"],
    "argumentsFor": ["Supporting argument [N]", "Another point [N]"],
    "argumentsAgainst": ["Counterargument [N]", "Another concern [N]"]
  },
  "suggestions": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}

Rules:
- Build on previous context, don't repeat.
- Be specific: real numbers, dollar amounts, statistics, dates.
- Be ANALYTICAL: identify trade-offs, unintended consequences, loopholes.${hasContext ? "\n- Use the provided numbered sources as your PRIMARY factual basis." : ""}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a world-class policy analyst. Every factual claim must have an inline citation [N] referencing provided numbered sources. Return only valid JSON." },
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

    return {
      answer: {
        policyId: `followup-${Date.now()}`,
        policyName: parsed.policyName || "Follow-up",
        level: "State", category: "General",
        fullTextSummary: parsed.fullTextSummary || sections.summary || "",
        sections,
        sources: srcs,
      },
      suggestions,
    };
  } catch (error) {
    console.error("Follow-up AI failed:", error);
    return {
      answer: {
        policyId: "fallback-followup", policyName: "Follow-up",
        level: "State", category: "General",
        fullTextSummary: "We encountered an issue generating your follow-up answer. Please try again.",
        sections: { summary: "We encountered an issue generating your follow-up answer. Please try again." },
        sources: [],
      },
      suggestions: ["Try again", "Ask a different question"],
    };
  }
}
