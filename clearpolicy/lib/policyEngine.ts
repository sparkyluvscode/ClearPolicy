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
CITATION & ATTRIBUTION RULES (CRITICAL - this is what makes our tool better than ChatGPT):

STYLE: Use natural-language inline attribution so a reader can speak any sentence aloud in a debate round or presentation with proper sourcing. NEVER use bracketed numeric citations like [1], [2], [3]. NEVER use parenthetical academic citations like (Author, Year). NEVER leave a statistic or factual claim without naming the source.

FORMAT: Attribute every factual claim, statistic, or substantive argument using phrases like:
- "According to [Source Name] ([Year]), ..."
- "A [Year] report by [Source Name] found that ..."
- "[Source Name] estimates that ... ([Year])."
- "Data from [Source Name] shows that ..."

SPECIFICITY:
- Use the SPECIFIC organization name from the numbered sources above. Match source names to the titles/domains provided. For example, if source 1 is from "cbo.gov", attribute to "the Congressional Budget Office". If from "pewresearch.org", attribute to "the Pew Research Center".
- Include the year or date when available.
- If the source is a specific document, name it: 'According to the CRS report "DC Statehood: Implications" (2023)'.
- If a quote from a specific person is available, name them and their role.

SYNTHESIS: When combining information from multiple sources or stating broad consensus:
- "Policy analysts generally agree that..."
- "Multiple sources, including [Source A] and [Source B], suggest that..."
- Do NOT attribute synthesized analysis to a single source.

DIRECT QUOTES: When you can surface a direct quote from a source, include it in quotation marks with full attribution before or after the quote.

SOURCE LINKING: When you attribute a claim to a source, format the source name as a markdown link if the URL is available from the numbered sources: "According to [the Congressional Budget Office](https://www.cbo.gov/...) (2024), ..."

IMPORTANT: Every paragraph should have at least one named attribution. A user should be able to read your answer and immediately know which organization or authority produced each piece of information.`;

const QUANTITATIVE_RULES = `
QUANTITATIVE DATA RULES (CRITICAL — this is what makes our answers credible for debate, civic boards, and policy analysis):
- Every argument, claim, or position MUST include at least one specific number: a dollar amount, percentage, population figure, vote count, polling result, or statistical measure.
- Include data such as: budget/cost estimates ($X billion), population affected (X million people), polling data (X% support/oppose), vote tallies (passed X-Y), timelines (enacted in YYYY), growth rates (X% increase since YYYY), and comparative figures (Xth largest among states).
- If exact figures are unavailable, provide the best available estimates and note they are estimates.
- If quantitative data genuinely does not exist for a specific sub-claim, explicitly state: "Quantitative data on [aspect] is limited in available sources."
- DO NOT make qualitative-only claims when numbers exist. "The bill is popular" is UNACCEPTABLE; "The bill has 62% public support according to Gallup (2024)" is what we need.
- Aim for a MINIMUM of 8-10 distinct quantitative data points across your entire response.
- Prioritize data from government sources (CBO, Census Bureau, GAO, BLS), major polling firms (Gallup, Pew, AP-NORC), and established research institutions.`;

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

  const prompt = `The user asked: "${query}"
${hasContext ? `\n${sourcesContext}\n` : ""}
This is a general knowledge question. Provide a thorough, insightful, and well-structured answer.
${hasContext ? CITATION_RULES : ""}
${QUANTITATIVE_RULES}
Return ONLY valid JSON (no markdown):
{
  "title": "Short, compelling descriptive title",
  "category": "One short category",
  "answer": "A detailed 4-8 sentence answer${hasContext ? " with natural-language attributions like 'According to [Source Name] (Year), ...'" : ""}. Include context, significance, and specific numbers/dates/statistics.",
  "keyFacts": ["Fact 1${hasContext ? " attributed to a named source" : ""}", "Fact 2", "Fact 3", "Fact 4", "Fact 5"],
  "sources": []
}

Rules:
- Be thorough and insightful. Include specific numbers, statistics, dollar amounts, dates, and percentages.
- Each key fact should be a complete, informative sentence with a citation if sources are available.
- Always return an empty sources array []. Sources are handled separately.${hasContext ? "\n- Use the provided numbered sources as your PRIMARY factual basis. Attribute them by name using 'According to...' style." : ""}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert research assistant. You provide thorough, source-attributed answers. Every factual claim must include natural-language attribution naming the specific source (e.g. 'According to [Source Name] (Year), ...'). Never use bracketed numeric citations like [1] or [2]. Return only valid JSON.",
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
${hasContext || hasDocument ? CITATION_RULES : ""}${hasDocument ? `
DOCUMENT CITATION RULES:
- When citing the uploaded document, use [Doc] followed by the section or paragraph reference, e.g. [Doc, Section 3(a)] or [Doc, p.12] or [Doc, paragraph 4].
- Quote the specific text from the document that supports your claim.
- Be precise about where in the document each claim comes from.` : ""}

