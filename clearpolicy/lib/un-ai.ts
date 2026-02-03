/**
 * UN/International Document AI Pipeline
 * 
 * This module handles AI-powered analysis of UN and international policy documents.
 * It extends the existing AI infrastructure with UN-specific prompts and output structures.
 * 
 * Features:
 * - Multi-level summaries (5th, 8th, 12th grade)
 * - Acronym and jargon detection
 * - Youth relevance analysis
 * - Document stage inference
 * - Long document chunking
 * 
 * @module un-ai
 */

import OpenAI from "openai";
import { simplify, fleschKincaidGrade } from "@/lib/reading";
import type {
  UNDocumentRequest,
  UNDocumentAnalysis,
  UNLevelContent,
  GlossaryTerm,
  YouthRelevance,
  DocumentStage,
  UNProcess,
  OrganizationConfig,
  ORGANIZATION_CONFIGS,
} from "@/lib/un-types";

/** OpenAI client singleton */
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

/** Maximum tokens for a single API call */
const MAX_CHUNK_TOKENS = 12000; // Leave room for response
const CHARS_PER_TOKEN = 4; // Rough estimate
const MAX_CHUNK_CHARS = MAX_CHUNK_TOKENS * CHARS_PER_TOKEN;

/**
 * System prompt for UN document analysis
 * Emphasizes neutrality, clarity, and youth accessibility
 */
const UN_SYSTEM_PROMPT = `You are a non-partisan international policy education assistant. Your job is to analyze UN and international policy documents and provide clear, neutral summaries that help young people (high school and college students, youth delegates) understand complex multilateral processes.

Key principles:
1. Be FACTUAL and NEUTRAL - never advocate for any political position
2. Be CLEAR and ACCESSIBLE - explain like teaching a smart high school student
3. DETECT and EXPLAIN acronyms and jargon - UN documents are full of specialized terminology
4. Highlight YOUTH RELEVANCE - how does this affect young people and their participation?
5. Do NOT give legal advice or claim legal authority
6. Do NOT hallucinate specific article numbers or clauses - describe concepts at a high level
7. Frame pros/cons as "concerns raised by stakeholders" not as your opinion

Return only valid JSON in the exact structure requested.`;

/**
 * Build the analysis prompt for a UN document
 */
