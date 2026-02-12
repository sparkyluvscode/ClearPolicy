import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { classifyQuery } from "@/lib/omni-classifier";
import type {
  OmniRequest,
  OmniResponse,
  Source,
  AnswerSection,
  PerspectiveView,
  RhetoricCheck,
  Persona,
} from "@/lib/omni-types";

/**
 * POST /api/omni
 *
 * The Omni-Search resolver — Phase 2.
 * Three "Moat Features":
 *  1. Rhetoric vs. Reality: separates "what they say" from "what the text enforces"
 *  2. Persona-first filtering: adapts content to Student / Homeowner / etc.
 *  3. Red Pen citation enforcement: every sentence cited or flagged
 */

// ── OpenAI client ──
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return openai;
}

// ═══════════════════════════════════════════════════════════════
//  RETRIEVAL LAYER  (unchanged — web, Congress, OpenStates, GovInfo)
// ═══════════════════════════════════════════════════════════════

async function webSearch(query: string, maxResults = 5): Promise<Source[]> {
  const sources: Source[] = [];
  if (process.env.TAVILY_API_KEY) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query,
          max_results: maxResults,
          include_answer: false,
          include_raw_content: false,
          search_depth: "advanced",
        }),
      });
      const data = await res.json();
      for (const r of data.results || []) {
        sources.push({
          id: `web-${sources.length}`,
          type: "web_search",
          title: r.title || "Web result",
          url: r.url,
          snippet: r.content || "",
          publisher: r.url ? new URL(r.url).hostname.replace("www.", "") : undefined,
          relevance: r.score || 0.5,
        });
      }
    } catch (e) {
      console.error("[Omni] Tavily search failed:", e);
    }
  }

  if (sources.length === 0) {
    try {
      const ddg = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
        { signal: AbortSignal.timeout(3000) }
      );
      const data = await ddg.json();
      if (data.AbstractText) {
        sources.push({
          id: "ddg-abstract",
          type: "web_search",
          title: data.Heading || "DuckDuckGo Summary",
          url: data.AbstractURL,
          snippet: data.AbstractText,
          publisher: data.AbstractSource,
          relevance: 0.6,
        });
      }
      for (const topic of (data.RelatedTopics || []).slice(0, 3)) {
        if (topic.Text && topic.FirstURL) {
          sources.push({
            id: `ddg-${sources.length}`,
            type: "web_search",
            title: topic.Text.slice(0, 100),
            url: topic.FirstURL,
            snippet: topic.Text,
            relevance: 0.4,
          });
        }
      }
    } catch (e) {
      console.error("[Omni] DuckDuckGo fallback failed:", e);
    }
  }
  return sources;
}

async function searchCongressBills(query: string): Promise<Source[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.congress.gov/v3/bill?query=${encodeURIComponent(query)}&limit=3&api_key=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    return (data.bills || []).map((bill: any, i: number) => ({
      id: `congress-${i}`,
      type: "federal_bill" as const,
      title: bill.title || `${bill.type} ${bill.number}`,
      url: bill.url || `https://congress.gov/bill/${bill.congress}th-congress/${bill.type?.toLowerCase()}-bill/${bill.number}`,
      snippet: bill.title || "",
      publisher: "Congress.gov",
      publishedDate: bill.latestAction?.actionDate,
      relevance: 0.8,
      jurisdiction: "federal" as const,
    }));
  } catch (e) {
    console.error("[Omni] Congress.gov search failed:", e);
    return [];
  }
}

async function searchStateBills(query: string, state?: string, year?: string): Promise<Source[]> {
  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) return [];
  try {
    const jurisdiction = state ? state.toLowerCase() : "california";
    let url = "https://v3.openstates.org/bills?q=" +
      encodeURIComponent(query) +
      `&jurisdiction=${jurisdiction}&sort=updated_desc&per_page=5&apikey=${apiKey}`;
    // If year is specified, use session filter
    if (year) {
      url += `&session=${year}`;
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return (data.results || []).map((bill: any, i: number) => ({
      id: `state-${i}`,
      type: "state_bill" as const,
      title: bill.title || `${bill.identifier}`,
      url: bill.openstates_url,
      snippet: bill.title || "",
      publisher: "OpenStates",
      publishedDate: bill.latest_action_date,
      relevance: 0.75,
      jurisdiction: "state" as const,
    }));
  } catch (e) {
    console.error("[Omni] OpenStates search failed:", e);
    return [];
  }
}

