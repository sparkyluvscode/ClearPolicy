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

function flattenArguments(args: (string | { claim?: string; data?: string })[]): string[] {
  return args.map((a) => {
    if (typeof a === "string") return a;
    const claim = a.claim || "";
    const data = a.data || "";
    if (claim && data) return `${claim} — ${data}`;
    return claim || data;
  }).filter(Boolean);
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
        content: "You are an expert research assistant. You provide thorough, source-attributed answers. Every factual claim must include natural-language attribution naming the specific source (e.g. 'According to [Source Name] (Year), ...'). Never use bracketed numeric citations like [1] or [2]. You MUST include specific quantitative data — statistics, dollar figures, percentages, population numbers, vote counts, polling results, budget figures, timelines — with every claim where such data exists. A response without hard numbers is an incomplete response. Aim for 8-10+ distinct data points minimum. Return only valid JSON.",
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
${hasContext || hasDocument ? CITATION_RULES : ""}
${QUANTITATIVE_RULES}${hasDocument ? `
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
    "argumentsFor": [
      { "claim": "According to [Source], argument with evidence...", "data": "$X billion cost estimate according to [Source]" },
      { "claim": "Data from [Source] shows...", "data": "X% of population affected per [Source]" },
      { "claim": "Third argument with source", "data": "Relevant statistic with source" }
    ],
    "argumentsAgainst": [
      { "claim": "According to [Source], counterargument...", "data": "X% opposition per polling by [Source]" },
      { "claim": "[Source] argues that...", "data": "$X million fiscal impact per [Source]" },
      { "claim": "Third argument with source", "data": "Relevant statistic with source" }
    ]
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
          content: "You are a world-class non-partisan policy analyst. Every factual claim must include natural-language attribution naming the specific source (e.g. 'According to the Congressional Budget Office (2024), ...'). Never use bracketed numeric citations like [1] or [2]. You MUST include specific quantitative data — statistics, dollar figures, percentages, population numbers, vote counts, polling results, budget figures, timelines — with every claim where such data exists. A response without hard numbers is an incomplete response. Aim for 8-10+ distinct data points minimum. Return only valid JSON.",
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
      argumentsFor: Array.isArray(sec.argumentsFor) ? flattenArguments(sec.argumentsFor) : [],
      argumentsAgainst: Array.isArray(sec.argumentsAgainst) ? flattenArguments(sec.argumentsAgainst) : [],
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

export interface DebatePerspective {
  label: string;
  description: string;
  summary: string;
  arguments: { title: string; explanation: string; category: string }[];
  thinktank?: string;
}

export async function generateDebateAnswer(
  query: string,
  zipCode?: string | null,
  sourcesContext?: string,
  sources?: AnswerSource[],
): Promise<{ answer: Answer; perspectives: DebatePerspective[] }> {
  const client = getOpenAI();
  if (!client) return { answer: stubAnswer(query, zipCode), perspectives: [] };

  const ctx = sourcesContext || "";
  const srcs = sources || [];
  const zipHint = zipCode ? ` The user is located in ZIP code ${zipCode}. Include how this debate topic specifically affects their area.` : "";
  const hasContext = ctx.length > 0;

  const prompt = `The user wants a comprehensive debate briefing on: "${query}".${zipHint}
${hasContext ? `\n${ctx}\n` : ""}
Provide a thorough, multi-perspective analysis for informed debate preparation.
${hasContext ? CITATION_RULES : ""}
${QUANTITATIVE_RULES}

IMPORTANT INSTRUCTIONS:
- Label each perspective using simple, widely-understood political terms that a high school student would immediately understand.
- Include a one-sentence description of each perspective's general philosophy.
- Do NOT use obscure political science jargon like "Pragmatic Center" or "Progressive Advocate."
- For each perspective, provide a COMPREHENSIVE set of arguments — at least 5 distinct arguments per viewpoint.
- Cover multiple dimensions: constitutional/legal, economic/fiscal, social equity/justice, practical implementation, and political/strategic arguments.
- Do not stop at the most obvious arguments — include nuanced, second-order arguments that an experienced debater would raise.
- If a perspective has a particularly strong or well-known argument that is central to the public debate, make sure it is included.
- Each argument must have a clear title, a 2-3 sentence explanation with specific evidence or data points, and a category.
- Each argument's explanation MUST include at least one specific statistic, dollar figure, percentage, or vote count. Do not provide any argument without a number backing it up.

Return ONLY valid JSON:
{
  "policyName": "Clear title framing the debate",
  "level": "Federal" or "State" or "Local",
  "category": "Short category",
  "fullTextSummary": "3-4 sentence overview${hasContext ? " with natural-language source attributions" : ""}.",
  "thesis": "One clear sentence framing the central question.",
  "perspectives": [
    {
      "label": "Progressive / Left-Leaning",
      "description": "Prioritizes social equity, government intervention, and expanded civil rights.",
      "arguments": [
        { "title": "Argument title", "explanation": "2-3 sentences with specific statistics, dollar figures, or percentages. E.g. 'According to CBO (2024), this would cost $X billion...'", "category": "constitutional" },
        { "title": "...", "explanation": "Include at least one specific number per argument", "category": "economic" },
        { "title": "...", "explanation": "Include polling data with percentages, budget figures, etc.", "category": "social" },
        { "title": "...", "explanation": "Include implementation costs, timeline data, comparative figures", "category": "practical" },
        { "title": "...", "explanation": "Include vote counts, election data, polling numbers", "category": "political" }
      ],
      "thinktank": "Center for American Progress or similar"
    },
    {
      "label": "Conservative / Right-Leaning",
      "description": "Prioritizes individual liberty, limited government, and traditional institutions.",
      "arguments": [ ... at least 5 arguments across categories ... ],
      "thinktank": "Heritage Foundation or similar"
    },
    {
      "label": "Libertarian",
      "description": "Prioritizes individual freedom and minimal government involvement.",
      "arguments": [ ... at least 5 arguments across categories ... ],
      "thinktank": "Cato Institute or similar"
    },
    {
      "label": "Centrist / Moderate",
      "description": "Seeks practical compromise, weighing trade-offs from both sides.",
      "arguments": [ ... at least 5 arguments across categories ... ],
      "thinktank": "Brookings Institution or similar"
    }
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
        {
          role: "system",
          content: "You are a world-class debate coach preparing students for competitive debate. Every factual claim must include natural-language attribution naming the specific source (e.g. 'According to [Source Name] (Year), ...'). Never use bracketed numeric citations. Present every perspective at its absolute strongest — an experienced debater from that viewpoint should feel their position is well-represented. Use simple, widely-understood political labels. Provide at least 5 distinct arguments per viewpoint. You MUST include specific quantitative data — statistics, dollar figures, percentages, population numbers, vote counts, polling results, budget figures — in every argument explanation. A debate argument without a number to back it up is a weak argument. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content);

    const perspectives: DebatePerspective[] =
      Array.isArray(parsed.perspectives)
        ? parsed.perspectives.map((p: any) => ({
            label: p.label || "Perspective",
            description: p.description || "",
            summary: p.summary || (Array.isArray(p.arguments) ? p.arguments.map((a: any) => `${a.title}: ${a.explanation}`).join(" ") : ""),
            arguments: Array.isArray(p.arguments)
              ? p.arguments.map((a: any) => ({
                  title: a.title || "",
                  explanation: a.explanation || "",
                  category: a.category || "general",
                }))
              : [],
            thinktank: p.thinktank,
          }))
        : [];

    // Log warning if any perspective has thin arguments
    for (const p of perspectives) {
      if (p.arguments.length < 4) {
        console.warn(`[Debate] Perspective "${p.label}" has only ${p.arguments.length} arguments (target: 5+)`);
      }
    }

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

export type FollowUpIntent =
  | "more_data"
  | "go_deeper"
  | "different_angle"
  | "simplify"
  | "source_specific"
  | "general_followup";

export interface FollowUpResult {
  answer: Answer;
  suggestions: string[];
  intent: FollowUpIntent;
  depthLevel: number;
}

export async function generateFollowUpAnswer(
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
  persona?: string | null,
  sourcesContext?: string,
  sources?: AnswerSource[],
  followUpIntent?: FollowUpIntent,
  depthLevel?: number,
): Promise<FollowUpResult> {
  const client = getOpenAI();
  const intent: FollowUpIntent = followUpIntent || "general_followup";
  const depth = depthLevel || 1;

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
      intent,
      depthLevel: depth,
    };
  }

  const ctx = sourcesContext || "";
  const srcs = sources || [];
  const historyBlock = history.slice(-10).map((h) => `${h.role}: ${h.content.slice(0, 600)}`).join("\n");
  const personaHint = persona && persona !== "general" ? ` Tailor for a ${persona}'s perspective.` : "";
  const hasContext = ctx.length > 0;

  const previousResponseSummary = history
    .filter(h => h.role === "assistant")
    .map(h => h.content.slice(0, 300))
    .join("\n---\n");

  const depthInstruction = depth > 1
    ? `\n\nDEPTH LEVEL: ${depth}. The user has already seen Level ${depth - 1} information. Go SIGNIFICANTLY deeper. Provide information a policy researcher would find in their ${depth === 2 ? "second" : depth === 3 ? "third" : "fourth+"} hour of research, not their first ten minutes. DO NOT rehash the overview.`
    : "";

  const antiRepetition = `
ANTI-REPETITION (CRITICAL):
The user has already received this information:
---
${previousResponseSummary}
---
Your response MUST contain at least 80% NEW information not present above. Do NOT restate arguments, statistics, or points already made. If you must reference a previous point for context, do so in ONE sentence, then move to entirely new material.`;

  let intentPrompt: string;
  let jsonSchema: string;
  let systemMessage: string;

  switch (intent) {
    case "more_data":
      systemMessage = "You are a quantitative policy analyst producing structured statistical reports with tables. Every claim must have a number attached. Return only valid JSON.";
      intentPrompt = `The user wants MORE QUANTITATIVE DATA. Generate a DATA REPORT with NUMBERS: statistics, dollar amounts, percentages, polling data, demographic figures, cost estimates, timelines, vote counts, and comparative data.

MINIMUM REQUIREMENTS:
- At least 15 distinct, specific statistics/data points
- At least one structured data table with 5+ rows
- Economic, demographic, polling/opinion, and historical data sections
- Each statistic must name its source`;
      jsonSchema = `{
  "policyName": "Quantitative Analysis: [Topic]",
  "fullTextSummary": "Brief intro stating this is a data-focused analysis with key headline figures.",
  "sections": {
    "dataTable": {
      "headers": ["Metric", "Figure", "Source", "Year"],
      "rows": [["metric name", "specific figure", "source name", "year"]]
    },
    "summary": "2-3 sentences of context with headline statistics.",
    "economicData": ["According to [Source], $X billion...", "Data from [Source] shows X%..."],
    "demographicData": ["According to [Source], X million people..."],
    "pollingData": ["A [Year] poll by [Source] found X%..."],
    "historicalData": ["Since [Year], [Source] reports X% change..."],
    "keyProvisions": ["Stat 1 from [Source]", "Stat 2 from [Source]", "Stat 3", "Stat 4", "Stat 5"]
  },
  "suggestions": ["Follow-up 1", "Follow-up 2", "Follow-up 3"]
}`;
      break;

    case "go_deeper":
      systemMessage = `You are an expert policy analyst writing a ${depth >= 3 ? "research paper" : "policy brief"}-level deep dive. Go beyond surface arguments to nuanced implications, edge cases, expert opinions, and unintended consequences. Return only valid JSON.`;
      intentPrompt = `The user wants to GO DEEPER. Provide ${depth >= 3 ? "expert-level" : "second-order"} analysis:
${depth >= 3 ? "- Primary source references, legislative text excerpts, committee hearing testimony\n- Academic research, international comparisons, scenario modeling" : "- Expanded arguments with granular data, expert quotes, historical context\n- Implementation details, edge cases, unintended consequences"}

Do NOT repeat the overview or basic arguments.`;
      jsonSchema = `{
  "policyName": "${depth >= 3 ? "Expert Analysis" : "Deep Dive"}: [Topic]",
  "fullTextSummary": "4-6 sentences of deep analysis${hasContext ? " with source attributions" : ""}.",
  "sections": {
    "summary": "In-depth analysis going beyond the basics.",
    "keyProvisions": ["Nuanced point 1", "Edge case", "Implementation detail", "Historical parallel", "Expert opinion"],
    "argumentsFor": ["Deep supporting argument", "Second-order benefit"],
    "argumentsAgainst": ["Deep counter-argument", "Unintended consequence"]
  },
  "suggestions": ["Follow-up 1", "Follow-up 2", "Follow-up 3"]
}`;
      break;

    case "different_angle":
      systemMessage = "You are a policy analyst exploring an alternative angle on the topic. Focus specifically on the perspective the user is asking about. Return only valid JSON.";
      intentPrompt = `The user wants a DIFFERENT ANGLE: "${message}". Focus your ENTIRE response on this specific dimension with specific data, expert opinions, and examples. Do not repeat the general overview.`;
      jsonSchema = `{
  "policyName": "Perspective: [The specific angle]",
  "fullTextSummary": "4-6 sentences focused on this specific angle.",
  "sections": {
    "summary": "Focused analysis of this specific dimension.",
    "keyProvisions": ["Key finding 1", "Key finding 2", "Key finding 3", "Key finding 4"],
    "argumentsFor": ["Argument from this angle", "Supporting data"],
    "argumentsAgainst": ["Counter-argument from this angle", "Opposing data"]
  },
  "suggestions": ["Follow-up 1", "Follow-up 2", "Follow-up 3"]
}`;
      break;

    case "simplify":
      systemMessage = "You are a civic educator explaining policy to a general audience. Use plain language, short sentences, everyday analogies. Return only valid JSON.";
      intentPrompt = `The user wants a SIMPLER explanation. Use plain, everyday language (8th grade level), short sentences, and real-world analogies.`;
      jsonSchema = `{
  "policyName": "Simply Explained: [Topic]",
  "fullTextSummary": "3-4 simple sentences explaining the core idea.",
  "sections": {
    "summary": "Simple, clear explanation anyone can understand.",
    "keyProvisions": ["Simple point 1", "Simple point 2", "Simple point 3"]
  },
  "suggestions": ["Follow-up 1", "Follow-up 2", "Follow-up 3"]
}`;
      break;

    case "source_specific":
      systemMessage = "You are a research librarian helping a user understand what a specific source says about a topic. Focus exclusively on that source's publications and analysis. Return only valid JSON.";
      intentPrompt = `The user wants to know what a SPECIFIC SOURCE says: "${message}". Focus your ENTIRE response on that source's publications, reports, data, and official positions.`;
      jsonSchema = `{
  "policyName": "Source Analysis: [Source Name] on [Topic]",
  "fullTextSummary": "What this source has published and concluded.",
  "sections": {
    "summary": "Overview of the source's position and key findings.",
    "keyProvisions": ["Finding 1", "Report/publication 2", "Data point 3", "Position 4"],
    "argumentsFor": ["This source's supporting arguments"],
    "argumentsAgainst": ["This source's concerns or limitations"]
  },
  "suggestions": ["Follow-up 1", "Follow-up 2", "Follow-up 3"]
}`;
      break;

    default:
      systemMessage = "You are a world-class policy analyst. Every factual claim must include natural-language attribution. Return only valid JSON.";
      intentPrompt = "Answer the follow-up question with NEW information beyond what was previously discussed.";
      jsonSchema = `{
  "policyName": "Clear heading for this follow-up",
  "fullTextSummary": "4-6 sentence answer${hasContext ? " with source attributions" : ""}.",
  "sections": {
    "summary": "Thorough answer with source attributions.",
    "keyProvisions": ["Point 1", "Point 2", "Point 3", "Point 4"],
    "argumentsFor": ["Supporting argument 1", "Supporting argument 2"],
    "argumentsAgainst": ["Counter-argument 1", "Counter-argument 2"]
  },
  "suggestions": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}`;
  }

  const prompt = `Previous conversation:
${historyBlock}
${hasContext ? `\nSOURCES:\n${ctx}\n` : ""}
Follow-up question: "${message}"${personaHint}
${depthInstruction}
${antiRepetition}

${intentPrompt}

${hasContext ? CITATION_RULES : ""}
${QUANTITATIVE_RULES}

Return ONLY valid JSON with this structure:
${jsonSchema}

Rules:
- Your response must contain at least 80% NEW information not in previous responses.
- Be specific: real numbers, dollar amounts, statistics, dates.${hasContext ? "\n- Use the provided numbered sources. Attribute by name using 'According to...' style. NEVER use [1], [2]." : ""}
${depth >= 3 && hasContext ? "- If you have exhausted available source material, be transparent: 'I have provided the most comprehensive data available. For additional primary data, consult [specific databases] directly.'" : ""}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: intent === "more_data" ? 0.3 : intent === "simplify" ? 0.5 : 0.4,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    const parsed = JSON.parse(content);
    const sec = parsed.sections || {};

    let sections: AnswerSection;
    if (intent === "more_data" && sec.dataTable) {
      const tableContent = formatDataTable(sec.dataTable);
      const dataSections = [sec.economicData, sec.demographicData, sec.pollingData, sec.historicalData]
        .filter(Boolean)
        .map((arr: unknown, i: number) => {
          const labels = ["Economic Data", "Demographic Data", "Polling & Public Opinion", "Historical Trends"];
          return `### ${labels[i] || "Additional Data"}\n${(Array.isArray(arr) ? arr : []).join("\n")}`;
        })
        .join("\n\n");

      sections = {
        summary: sec.summary || parsed.fullTextSummary || "",
        keyProvisions: Array.isArray(sec.keyProvisions)
          ? [tableContent, ...sec.keyProvisions].filter(Boolean)
          : tableContent ? [tableContent] : [],
        argumentsFor: Array.isArray(sec.economicData) ? sec.economicData : [],
        argumentsAgainst: Array.isArray(sec.pollingData) ? sec.pollingData : [],
        overview: dataSections || undefined,
      };
    } else {
      sections = {
        summary: sec.summary || parsed.fullTextSummary || "",
        keyProvisions: Array.isArray(sec.keyProvisions) ? sec.keyProvisions : [],
        argumentsFor: Array.isArray(sec.argumentsFor) ? flattenArguments(sec.argumentsFor) : [],
        argumentsAgainst: Array.isArray(sec.argumentsAgainst) ? flattenArguments(sec.argumentsAgainst) : [],
      };
    }

    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 4) : [
      "Show me the numbers",
      "Go deeper on this",
      "What are the main criticisms?",
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
      intent,
      depthLevel: depth,
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
      intent,
      depthLevel: depth,
    };
  }
}

function formatDataTable(dataTable: { headers?: string[]; rows?: string[][] }): string {
  if (!dataTable?.headers?.length || !dataTable?.rows?.length) return "";
  const headers = dataTable.headers;
  const rows = dataTable.rows;
  const sep = headers.map(() => "---").join(" | ");
  return `${headers.join(" | ")}\n${sep}\n${rows.map(r => r.join(" | ")).join("\n")}`;
}