function buildUNPrompt(content: string, title?: string, processHint?: UNProcess, orgConfig?: OrganizationConfig): string {
  const processContext = processHint && processHint !== "general" 
    ? `\nContext hint: This document may relate to ${processHint.toUpperCase()} processes.`
    : "";

  const orgAdditions = orgConfig?.promptAdditions 
    ? `\n\nAdditional focus: ${orgConfig.promptAdditions}`
    : "";

  return `Analyze this UN/international policy document and provide a comprehensive analysis.

${title ? `Document Title: ${title}` : ""}${processContext}

DOCUMENT CONTENT:
---
${content}
---
${orgAdditions}

Provide a JSON response with this EXACT structure:
{
  "title": "Inferred or provided document title",
  "stage": "One of: draft_resolution, negotiation_text, zero_draft, concept_note, final_treaty, declaration, outcome_document, report, unknown",
  "process": "One of: bbnj, inc_tax, sdg, climate, water, sti_forum, youth, general",
  "levels": {
    "5": {
      "tldr": "1-3 short paragraphs. Use VERY simple words (1-2 syllables). Explain like I'm 10 years old. Use analogies.",
      "keyObjectives": ["Simple objective 1", "Simple objective 2", "Simple objective 3"],
      "whoAffected": "Simple description: 'countries', 'people who fish', 'young people', etc.",
      "decisions": "What this document decides or commits to, in very simple terms.",
      "pros": ["Simple benefit 1", "Simple benefit 2", "Simple benefit 3"],
      "cons": ["Simple concern 1", "Simple concern 2", "Simple concern 3"]
    },
    "8": {
      "tldr": "1-3 paragraphs at newspaper level. Clear and direct.",
      "keyObjectives": ["Clear objective 1", "Clear objective 2", "Clear objective 3"],
      "whoAffected": "Countries, organizations, and groups affected.",
      "decisions": "What decisions or commitments the document makes.",
      "pros": ["Stakeholder benefit 1", "Stakeholder benefit 2", "Stakeholder benefit 3"],
      "cons": ["Stakeholder concern 1", "Stakeholder concern 2", "Stakeholder concern 3"]
    },
    "12": {
      "tldr": "1-3 sophisticated paragraphs. Use precise policy terminology.",
      "keyObjectives": ["Detailed objective 1", "Detailed objective 2", "Detailed objective 3"],
      "whoAffected": "Detailed analysis of affected parties including specific state actors, IGOs, NGOs, and civil society.",
      "decisions": "Detailed analysis of commitments, legal implications, and mechanisms.",
      "pros": ["Nuanced policy benefit 1", "Nuanced policy benefit 2", "Nuanced policy benefit 3"],
      "cons": ["Nuanced policy concern 1", "Nuanced policy concern 2", "Nuanced policy concern 3"]
    }
  },
  "youthRelevance": {
    "general": "How this document matters for young people in general.",
    "globalSouth": "Specific relevance for youth in developing countries / Global South (if applicable, otherwise null).",
    "participation": "How this affects youth participation and representation in policy processes (if applicable, otherwise null).",
    "relevantAreas": ["Topic area 1 relevant to youth", "Topic area 2", "Topic area 3"]
  },
  "glossary": [
    {
      "term": "ACRONYM or jargon term",
      "meaning": "Full expansion or definition",
      "simpleExplanation": "Simple explanation a high schooler would understand"
    }
  ]
}

IMPORTANT:
- For glossary, include ALL acronyms and UN jargon you find (aim for 5-15 terms)
- For youthRelevance, be specific about HOW it affects young people, not generic
- For stage, infer from document language (e.g., "zero draft" often has placeholders, "treaty" is finalized)
- For process, infer from content (BBNJ = oceans/marine, INC = taxation, etc.)
- Keep pros/cons balanced and framed as "stakeholders argue" not personal opinion`;
}

/**
 * Chunk long documents for processing
 * Splits at paragraph boundaries when possible
 */
function chunkDocument(content: string): string[] {
  if (content.length <= MAX_CHUNK_CHARS) {
    return [content];
  }

  const chunks: string[] = [];
  const paragraphs = content.split(/\n\n+/);
  let currentChunk = "";

  for (const para of paragraphs) {
    if (currentChunk.length + para.length + 2 > MAX_CHUNK_CHARS) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      // If single paragraph is too long, split it
      if (para.length > MAX_CHUNK_CHARS) {
        const sentences = para.split(/(?<=[.!?])\s+/);
        currentChunk = "";
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 > MAX_CHUNK_CHARS) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? " " : "") + sentence;
          }
        }
      } else {
        currentChunk = para;
      }
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Merge multiple chunk analyses into a single coherent analysis
 */
function mergeChunkAnalyses(analyses: UNDocumentAnalysis[]): UNDocumentAnalysis {
  if (analyses.length === 0) {
    throw new Error("No analyses to merge");
  }
  if (analyses.length === 1) {
    return analyses[0];
  }

  // Use first analysis as base
  const base = analyses[0];

  // Merge glossaries (deduplicate by term)
  const glossaryMap = new Map<string, GlossaryTerm>();
  for (const analysis of analyses) {
    for (const term of analysis.glossary) {
      if (!glossaryMap.has(term.term.toLowerCase())) {
        glossaryMap.set(term.term.toLowerCase(), term);
      }
    }
  }

  // Merge key objectives (deduplicate)
  const mergeObjectives = (level: "5" | "8" | "12"): string[] => {
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const analysis of analyses) {
      for (const obj of analysis.levels[level].keyObjectives) {
        const normalized = obj.toLowerCase().trim();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          merged.push(obj);
        }
      }
    }
    return merged.slice(0, 6); // Limit to 6 objectives
  };

  // Merge relevantAreas
  const mergeRelevantAreas = (): string[] => {
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const analysis of analyses) {
      for (const area of analysis.youthRelevance.relevantAreas) {
        const normalized = area.toLowerCase().trim();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          merged.push(area);
        }
      }
    }
    return merged.slice(0, 5);
  };

  return {
    ...base,
    levels: {
      "5": {
        ...base.levels["5"],
        keyObjectives: mergeObjectives("5"),
      },
      "8": {
        ...base.levels["8"],
        keyObjectives: mergeObjectives("8"),
      },
      "12": {
        ...base.levels["12"],
        keyObjectives: mergeObjectives("12"),
      },
    },
    youthRelevance: {
      ...base.youthRelevance,
      relevantAreas: mergeRelevantAreas(),
    },
    glossary: Array.from(glossaryMap.values()),
  };
}