Return ONLY valid JSON with this exact structure (no markdown, no code fence):
{
  "policyName": "Clear, descriptive title",
  "level": "Federal" or "State" or "Local",
  "category": "One short category",
  "fullTextSummary": "A substantive 4-6 sentence overview${hasContext || hasDocument ? " with natural-language attributions like 'According to [Source Name] (Year), ...'" : ""}.",
  "sections": {
    "summary": "A thorough 4-6 sentence summary where every factual claim names its source inline.",
    "keyProvisions": ["According to [Source], provision 1...", "A report by [Source] found provision 2...", "Provision 3", "Provision 4", "Provision 5"],
    "localImpact": ${zipCode ? `{ "zipCode": "${zipCode}", "location": "City/region name for this ZIP", "content": "2-3 specific sentences about how this affects people in ZIP ${zipCode}, with named source attributions." }` : "null"},
    "argumentsFor": ["According to [Source], argument with evidence...", "Data from [Source] shows...", "Third argument"],
    "argumentsAgainst": ["According to [Source], counterargument...", "[Source] argues that...", "Third argument"]
  },
  "sources": []
}

Critical rules:
- Be NEUTRAL and FACTUAL, but substantive and ANALYTICAL.
- Include QUANTITATIVE DATA: budget numbers, cost estimates, percentages, timelines.
- Always return an empty sources array []. Sources are handled separately.${hasContext ? "\n- Use the provided numbered sources as your PRIMARY factual basis. Attribute them by name using 'According to...' style. NEVER use [1], [2], [3] style citations." : ""}
- Arguments for and against should be steel-manned with specific data points.
- The user chose this app over ChatGPT/Gemini. Deliver source-attributed analysis that can be spoken aloud in a debate round.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a world-class non-partisan policy analyst. Every factual claim must include natural-language attribution naming the specific source (e.g. 'According to the Congressional Budget Office (2024), ...'). Never use bracketed numeric citations like [1] or [2]. Return only valid JSON.",
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
  const zipHint = zipCode ? ` The user is located in ZIP code ${zipCode}. Include how this debate topic specifically affects their area.` : "";
  const hasContext = ctx.length > 0;

  const prompt = `The user wants a balanced debate briefing on: "${query}".${zipHint}
${hasContext ? `\n${ctx}\n` : ""}
Provide a thorough, multi-perspective analysis for informed debate preparation.
${hasContext ? CITATION_RULES : ""}
Return ONLY valid JSON:
{
  "policyName": "Clear title framing the debate",
  "level": "Federal" or "State" or "Local",
  "category": "Short category",
  "fullTextSummary": "3-4 sentence overview${hasContext ? " with natural-language source attributions" : ""}.",
  "thesis": "One clear sentence framing the central question.",
  "perspectives": [
    { "label": "Progressive", "summary": "3-4 sentences attributing claims to named sources.", "thinktank": "CAP or similar" },
    { "label": "Conservative", "summary": "3-4 sentences attributing claims to named sources.", "thinktank": "Heritage or similar" },
    { "label": "Libertarian", "summary": "3-4 sentences attributing claims to named sources.", "thinktank": "Cato or similar" },
    { "label": "Pragmatic Center", "summary": "3-4 sentences attributing claims to named sources.", "thinktank": "Brookings or similar" }
  ],
  "commonGround": ["According to [Source], area of agreement 1...", "Area of agreement 2"],
  "keyDisagreements": ["According to [Source], core disagreement 1...", "Core disagreement 2"],
  "sources": []
}

Always return an empty sources array []. Sources are handled separately.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a world-class debate coach. Every factual claim must include natural-language attribution naming the specific source (e.g. 'According to [Source Name] (Year), ...'). Never use bracketed numeric citations. Present every perspective at its strongest. Return only valid JSON." },
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
  "fullTextSummary": "4-6 sentence answer${hasContext ? " with natural-language source attributions" : ""}.",
  "sections": {
    "summary": "Thorough answer where every factual claim names its source inline.",
    "keyProvisions": ["According to [Source], point 1...", "Data from [Source] shows point 2...", "Point 3", "Point 4"],
    "argumentsFor": ["According to [Source], supporting argument...", "A report by [Source] found..."],
    "argumentsAgainst": ["According to [Source], counterargument...", "[Source] argues that..."]
  },
  "suggestions": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}

Rules:
- Build on previous context, don't repeat.
- Be specific: real numbers, dollar amounts, statistics, dates.
- Be ANALYTICAL: identify trade-offs, unintended consequences, loopholes.${hasContext ? "\n- Use the provided numbered sources as your PRIMARY factual basis. Attribute them by name using 'According to...' style. NEVER use [1], [2] style citations." : ""}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a world-class policy analyst. Every factual claim must include natural-language attribution naming the specific source (e.g. 'According to [Source Name] (Year), ...'). Never use bracketed numeric citations like [1] or [2]. Return only valid JSON." },
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
