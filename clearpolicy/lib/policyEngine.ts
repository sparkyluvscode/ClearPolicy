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
      excerpt: r.content?.slice(0, 300) || "",
    };
  }).filter(s => isValidSourceUrl(s.url));
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
CITATION RULES (CRITICAL):
- You MUST embed inline citations as [1], [2], [3] etc. throughout your answer text, referencing the numbered sources provided above.
- Place citations immediately after the specific claim or fact they support, not at the end of paragraphs.
- Every factual claim, statistic, date, or specific detail MUST have a citation. If a fact cannot be cited, explicitly note it as (General Knowledge).
- Multiple citations can support one claim: "The bill passed with bipartisan support [1][3]."
- Do NOT fabricate citation numbers. Only use numbers that correspond to the provided sources.
- If no sources are provided, mark claims with (General Knowledge).`;

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
This is a general knowledge question. Provide a thorough, insightful, and well-structured answer.
${hasVerifiedData ? CITATION_RULES : ""}
Return ONLY valid JSON (no markdown):
{
  "title": "Short, compelling descriptive title",
  "category": "One short category",
  "answer": "A detailed 4-8 sentence answer${hasVerifiedData ? " with inline citations [1], [2] after each claim" : ""}. Include context, significance, and specific numbers/dates/statistics.",
  "keyFacts": ["Fact 1${hasVerifiedData ? " [citation]" : ""}", "Fact 2", "Fact 3", "Fact 4", "Fact 5"],
  "sources": []
}

Rules:
- Be thorough and insightful. Include specific numbers, statistics, dollar amounts, dates, and percentages.
- Each key fact should be a complete, informative sentence with a citation if sources are available.
- Always return an empty sources array []. Sources are handled separately.${hasVerifiedData ? "\n- Use the provided search results and government data as your PRIMARY factual basis. Cite them with [1], [2] etc." : ""}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert research assistant. You provide thorough, citation-backed answers. Every factual claim must be traced to a source. Return only valid JSON.",
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

export async function generatePolicyAnswer(
  query: string,
  zipCode?: string | null,
  webResults?: WebSearchResult[],
  govContext?: string,
  documentContext?: string,
): Promise<Answer> {
  const client = getOpenAI();
  if (!client) return stubAnswer(query, zipCode);

  if (!isPolicyQuery(query) && !govContext && !documentContext) {
    try {
      return await generateGeneralAnswer(client, query, webResults, govContext);
    } catch (error) {
      console.error("General answer AI failed, falling back to policy prompt:", error);
    }
  }

  const zipHint = zipCode ? ` The user is in ZIP code ${zipCode}; include specific local relevance.` : "";
  const webContext = webResults?.length ? `\n\n${formatWebContext(webResults)}\n` : "";
  const govBlock = govContext ? `\n\n${govContext}\n` : "";
  const docBlock = documentContext ? `\n\n--- UPLOADED DOCUMENT ---\n${documentContext}\n--- END DOCUMENT ---\n` : "";
  const hasGovData = !!govContext;
  const hasVerifiedData = hasGovData || !!webResults?.length;
  const hasDocument = !!documentContext;

  const prompt = `You are a world-class non-partisan civic education assistant. The user asked: "${query}".${zipHint}
${govBlock}${webContext}${docBlock}
Your job is to provide the most helpful, insightful, and thorough policy analysis possible - the kind of briefing a journalist, researcher, or debater would find genuinely valuable.
${hasVerifiedData || hasDocument ? CITATION_RULES : ""}${hasDocument ? `
DOCUMENT CITATION RULES:
- When citing the uploaded document, use [Doc] followed by the section or paragraph reference, e.g. [Doc, Section 3(a)] or [Doc, p.12] or [Doc, paragraph 4].
- Quote the specific text from the document that supports your claim using "quoted text" [Doc, location].
- Be precise about where in the document each claim comes from. Debaters need to verify your citations.` : ""}

Return ONLY valid JSON with this exact structure (no markdown, no code fence):
{
  "policyName": "Clear, descriptive title",
  "level": "Federal" or "State" or "Local",
  "category": "One short category",
  "fullTextSummary": "A substantive 4-6 sentence overview${hasVerifiedData || hasDocument ? " with inline citations [1], [2], [Doc] after each claim" : ""}. Be specific - include dates, numbers, affected populations, and current status.",
  "sections": {
    "summary": "A thorough 4-6 sentence summary with inline citations after each factual claim. Don't just describe - explain significance, context, and real-world impact.",
    "keyProvisions": ["Provision 1 with citation [N]", "Provision 2 with citation [N]", "Provision 3", "Provision 4", "Provision 5"],
    "localImpact": { "zipCode": "${zipCode || ""}", "location": "City/region name", "content": "2-3 specific sentences with citations." } or null if no ZIP,
    "argumentsFor": ["Argument with evidence and citation [N]", "Another argument with data [N]", "Third argument"],
    "argumentsAgainst": ["Counterargument with evidence and citation [N]", "Another objection with data [N]", "Third argument"]
  },
  "sources": []
}

Critical rules:
- Be NEUTRAL and FACTUAL, but substantive and ANALYTICAL. Explain mechanisms, trade-offs, and real-world consequences.
- Include QUANTITATIVE DATA: budget numbers, cost estimates, number of people affected, percentages, timelines.
- Always return an empty sources array []. Sources are handled separately by the system.${hasGovData ? `\n- Official government data from Congress.gov and/or Open States is provided above. This is VERIFIED data.
  • Use the bill titles, status, sponsors, and summaries from the government data.
  • Do NOT contradict or fabricate details beyond what the data states.` : ""}${hasVerifiedData ? "\n- Use the provided search results and government data as your PRIMARY factual basis. Cite them with [1], [2] etc." : ""}
