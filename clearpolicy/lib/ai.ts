import OpenAI from "openai";
import { simplify, fleschKincaidGrade } from "@/lib/reading";
import { matchKnownSummary } from "@/lib/known-summaries";
import type { EvidenceCitation } from "@/lib/summary-types";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export interface SummaryRequest {
  title: string;
  content: string; // Can be impact clause, abstract, latest action, etc.
  subjects?: string[];
  identifier?: string;
  type: "bill" | "proposition";
  year?: string;
}

export interface LevelContent {
  tldr: string;
  whatItDoes: string;
  whoAffected: string;
  pros: string[];
  cons: string[];
}

export interface GeneratedSummary {
  levels: {
    "5": LevelContent;
    "8": LevelContent;
    "12": LevelContent;
  };
  year?: string; // Verified election year if found
  citations?: EvidenceCitation[];
  readability?: { "5": number; "8": number; "12": number };
}

/**
 * Uses AI to generate a comprehensive summary of a bill or proposition
 * from raw data. This replaces hardcoded databases with dynamic analysis.
 */
export async function generateSummary(req: SummaryRequest): Promise<GeneratedSummary> {
  const client = getOpenAI();
  const known = matchKnownSummary(req);
  if (known) return attachReadability(known);
  if (!client) {
    // Fallback if no API key
    return generateFallbackSummary(req);
  }

  // Even with minimal content, try AI if we at least have a title — GPT can
  // produce a real summary from just the bill name (e.g. "Inflation Reduction Act").
  const hasUsableInput = (req.title && req.title.length > 3) ||
    (req.content && req.content.length > 5) ||
    (req.subjects && req.subjects.length > 0);
  if (!hasUsableInput) {
    return generateFallbackSummary(req);
  }

  try {
    const prompt = buildPrompt(req);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // Fast, capable, and cost-effective
      messages: [
        {
          role: "system",
          content: "You are a non-partisan civic education assistant. Your job is to analyze legislation and ballot measures and provide clear, neutral summaries that help voters understand what they're voting on. Always be factual, neutral, and focus on what the measure actually does rather than taking sides. Return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent/factual output
    });

    const content = completion.choices[0].message.content;

    if (!content) {
      return generateFallbackSummary(req);
    }

    return parseAIResponse(content, req);
  } catch (error: any) {
    console.error("AI summary generation failed:", error);
    // Handle quota/rate limit errors
    if (error?.message?.includes("quota") || error?.message?.includes("429") || error?.message?.includes("rate limit")) {
      console.warn("OpenAI API quota exceeded. Using fallback summary.");
    }
    // If it's an API key error, log it clearly
    if (error?.message?.includes("API key") || error?.message?.includes("credentials")) {
      console.warn("OpenAI API key may be invalid or missing. Using fallback summary.");
    }
    return generateFallbackSummary(req);
  }
}