/**
 * Parse AI response into structured analysis
 */
function parseUNResponse(
  content: string,
  request: UNDocumentRequest,
  wasTruncated: boolean
): UNDocumentAnalysis {
  try {
    const parsed = JSON.parse(content);

    // Validate required structure
    if (!parsed.levels || !parsed.levels["5"] || !parsed.levels["8"] || !parsed.levels["12"]) {
      throw new Error("Missing required levels structure");
    }

    // Build analysis object with defaults for missing fields
    const analysis: UNDocumentAnalysis = {
      title: parsed.title || request.title || "Untitled UN Document",
      stage: isValidStage(parsed.stage) ? parsed.stage : "unknown",
      process: parsed.process || request.processHint || "general",
      levels: {
        "5": parseLevel(parsed.levels["5"]),
        "8": parseLevel(parsed.levels["8"]),
        "12": parseLevel(parsed.levels["12"]),
      },
      youthRelevance: parseYouthRelevance(parsed.youthRelevance),
      glossary: parseGlossary(parsed.glossary),
      sourceUrl: request.url,
      sourceFilename: request.filename,
      analyzedAt: new Date().toISOString(),
      documentLength: request.content.length,
      wasTruncated,
    };

    return analysis;
  } catch (error) {
    console.error("Failed to parse UN AI response:", error);
    
    // Try to extract JSON from markdown
    if (content.includes("```json")) {
      const match = content.match(/```json\n([\s\S]*?)\n```/);
      if (match && match[1]) {
        try {
          return parseUNResponse(match[1], request, wasTruncated);
        } catch (e) {
          // Fall through to fallback
        }
      }
    }
    
    throw new Error("Failed to parse AI response");
  }
}

function isValidStage(stage: string): stage is DocumentStage {
  return [
    "draft_resolution",
    "negotiation_text",
    "zero_draft",
    "concept_note",
    "final_treaty",
    "declaration",
    "outcome_document",
    "report",
    "unknown",
  ].includes(stage);
}

function parseLevel(level: any): UNLevelContent {
  return {
    tldr: level?.tldr || "",
    keyObjectives: Array.isArray(level?.keyObjectives) ? level.keyObjectives : [],
    whoAffected: level?.whoAffected || "",
    decisions: level?.decisions || "",
    pros: Array.isArray(level?.pros) ? level.pros : [],
    cons: Array.isArray(level?.cons) ? level.cons : [],
  };
}

function parseYouthRelevance(yr: any): YouthRelevance {
  return {
    general: yr?.general || "This document may affect young people through its policy implications.",
    globalSouth: yr?.globalSouth || undefined,
    participation: yr?.participation || undefined,
    relevantAreas: Array.isArray(yr?.relevantAreas) ? yr.relevantAreas : [],
  };
}

function parseGlossary(glossary: any): GlossaryTerm[] {
  if (!Array.isArray(glossary)) return [];
  return glossary
    .filter((g: any) => g?.term && g?.meaning)
    .map((g: any) => ({
      term: g.term,
      meaning: g.meaning,
      simpleExplanation: g.simpleExplanation || g.meaning,
    }));
}

/**
 * Generate a fallback analysis when AI fails
 */