- Each key provision should be a complete, informative sentence.
- Arguments for and against should be steel-manned with specific data points or expert opinions.
- The user chose this app to understand policy better than ChatGPT or Gemini. Deliver citation-backed analysis, not vague summaries.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a world-class non-partisan policy analyst. Every factual claim must be backed by an inline citation [1], [2] referencing the provided sources. You never make unsourced claims without marking them (General Knowledge). Return only valid JSON.",
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

    const sources: AnswerSource[] = webResults?.length
      ? webResultsToSources(webResults)
      : [];

    // For uploaded documents, add a document source entry
    if (hasDocument) {
      sources.unshift({
        id: 0,
        title: "Uploaded Document",
        url: "",
        domain: "uploaded",
        type: "Web" as const,
        verified: true,
        excerpt: documentContext!.slice(0, 200) + "...",
      });
    }

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

export async function generateDebateAnswer(
  query: string,
  zipCode?: string | null,
  webResults?: WebSearchResult[],
  govContext?: string,
): Promise<{ answer: Answer; perspectives: { label: string; summary: string; thinktank?: string }[] }> {
  const client = getOpenAI();
  if (!client) {
    return { answer: stubAnswer(query, zipCode), perspectives: [] };
  }

  const zipHint = zipCode ? ` The user is in ZIP code ${zipCode}.` : "";
  const webContext = webResults?.length ? `\n\n${formatWebContext(webResults)}\n` : "";
  const govBlock = govContext ? `\n\n${govContext}\n` : "";
  const hasVerifiedData = !!(govContext || webResults?.length);

  const prompt = `The user wants a balanced debate briefing on: "${query}".${zipHint}
${govBlock}${webContext}

Provide a thorough, multi-perspective analysis for informed debate preparation.
${hasVerifiedData ? CITATION_RULES : ""}
Return ONLY valid JSON:
{
  "policyName": "Clear title framing the debate",
  "level": "Federal" or "State" or "Local",
  "category": "Short category",
  "fullTextSummary": "3-4 sentence overview${hasVerifiedData ? " with inline citations [1], [2]" : ""}.",
  "thesis": "One clear sentence framing the central question.",
  "perspectives": [
    {
      "label": "Progressive",
      "summary": "3-4 sentences with citations [N] presenting the progressive case with specific data.",
      "thinktank": "Center for American Progress or similar"
    },
    {
      "label": "Conservative",
      "summary": "3-4 sentences with citations [N] presenting the conservative case with specific data.",
      "thinktank": "Heritage Foundation or similar"
    },
    {
      "label": "Libertarian",
      "summary": "3-4 sentences with citations [N] presenting the libertarian case.",
      "thinktank": "Cato Institute or similar"
    },
    {
      "label": "Pragmatic Center",
      "summary": "3-4 sentences with citations [N] presenting a centrist view.",
      "thinktank": "Brookings Institution or similar"
    }
  ],
  "commonGround": ["Area of agreement 1 [N]", "Area of agreement 2"],
  "keyDisagreements": ["Core disagreement 1 [N]", "Core disagreement 2"],
  "sources": []
}

Always return an empty sources array []. Sources are handled separately.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a world-class debate coach and policy analyst. Every factual claim must be backed by inline citations [1], [2] referencing the provided sources. Present every perspective at its strongest. Return only valid JSON." },
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

export async function generateFollowUpAnswer(
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
  persona?: string | null,
  webResults?: WebSearchResult[],
  govContext?: string,
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

  const historyBlock = history.slice(-8).map((h) => `${h.role}: ${h.content.slice(0, 400)}`).join("\n");
  const personaHint = persona && persona !== "general" ? ` Tailor for a ${persona}'s perspective.` : "";
  const webContext = webResults?.length ? `\n\n${formatWebContext(webResults)}\n` : "";
  const govBlock = govContext ? `\n\n${govContext}\n` : "";
  const hasVerifiedData = !!(govContext || webResults?.length);

  const prompt = `You are a world-class non-partisan civic education assistant answering a follow-up question.

Previous context:
${historyBlock}
${govBlock}${webContext}
Follow-up question: "${message}"${personaHint}
${hasVerifiedData ? CITATION_RULES : ""}
Return ONLY valid JSON:
{
  "policyName": "Clear heading for this follow-up",
  "fullTextSummary": "4-6 sentence answer${hasVerifiedData ? " with inline citations [1], [2]" : ""}.",
  "sections": {
    "summary": "Thorough answer with inline citations after each factual claim.",
    "keyProvisions": ["Point 1 [N]", "Point 2 [N]", "Point 3", "Point 4"],
    "argumentsFor": ["Supporting argument with citation [N]", "Another point [N]"],
    "argumentsAgainst": ["Counterargument with citation [N]", "Another concern [N]"]
  },
  "suggestions": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}

Rules:
- Build on previous context, don't repeat.
- Be specific: real numbers, dollar amounts, statistics, dates.
- Be ANALYTICAL: identify trade-offs, unintended consequences, loopholes.${hasVerifiedData ? "\n- Use the provided data as your PRIMARY factual basis. Cite with [1], [2] etc." : ""}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a world-class policy analyst. Every factual claim must have an inline citation [1], [2] referencing provided sources. Return only valid JSON." },
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
        level: "State", category: "General",
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