function buildPrompt(req: SummaryRequest): string {
  const { title, content, subjects, identifier, type, year } = req;

  // Build a rich context block even when content is sparse
  const contextParts: string[] = [];
  contextParts.push(`${type === "proposition" ? "Proposition" : "Bill"}: ${identifier || title}`);
  contextParts.push(`Title: ${title}`);
  if (year) {
    contextParts.push(`Election Year/Context: ${year}`);
    contextParts.push(`CRITICAL INSTRUCTION: You MUST properly identify the proposition from THIS specific year (${year}). Do not confuse it with same-numbered propositions from other years.`);
  }
  if (subjects && subjects.length > 0) {
    contextParts.push(`Subjects/Topics: ${subjects.join(", ")}`);
  }
  if (content && content.trim().length > 5) {
    contextParts.push(`Content/Description: ${content}`);
  }

  return `Analyze this ${type === "proposition" ? "ballot measure" : "bill"} and provide 3 distinct summaries adapted for different reading levels: 5th grade, 8th grade (standard), and 12th grade (detailed).

${contextParts.join("\n")}

Based on the information above, provide a JSON response with this exact structure:
{
  "levels": {
    "5": {
      "tldr": "Extremely simple 1-2 sentences. Use short words and analogies. Explain like I'm 10.",
      "whatItDoes": "2 short paragraphs separated by \\n\\n. Use basic verbs (stops, allows, pays for).",
      "whoAffected": "Simple groups (e.g. 'students', 'families').",
      "pros": ["Simple good thing 1", "Simple good thing 2", "Simple good thing 3"],
      "cons": ["Simple bad thing 1", "Simple bad thing 2", "Simple bad thing 3"]
    },
    "8": {
      "tldr": "Standard newspaper level summary (1-2 sentences). Clear and direct.",
      "whatItDoes": "2 short paragraphs separated by \\n\\n. Explain requirements and implementation details.",
      "whoAffected": "Specific groups (e.g. 'California voters', 'small business owners').",
      "pros": ["Standard argument 1", "Standard argument 2", "Standard argument 3"],
      "cons": ["Standard argument 1", "Standard argument 2", "Standard argument 3"]
    },
    "12": {
      "tldr": "Sophisticated policy summary. Use precise terminology.",
      "whatItDoes": "2-3 short paragraphs separated by \\n\\n. Explain mechanisms, funding sources, and legal effects.",
      "whoAffected": "Detailed stakeholders including specific agencies or economic sectors.",
      "pros": ["Nuanced policy argument 1", "Nuanced policy argument 2", "Nuanced policy argument 3"],
      "cons": ["Nuanced policy argument 1", "Nuanced policy argument 2", "Nuanced policy argument 3"]
    }
  },
  "citations": [
    { "quote": "Exact or near-exact text from the bill supporting the TL;DR claim", "sourceName": "Section name or bill title", "location": "tldr" },
    { "quote": "Text from the bill supporting what-it-does", "sourceName": "Section name", "location": "what" },
    { "quote": "Text from the bill about who is affected", "sourceName": "Section name", "location": "who" }
  ],
  "year": "The election year this proposition appeared on the ballot (e.g. '2016', '2024')."
}

CRITICAL REQUIREMENTS:
- 5th Grade: NO big words. Short sentences. Use analogies (e.g. 'like a piggy bank').
- 8th Grade: Balance detail and clarity. Avoid jargon.
- 12th Grade: High precision. Use terms like 'appropriation', 'bond measure', 'statutory definition'.
- Be SPECIFIC and CONCRETE at all levels. Do NOT use generic placeholder text like "It may affect people." or "Clarifies rules."
- If the Content/Description is minimal, use the Title and Subjects to generate the best summary you can from your knowledge. A well-known bill like the "Inflation Reduction Act" should get a full, accurate summary.
- Provide 3-5 pros and 3-5 cons if possible (avoid generic placeholders).
- If election year is missing, infer it.
- You MUST provide 2-5 citations. Each citation needs a "quote" (the specific clause or text backing the claim), a "sourceName" (section or bill title), and a "location" (one of: "tldr", "what", "who", "pros", "cons"). If you cannot quote exact text because the bill content was not provided, use the most relevant factual basis and set sourceName to the bill title.`;
}

/** Extract citations from parsed AI response */
function extractCitations(parsed: any): EvidenceCitation[] {
  if (!parsed.citations || !Array.isArray(parsed.citations)) return [];
  return parsed.citations
    .filter((c: any) => c && (c.quote || c.sourceName))
    .map((c: any) => ({
      quote: c.quote || "",
      sourceName: c.sourceName || c.source_name || "Bill text",
      url: c.url,
      location: (["tldr", "what", "who", "pros", "cons"].includes(c.location) ? c.location : undefined) as any,
    }));
}

function parseAIResponse(content: string, req: SummaryRequest): GeneratedSummary {
  try {
    const parsed = JSON.parse(content);
    // Validate structure exists
    if (!parsed.levels || !parsed.levels["5"] || !parsed.levels["8"] || !parsed.levels["12"]) {
      throw new Error("Missing levels");
    }
    const citations = extractCitations(parsed);
    return attachReadability({
      levels: {
        "5": {
          tldr: parsed.levels["5"].tldr || "",
          whatItDoes: parsed.levels["5"].whatItDoes || "",
          whoAffected: parsed.levels["5"].whoAffected || "",
          pros: Array.isArray(parsed.levels["5"].pros) ? parsed.levels["5"].pros : [],
          cons: Array.isArray(parsed.levels["5"].cons) ? parsed.levels["5"].cons : []
        },
        "8": {
          tldr: parsed.levels["8"].tldr || "",
          whatItDoes: parsed.levels["8"].whatItDoes || "",
          whoAffected: parsed.levels["8"].whoAffected || "",
          pros: Array.isArray(parsed.levels["8"].pros) ? parsed.levels["8"].pros : [],
          cons: Array.isArray(parsed.levels["8"].cons) ? parsed.levels["8"].cons : []
        },
        "12": {
          tldr: parsed.levels["12"].tldr || "",
          whatItDoes: parsed.levels["12"].whatItDoes || "",
          whoAffected: parsed.levels["12"].whoAffected || "",
          pros: Array.isArray(parsed.levels["12"].pros) ? parsed.levels["12"].pros : [],
          cons: Array.isArray(parsed.levels["12"].cons) ? parsed.levels["12"].cons : []
        }
      },
      year: parsed.year || req.year,
      citations: citations.length > 0 ? citations : undefined,
    });
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    // Try to extract JSON if it was wrapped in markdown
    if (content.includes("```json")) {
      const match = content.match(/```json\n([\s\S]*?)\n```/);
      if (match && match[1]) {
        try {
          const parsed = JSON.parse(match[1]);
          if (!parsed.levels) throw new Error("Missing levels");
          const citations = extractCitations(parsed);
          return attachReadability({
            levels: {
              "5": parsed.levels["5"],
              "8": parsed.levels["8"],
              "12": parsed.levels["12"]
            },
            year: parsed.year || req.year,
            citations: citations.length > 0 ? citations : undefined,
          });
        } catch (e) { }
      }
    }
  }

  // Fallback if parsing fails
  return generateFallbackSummary(req);
}

