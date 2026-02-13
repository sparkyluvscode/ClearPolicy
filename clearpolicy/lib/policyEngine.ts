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

/** Build stub answer when AI is unavailable or fails */
function stubAnswer(query: string, zipCode?: string | null): Answer {
  const location = zipCode ? `ZIP ${zipCode}` : "your area";
  const sections: AnswerSection = {
    summary: `This is a stub summary for: "${query}". In production, this would be generated from real policy sources.`,
    keyProvisions: ["Key point one (stub)", "Key point two (stub)", "Key point three (stub)"],
    localImpact: zipCode
      ? { zipCode, location, content: `Stub local impact for ${location}.` }
      : undefined,
    argumentsFor: ["Stub argument for (stub)", "Another pro (stub)"],
    argumentsAgainst: ["Stub argument against (stub)"],
  };
  const sources: AnswerSource[] = [
    { id: 1, title: "Sample Federal Source (stub)", url: "https://example.com/federal", domain: "example.com", type: "Federal", verified: true },
    { id: 2, title: "Sample State Source (stub)", url: "https://example.com/state", domain: "example.com", type: "State", verified: true },
  ];
  return {
    policyId: `stub-${Date.now()}`,
    policyName: query.slice(0, 100) || "Policy overview",
    level: "State",
    category: "General",
    fullTextSummary: sections.summary || "",
    sections,
    sources,
  };
}

/**
 * Generate a policy answer from a user query using OpenAI when available.
 * Falls back to stub content if no API key or on error.
 */
export async function generatePolicyAnswer(
  query: string,
  zipCode?: string | null
): Promise<Answer> {
  const client = getOpenAI();
  if (!client) return stubAnswer(query, zipCode);

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
    const sources: AnswerSource[] = rawSources.slice(0, 6).map((s: any, i: number) => ({
      id: i + 1,
      title: s.title || "Source",
      url: s.url || "https://example.com",
      domain: s.domain || "example.com",
      type: ["Federal", "State", "Local", "Web"].includes(s.type) ? s.type : "Web",
      verified: !!s.url,
    }));

    if (sources.length === 0) {
      sources.push(
        { id: 1, title: "Policy overview (AI)", url: "https://example.com", domain: "example.com", type: "Web", verified: false },
      );
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
      summary: `Stub follow-up for: "${message}". Context: ${context.slice(0, 80)}...`,
      keyProvisions: ["Follow-up point one (stub)", "Follow-up point two (stub)"],
      argumentsFor: ["Stub pro"],
      argumentsAgainst: ["Stub con"],
    };
    const sources: AnswerSource[] = [
      { id: 1, title: "Follow-up source (stub)", url: "https://example.com/followup", domain: "example.com", type: "Web", verified: false },
    ];
    return {
      answer: {
        policyId: "stub-followup",
        policyName: "Follow-up",
        level: "State",
        category: "General",
        fullTextSummary: sections.summary || "",
        sections,
        sources,
      },
      suggestions: ["How does this affect renters?", "What are the main criticisms?", "Compare to similar policies"],
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
    const sources: AnswerSource[] = [
      { id: 1, title: "Follow-up (AI)", url: "https://example.com", domain: "example.com", type: "Web", verified: false },
    ];

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
    const sections: AnswerSection = {
      summary: `Stub follow-up for: "${message}". Context: ${context.slice(0, 80)}...`,
      keyProvisions: ["Follow-up point one (stub)", "Follow-up point two (stub)"],
      argumentsFor: ["Stub pro"],
      argumentsAgainst: ["Stub con"],
    };
    const sources: AnswerSource[] = [
      { id: 1, title: "Follow-up source (stub)", url: "https://example.com", domain: "example.com", type: "Web", verified: false },
    ];
    return {
      answer: {
        policyId: "stub-followup",
        policyName: "Follow-up",
        level: "State",
        category: "General",
        fullTextSummary: sections.summary || "",
        sections,
        sources,
      },
      suggestions: ["How does this affect renters?", "What are the main criticisms?", "Compare to similar policies"],
    };
  }
}