async function searchGovInfo(query: string): Promise<Source[]> {
  try {
    const apiKey = process.env.GOVINFO_API_KEY;
    const keyParam = apiKey ? `&api_key=${apiKey}` : "";
    const res = await fetch(
      `https://api.govinfo.gov/search?query=${encodeURIComponent(query)}&pageSize=3&offsetMark=*&collection=BILLS,PLAW,CFR${keyParam}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((r: any, i: number) => ({
      id: `govinfo-${i}`,
      type: "government_site" as const,
      title: r.title || "GovInfo Document",
      url: r.detailsLink || r.pdfLink,
      snippet: r.title || "",
      publisher: "GovInfo.gov",
      publishedDate: r.dateIssued,
      relevance: 0.7,
      jurisdiction: "federal" as const,
    }));
  } catch (e) {
    console.error("[Omni] GovInfo search failed:", e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
//  PERSONA FILTER INSTRUCTIONS
// ═══════════════════════════════════════════════════════════════

const PERSONA_FILTERS: Record<Persona, string> = {
  general: "",
  student: `PERSONA FILTER — STUDENT:
You MUST write the answer entirely from the perspective of a student (K-12 or college).
- FOCUS ON: tuition, FAFSA, student loans, campus rules, curriculum, graduation, internships, student visas (F-1/J-1), campus safety.
- IGNORE: administrative funding formulas, agency budgets, government procurement, corporate compliance unless it directly touches students.
- Frame impacts as: "If you're a student, this means…"`,

  homeowner: `PERSONA FILTER — HOMEOWNER:
You MUST write the answer entirely from the perspective of a homeowner.
- FOCUS ON: property taxes, zoning changes, HOA rules, mortgage rates, home insurance, home energy credits, neighborhood safety, infrastructure.
- IGNORE: rental assistance programs, student aid, immigration processes unless they directly affect property owners.
- Frame impacts as: "If you own a home, this means…"`,

  small_biz: `PERSONA FILTER — SMALL BUSINESS OWNER:
You MUST write the answer entirely from the perspective of a small business owner (under 50 employees).
- FOCUS ON: tax obligations, payroll rules, permits, regulations, ADA compliance, labor law, SBA programs, supply chain.
- IGNORE: personal student loans, residential zoning, individual immigration unless it affects hiring.
- Frame impacts as: "If you run a small business, this means…"`,

  renter: `PERSONA FILTER — RENTER:
You MUST write the answer entirely from the perspective of a renter/tenant.
- FOCUS ON: rent control, eviction protections, security deposits, habitability standards, tenant rights, lease terms, Section 8.
- IGNORE: property tax, HOA rules, mortgage policy, corporate regulations.
- Frame impacts as: "If you're a renter, this means…"`,

  immigrant: `PERSONA FILTER — IMMIGRANT:
You MUST write the answer entirely from the perspective of someone navigating the US immigration system.
- FOCUS ON: visa categories, green card processes, USCIS rules, asylum policy, DACA, work authorization, naturalization, travel restrictions.
- IGNORE: property tax, school curriculum details, small business permits unless they relate to immigration status.
- Frame impacts as: "If you're an immigrant or visa holder, this means…"`,

  parent: `PERSONA FILTER — PARENT:
You MUST write the answer entirely from the perspective of a parent/guardian.
- FOCUS ON: school choice, childcare costs, child tax credits, family leave, child safety, healthcare for children, school meals.
- IGNORE: student visa rules, commercial regulations, corporate policy unless they directly impact families.
- Frame impacts as: "If you're a parent, this means…"`,
};

// ═══════════════════════════════════════════════════════════════
//  SYSTEM PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════

function buildSystemPrompt(
  intent: string,
  sources: Source[],
  debateMode: boolean,
  readingLevel: string,
  persona: Persona,
  needsRhetoricCheck: boolean,
): string {
  const sourceContext = sources
    .map(
      (s, i) =>
        `[${i + 1}] ${s.title}\n    URL: ${s.url || "N/A"}\n    Snippet: ${s.snippet.slice(0, 400)}`
    )
    .join("\n\n");

  const gradeDesc =
    readingLevel === "5"
      ? "5th-grade (very simple)"
      : readingLevel === "12"
        ? "college-level (detailed)"
        : "8th-grade (standard)";

  // ── Moat #3: Red Pen Citation Enforcement ──
  // Build a list of valid source numbers for the prompt
  const validSourceNums = sources.map((_, i) => `[${i + 1}]`).join(", ") || "none available";

  const redPenRules = `
CITATION ENFORCEMENT (STRICT — "RED PEN" MODE):
- You are FORBIDDEN from writing a factual sentence without a bracketed citation like [1], [2], [3], etc.
- The valid source numbers are: ${validSourceNums}
- NEVER write "[N]" literally — always use the actual source number like [1] or [2].
- Every paragraph must contain at least one citation referencing a specific source number.
- If you cannot find a source in the RETRIEVED SOURCES for a claim:
    (a) OMIT the claim entirely, OR
    (b) Label it explicitly: "(General Knowledge) ..." at the start of the sentence.
- If a section has zero citations from retrieved sources, set its "confidence" to "unverified".
- If all claims are backed by sources, set "confidence" to "verified".
- If some claims are backed and some are general knowledge, set "confidence" to "inferred".
- NEVER invent a URL or source title. Only reference source numbers from the RETRIEVED SOURCES list above.`;

  // ── Moat #1: Rhetoric vs. Reality ──
  let rhetoricInstructions = "";
  if (needsRhetoricCheck) {
    rhetoricInstructions = `
RHETORIC VS. REALITY CHECK (required for this intent):
In addition to the main answer, you MUST output a "rhetoric_check" object.
This is the core trust feature. Analyze the gap between what the legislation is *named/marketed as* versus what the legal text *actually does*.

Steps:
1. Extract the official title, subtitle, or "Findings" section — this is "The Pitch".
2. Extract the enactment/enforcement clauses — this is "The Mechanism".
3. Compare them. Is the title accurate? Misleading? Overly broad?
4. Write a "delta_analysis" string.
   Example: "The bill is titled 'Inflation Reduction Act', but the enacted text primarily focuses on clean energy subsidies (Sections 13101–13802) and Medicare drug pricing (Section 11001), with no direct anti-inflation mechanism."
5. Set "severity": "none" if title matches text, "minor" if slightly broader, "significant" if the title is misleading relative to the text.
6. List specific clause/section references in "clause_references".

Format (use real source numbers, not "[N]"):
"rhetoric_check": {
  "official_title": "The bill's stated name or purpose",
  "actual_mechanism": "What the enacted clauses actually do",
  "delta_analysis": "A sentence describing the gap between pitch and mechanism, or null if no gap",
  "severity": "none" or "minor" or "significant",
  "clause_references": ["Section 4", "Clause 7(b)"],
  "citations": [1, 3]
}`;
  }

  // ── Moat #2: Persona filter ──
  const personaBlock = PERSONA_FILTERS[persona] || "";

  // ── Debate mode ──
  let debateInstructions = "";
  if (debateMode) {
    debateInstructions = `
DEBATE/PERSPECTIVE MODE:
In addition to the main answer, provide a "perspectives" array with exactly 3 entries:
1. "Progressive" — interpretation from a progressive/left-leaning perspective
2. "Conservative" — interpretation from a conservative/right-leaning perspective
3. "Textual" — what the actual text/law literally says, no interpretation
Each perspective must cite actual source numbers like [1], [2], etc.`;
  }

  return `You are ClearPolicy, a Policy Intelligence Engine that rivals Perplexity in depth but exceeds it in trust and localization.

${redPenRules}

ADDITIONAL RULES:
1. Write at a ${gradeDesc} reading level.
2. Be factual and non-partisan. Present information, not opinions.
3. If the query involves a specific location, prioritize local context.
4. Generate 2-3 follow-up questions the user might want to ask.

DETECTED INTENT: ${intent}
${personaBlock ? `\n${personaBlock}` : ""}

RETRIEVED SOURCES:
${sourceContext || "No sources were retrieved. Every claim must be labeled (General Knowledge). Set all section confidence to 'unverified'."}
${rhetoricInstructions}
${debateInstructions}

RESPONSE FORMAT (strict JSON — you MUST output valid JSON with real source numbers, NOT "[N]" literally):
{
  "title": "Clear headline for the answer",
  "tldr": "One-sentence summary — must contain a real citation like [1]",
  "sections": [
    {
      "heading": "Section title",
      "content": "Every factual claim cites a specific source like [1] or [2]. Example: The act provides tax credits for solar panels [1] and expands Medicare negotiation [3].",
      "citations": [1, 2],
      "confidence": "verified"
    }
  ],
  ${needsRhetoricCheck ? `"rhetoric_check": { "official_title": "The stated name", "actual_mechanism": "What the text actually enforces", "delta_analysis": "Description of the gap, or null if none", "severity": "none", "clause_references": ["Section 4"], "citations": [1] },` : ""}
  "perspectives": ${debateMode ? `[{"label": "Progressive", "summary": "...", "citations": [1]}, {"label": "Conservative", "summary": "...", "citations": [2]}, {"label": "Textual", "summary": "...", "citations": [1, 2]}]` : "null"},
  "followUps": ["Question 1?", "Question 2?"],
  "warnings": ["Any caveats or data gaps"]
}

IMPORTANT: "confidence" must be one of: "verified", "inferred", "unverified".
IMPORTANT: "severity" must be one of: "none", "minor", "significant".
Respond ONLY with valid JSON. No markdown fences, no code blocks.`;
}

// ═══════════════════════════════════════════════════════════════
//  POST-PROCESSING: Red Pen Validation
// ═══════════════════════════════════════════════════════════════

/**
 * Enforce citation presence. If a section has no [N] patterns at all,
 * downgrade its confidence to "unverified".
 */
function redPenValidate(sections: AnswerSection[]): AnswerSection[] {
  return sections.map((s) => {
    const citationMatches = s.content.match(/\[\d+\]/g);
    const generalKnowledge = s.content.includes("(General Knowledge)");

    if (!citationMatches || citationMatches.length === 0) {
      return { ...s, confidence: "unverified", citations: [] };
    }

    // Extract actual citation numbers from content
    const foundCitations = [
      ...new Set(citationMatches.map((m) => parseInt(m.replace(/[[\]]/g, ""), 10))),
    ];

    // If we have citations but also general knowledge claims, downgrade to inferred
    if (generalKnowledge) {
      return { ...s, confidence: "inferred", citations: foundCitations };
    }

    return { ...s, confidence: "verified", citations: foundCitations };
  });
}

// ═══════════════════════════════════════════════════════════════
//  MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = (await req.json()) as OmniRequest;
    const {
      query,
      zip,
      readingLevel = "8",
      debateMode = false,
      persona = "general",
      documentText,
    } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Query is required." },
        { status: 400 }
      );
    }
    if (query.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Query too long (max 2000 chars)." },
        { status: 400 }
      );
    }

    // ── Step 1: Classify ──
    const classified = classifyQuery(query, !!documentText);
    if (zip) classified.zip = zip;

    // Rhetoric check only makes sense for named bills, not general legal explainers
    const needsRhetoricCheck = classified.intent === "bill_lookup";

    console.log(
      `[Omni] Intent: ${classified.intent} | Persona: ${persona} | Rhetoric: ${needsRhetoricCheck} | ZIP: ${classified.zip || "none"} | State: ${classified.state || "none"} | Year: ${classified.year || "none"}`
    );

    // ── Step 2: Retrieve sources ──
    const retrievalPromises: Promise<Source[]>[] = [];
    // Build a smarter web search query that includes state and year context
    const enrichedQuery = [
      query,
      classified.state && !query.toLowerCase().includes(classified.state.toLowerCase()) ? classified.state : "",
    ].filter(Boolean).join(" ");
    retrievalPromises.push(webSearch(enrichedQuery));

    switch (classified.intent) {
      case "bill_lookup": {
        const searchTerm = classified.billId || query;
        // For propositions, include state context in the search
        const isProp = /\b(prop|proposition)\s+\d+/i.test(query);
        const stateForSearch = classified.state || (isProp ? "california" : undefined);
        const yearForSearch = classified.year;

        retrievalPromises.push(searchCongressBills(searchTerm));
        retrievalPromises.push(searchStateBills(searchTerm, stateForSearch, yearForSearch));
        retrievalPromises.push(searchGovInfo(searchTerm));

        // Extra targeted web search for propositions with state + year
        if (isProp && (stateForSearch || yearForSearch)) {
          const propWebQuery = `${stateForSearch || "california"} ${searchTerm} ${yearForSearch || ""} ballot proposition`.trim();
          retrievalPromises.push(webSearch(propWebQuery));
        }
        break;
      }
      case "legal_explainer":
        retrievalPromises.push(searchGovInfo(query));
        retrievalPromises.push(searchCongressBills(query));
        // Add a targeted web search for regulations/legal explainers
        retrievalPromises.push(webSearch(`${query} site:gov OR site:uscis.gov OR site:law.cornell.edu`));
        break;
      case "local_ballot":
        retrievalPromises.push(searchStateBills(query, classified.state, classified.year));
        retrievalPromises.push(
          webSearch(`${query} ${classified.zip || ""} ballot measures local elections`)
        );
        break;
      case "debate_prep":
        retrievalPromises.push(webSearch(`${query} progressive perspective policy`));
        retrievalPromises.push(webSearch(`${query} conservative perspective policy`));
        break;
      case "news_update":
        retrievalPromises.push(searchCongressBills(query));
        retrievalPromises.push(webSearch(`${query} latest news 2026`));
        break;
      default:
        retrievalPromises.push(searchCongressBills(query));
        retrievalPromises.push(searchStateBills(query, classified.state, classified.year));
        break;
    }

    const allResults = await Promise.allSettled(retrievalPromises);
    let sources: Source[] = [];
    for (const result of allResults) {
      if (result.status === "fulfilled") sources.push(...result.value);
    }

    // Deduplicate, sort, limit
    const seenUrls = new Set<string>();
    sources = sources
      .filter((s) => {
        if (!s.url) return true;
        if (seenUrls.has(s.url)) return false;
        seenUrls.add(s.url);
        return true;
      })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 15)
      .map((s, i) => ({ ...s, id: `src-${i + 1}` }));

    console.log(`[Omni] Retrieved ${sources.length} sources`);

    // ── Step 3: Generate with LLM ──
    const client = getOpenAI();
    const systemPrompt = buildSystemPrompt(
      classified.intent,
      sources,
      debateMode || classified.needsDebate,
      readingLevel,
      persona as Persona,
      needsRhetoricCheck,
    );

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: documentText
            ? `DOCUMENT TEXT:\n${documentText.slice(0, 8000)}\n\nQUESTION: ${query}`
            : query,
        },
      ],
      temperature: 0.3,
      max_tokens: 3500,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { success: false, error: "No response generated." },
        { status: 500 }
      );
    }

    // ── Step 4: Parse ──
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("[Omni] Failed to parse LLM JSON:", raw.slice(0, 300));
      return NextResponse.json(
        { success: false, error: "Failed to parse response." },
        { status: 500 }
      );
    }

    // ── Step 5: Red Pen validation ──
    let sections: AnswerSection[] = (parsed.sections || []).map((s: any) => ({
      heading: s.heading || "Details",
      content: s.content || "",
      citations: Array.isArray(s.citations) ? s.citations : [],
      confidence: s.confidence || "inferred",
    }));

    sections = redPenValidate(sections);

    // Perspectives
    let perspectives: PerspectiveView[] | undefined;
    if (parsed.perspectives && Array.isArray(parsed.perspectives)) {
      perspectives = parsed.perspectives.map((p: any) => ({
        label: p.label || "Perspective",
        summary: p.summary || "",
        citations: Array.isArray(p.citations) ? p.citations : [],
        thinktank: p.thinktank,
      }));
    }

    // Rhetoric check
    let rhetoricCheck: RhetoricCheck | undefined;
    if (parsed.rhetoric_check && needsRhetoricCheck) {
      const rc = parsed.rhetoric_check;
      rhetoricCheck = {
        officialTitle: rc.official_title || "",
        actualMechanism: rc.actual_mechanism || "",
        deltaAnalysis: rc.delta_analysis || null,
        severity: rc.severity || "none",
        clauseReferences: Array.isArray(rc.clause_references) ? rc.clause_references : [],
        citations: Array.isArray(rc.citations) ? rc.citations : [],
      };
    }

    // ── Step 6: Build response ──
    const processingTimeMs = Date.now() - startTime;

    const response: OmniResponse = {
      id: `omni-${Date.now()}`,
      intent: classified.intent,
      title: parsed.title || "Policy Analysis",
      tldr: parsed.tldr || "",
      sections,
      sources,
      perspectives,
      rhetoricCheck,
      persona: persona as Persona,
      followUps: Array.isArray(parsed.followUps) ? parsed.followUps : [],
      model: "gpt-4o-mini",
      processingTimeMs,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    };

    console.log(
      `[Omni] Done in ${processingTimeMs}ms | ${sections.length} sections | ${sources.length} sources | rhetoric=${!!rhetoricCheck} | persona=${persona}`
    );

    return NextResponse.json({ success: true, data: response });
  } catch (error: unknown) {
    console.error("[Omni] Error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