function generateFallbackSummary(req: SummaryRequest): GeneratedSummary {
  const { title, content, subjects, identifier } = req;
  const name = identifier || title || "This measure";

  // Extract meaningful content for TL;DR
  const sentences = (content || "").split(/[.!?]+/).filter(s => s.trim().length > 20);
  let tldr = "";

  if (sentences.length > 0) {
    tldr = sentences.slice(0, 2).join(". ").trim();
  }

  if (!tldr || tldr.length < 30) {
    if (content && content.length > 30) {
      const extraSentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      if (extraSentences.length > 0) {
        tldr = extraSentences.slice(0, 2).join(". ").trim();
      }
    }

    if (!tldr || tldr.length < 30) {
      if (title && title.length > 15) {
        // Use the title as the basis — much better than "addresses policy changes"
        tldr = `${name}: ${title}${subjects && subjects.length > 0 ? ". Covers " + subjects.slice(0, 2).join(" and ") : ""}.`;
      } else if (subjects && subjects.length > 0) {
        tldr = `${name} addresses ${subjects.slice(0, 3).join(", ")}.`;
      } else {
        tldr = `${name}. Details not yet available — use the "Analyze with AI" button or search on Congress.gov for the full text.`;
      }
    }
  }

  // Build "what it does" from content
  const whatItDoes = (content || "").length > 50
    ? (content || "").split(/[.!?]+/).slice(0, 2).join(". ").trim() || tldr
    : tldr || title;

  // Infer who is affected from subjects and content
  const lowerAll = ((content || "") + " " + (title || "")).toLowerCase();
  const affected: string[] = [];
  if (/worker|employee|contractor|labor/.test(lowerAll)) affected.push("workers and employers");
  if (/voter|election|ballot/.test(lowerAll)) affected.push("voters and election officials");
  if (/tax|revenue|budget|appropriat/.test(lowerAll)) affected.push("taxpayers and government agencies");
  if (/health|medical|medicare|medicaid/.test(lowerAll)) affected.push("patients and healthcare providers");
  if (/education|school|student/.test(lowerAll)) affected.push("students, teachers, and schools");
  if (/environment|climate|energy|emission/.test(lowerAll)) affected.push("businesses and environmental agencies");
  if (/immigration|visa|border/.test(lowerAll)) affected.push("immigrants and immigration agencies");
  if (/housing|rent|mortgage/.test(lowerAll)) affected.push("renters, homeowners, and housing agencies");

  let whoAffected: string;
  if (subjects && subjects.length > 0) {
    whoAffected = `Primarily affects stakeholders in ${subjects.slice(0, 3).join(", ")}.`;
  } else if (affected.length > 0) {
    whoAffected = `Primarily affects ${affected.join("; ")}.`;
  } else {
    whoAffected = `Specific affected groups depend on the bill's provisions. Check official sources for details.`;
  }

  // Generate contextual pros/cons instead of generic templates
  const topicHint = subjects && subjects.length > 0 ? subjects[0] : (affected[0] || "this area");
  const pros = [
    `Supporters say it addresses key issues in ${topicHint}.`,
    `Supporters say it provides clearer rules and standards.`,
    `Supporters say it could improve outcomes for affected communities.`,
  ];
  const cons = [
    `Critics say it may increase costs or administrative burden.`,
    `Critics say the approach may not address root causes in ${topicHint}.`,
    `Critics worry about implementation challenges and unintended effects.`,
  ];

  const base: LevelContent = {
    tldr: tldr.slice(0, 280),
    whatItDoes: whatItDoes.slice(0, 360),
    whoAffected,
    pros,
    cons,
  };

  const toLevel = (level: "5" | "8" | "12"): LevelContent => {
    if (level === "12") return base;
    return {
      tldr: simplify(base.tldr, level),
      whatItDoes: simplify(base.whatItDoes, level),
      whoAffected: simplify(base.whoAffected, level),
      pros: base.pros.map((p) => simplify(p, level)),
      cons: base.cons.map((c) => simplify(c, level)),
    };
  };

  return attachReadability({
    levels: {
      "5": toLevel("5"),
      "8": toLevel("8"),
      "12": toLevel("12")
    }
  });
}

function attachReadability(summary: GeneratedSummary): GeneratedSummary {
  const scoreFor = (level: "5" | "8" | "12") => {
    const s = summary.levels[level];
    const text = [s.tldr, s.whatItDoes, s.whoAffected, (s.pros || []).join(" "), (s.cons || []).join(" ")].join(" ");
    return fleschKincaidGrade(text);
  };
  return {
    ...summary,
    readability: {
      "5": scoreFor("5"),
      "8": scoreFor("8"),
      "12": scoreFor("12"),
    },
  };
}