function generateFallbackAnalysis(request: UNDocumentRequest, wasTruncated: boolean): UNDocumentAnalysis {
  const title = request.title || "UN Document";
  
  const baseTldr = `This is a UN/international policy document${request.processHint ? ` related to ${request.processHint}` : ""}. Due to processing limitations, a detailed AI analysis is not available. Please review the document directly or try again.`;

  const baseLevel: UNLevelContent = {
    tldr: baseTldr,
    keyObjectives: ["Document objectives could not be extracted automatically."],
    whoAffected: "Various international stakeholders.",
    decisions: "Document decisions could not be analyzed automatically.",
    pros: ["May advance international cooperation."],
    cons: ["Complex documents can be difficult to implement."],
  };

  return {
    title,
    stage: "unknown",
    process: request.processHint || "general",
    levels: {
      "5": { ...baseLevel, tldr: simplify(baseTldr, "5") },
      "8": baseLevel,
      "12": baseLevel,
    },
    youthRelevance: {
      general: "International policy documents can affect young people through their impact on education, employment, environment, and civic participation.",
      relevantAreas: ["International cooperation", "Youth policy"],
    },
    glossary: [],
    sourceUrl: request.url,
    sourceFilename: request.filename,
    analyzedAt: new Date().toISOString(),
    documentLength: request.content.length,
    wasTruncated,
  };
}

/**
 * Main function to analyze a UN document
 * 
 * @param request - The document analysis request
 * @param orgConfig - Optional organization-specific configuration
 * @returns Analysis result
 */
export async function analyzeUNDocument(
  request: UNDocumentRequest,
  orgConfig?: OrganizationConfig
): Promise<UNDocumentAnalysis> {
  const client = getOpenAI();
  
  if (!client) {
    console.warn("OpenAI API key not configured. Using fallback analysis.");
    return generateFallbackAnalysis(request, false);
  }

  if (!request.content || request.content.length < 50) {
    throw new Error("Document content is too short for analysis.");
  }

  const chunks = chunkDocument(request.content);
  const wasTruncated = chunks.length > 1 || request.content.length > MAX_CHUNK_CHARS;

  console.log(`[UN-AI] Analyzing document: ${chunks.length} chunk(s), ${request.content.length} chars`);

  try {
    if (chunks.length === 1) {
      // Single chunk - straightforward analysis
      const prompt = buildUNPrompt(chunks[0], request.title, request.processHint, orgConfig);
      
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: UN_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        throw new Error("Empty response from AI");
      }

      return parseUNResponse(responseContent, request, wasTruncated);
    } else {
      // Multiple chunks - analyze each and merge
      // For efficiency, analyze first and last chunks in detail, summarize middle
      const analyses: UNDocumentAnalysis[] = [];

      // Always analyze first chunk (usually has title, introduction)
      const firstPrompt = buildUNPrompt(
        chunks[0],
        request.title,
        request.processHint,
        orgConfig
      );
      
      const firstCompletion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: UN_SYSTEM_PROMPT },
          { role: "user", content: firstPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const firstContent = firstCompletion.choices[0].message.content;
      if (firstContent) {
        analyses.push(parseUNResponse(firstContent, request, true));
      }

      // If many chunks, also analyze the last chunk (usually conclusions)
      if (chunks.length > 2) {
        const lastPrompt = buildUNPrompt(
          chunks[chunks.length - 1],
          request.title,
          request.processHint,
          orgConfig
        );

        const lastCompletion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: UN_SYSTEM_PROMPT },
            { role: "user", content: `This is the FINAL SECTION of a longer document. Focus on conclusions and outcomes.\n\n${lastPrompt}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });

        const lastContent = lastCompletion.choices[0].message.content;
        if (lastContent) {
          analyses.push(parseUNResponse(lastContent, request, true));
        }
      }

      if (analyses.length === 0) {
        return generateFallbackAnalysis(request, true);
      }

      return mergeChunkAnalyses(analyses);
    }
  } catch (error: any) {
    console.error("[UN-AI] Analysis failed:", error);
    
    // Handle specific error types
    if (error?.message?.includes("quota") || error?.message?.includes("429")) {
      console.warn("OpenAI API quota exceeded. Using fallback.");
    }
    if (error?.message?.includes("API key")) {
      console.warn("OpenAI API key issue. Using fallback.");
    }
    
    return generateFallbackAnalysis(request, wasTruncated);
  }
}

/**
 * Estimate tokens for a given text
 * @param text - Text to estimate
 * @returns Approximate token count
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
