import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { isValidDocumentHash } from "@/lib/document-hash";
import { getFriendlyDatabaseErrorMessage, isDatabaseUnavailableError } from "@/lib/db-error";
import type { UNDocumentAnalysis } from "@/lib/un-types";

/**
 * API Route: POST /api/un/chat
 * 
 * Handles chat interactions about a specific UN document.
 * Uses the stored analysis and document context to answer questions.
 * 
 * Request body:
 * - document_hash: string (required) - The hash of the analyzed document
 * - user_message: string (required) - The user's question
 * - highlighted_text: string (optional) - Text the user highlighted for explanation
 * 
 * Returns:
 * - success: boolean
 * - assistant_message: string (on success)
 * - error: string (on failure)
 * 
 * @module api/un/chat
 */

interface ChatRequest {
  document_hash: string;
  user_message: string;
  highlighted_text?: string;
}

interface ChatResponse {
  success: boolean;
  assistant_message?: string;
  error?: string;
}

// OpenAI client
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

/**
 * Build a system prompt for the chat assistant
 */
function buildChatSystemPrompt(analysis: UNDocumentAnalysis): string {
  const glossaryList = analysis.glossary
    .map((g) => `- ${g.term}: ${g.meaning}`)
    .join("\n");

  return `You are a helpful assistant explaining a UN/international policy document. Your role is to help users understand this document clearly and accurately.

DOCUMENT BEING DISCUSSED:
Title: ${analysis.title}
Type: ${analysis.stage}
Process: ${analysis.process}

DOCUMENT SUMMARY:
${analysis.levels["8"].tldr}

KEY OBJECTIVES:
${analysis.levels["8"].keyObjectives.map((o) => `- ${o}`).join("\n")}

WHO IS AFFECTED:
${analysis.levels["8"].whoAffected}

DECISIONS/COMMITMENTS:
${analysis.levels["8"].decisions}

YOUTH RELEVANCE:
${analysis.youthRelevance.general}
${analysis.youthRelevance.globalSouth ? `\nGlobal South Youth: ${analysis.youthRelevance.globalSouth}` : ""}
${analysis.youthRelevance.participation ? `\nYouth Participation: ${analysis.youthRelevance.participation}` : ""}

GLOSSARY:
${glossaryList || "No specific terms identified."}

INSTRUCTIONS:
1. Answer questions based on the document analysis above. Ground your answers in the document.
2. If something is not covered in the document/analysis, say "The document doesn't specify this directly, but..." and provide general context if appropriate.
3. Explain in clear, accessible language (aim for 8th-10th grade reading level unless asked otherwise).
4. When explaining highlighted passages, break down complex terms and concepts.
5. Be factual and neutral - do not advocate for any position.
6. If asked about specific article numbers or legal provisions not in the analysis, say you cannot confirm specific clause numbers without the original text.
7. Keep responses concise but helpful (typically 1-3 paragraphs).
8. Use the glossary terms when relevant to help explain acronyms and jargon.`;
}

/**
 * Build user message with optional highlighted text context
 */
function buildUserMessage(userMessage: string, highlightedText?: string): string {
  if (highlightedText) {
    return `The user has highlighted the following text from the document and wants an explanation:

HIGHLIGHTED TEXT:
"${highlightedText}"

USER'S QUESTION:
${userMessage}

Please explain the highlighted text in simpler terms, focusing on what it means and why it matters.`;
  }
  return userMessage;
}

export async function POST(req: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const body = await req.json() as ChatRequest;
    const { document_hash, user_message, highlighted_text } = body;

    // Validate inputs
    if (!document_hash || !isValidDocumentHash(document_hash)) {
      return NextResponse.json({
        success: false,
        error: "Invalid or missing document hash.",
      }, { status: 400 });
    }

    if (!user_message || typeof user_message !== "string" || user_message.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: "Message is required.",
      }, { status: 400 });
    }

    if (user_message.length > 2000) {
      return NextResponse.json({
        success: false,
        error: "Message is too long. Please keep it under 2000 characters.",
      }, { status: 400 });
    }

    // Get OpenAI client
    const client = getOpenAI();
    if (!client) {
      return NextResponse.json({
        success: false,
        error: "Chat service is not configured. Please try again later.",
      }, { status: 503 });
    }

    // Fetch the document analysis from database
    let doc: { analysisPayload: string } | null;
    try {
      doc = await prisma.unDocumentAnalysis.findUnique({
        where: { documentHash: document_hash },
      });
    } catch (dbError: unknown) {
      if (isDatabaseUnavailableError(dbError)) {
        const friendlyMessage = getFriendlyDatabaseErrorMessage(dbError);
        return NextResponse.json({
          success: false,
          error: friendlyMessage,
        }, { status: 503 });
      }
      throw dbError;
    }

    if (!doc) {
      return NextResponse.json({
        success: false,
        error: "Document not found. Please analyze the document first.",
      }, { status: 404 });
    }

    // Parse the analysis
    let analysis: UNDocumentAnalysis;
    try {
      analysis = JSON.parse(doc.analysisPayload) as UNDocumentAnalysis;
    } catch (e) {
      console.error("[UN-Chat] Failed to parse analysis:", e);
      return NextResponse.json({
        success: false,
        error: "Failed to load document analysis.",
      }, { status: 500 });
    }

    // Build prompts
    const systemPrompt = buildChatSystemPrompt(analysis);
    const userPrompt = buildUserMessage(user_message.trim(), highlighted_text?.trim());

    // Call OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json({
        success: false,
        error: "No response generated. Please try again.",
      }, { status: 500 });
    }

    console.log(`[UN-Chat] Response for hash ${document_hash.slice(0, 12)}...: ${assistantMessage.length} chars`);

    return NextResponse.json({
      success: true,
      assistant_message: assistantMessage,
    });

  } catch (error: unknown) {
    console.error("[UN-Chat] Error:", error);

    if (error instanceof Error) {
      if (error.message.includes("quota") || error.message.includes("429")) {
        return NextResponse.json({
          success: false,
          error: "Service is busy. Please try again in a moment.",
        }, { status: 503 });
      }
    }

    const friendlyMessage = getFriendlyDatabaseErrorMessage(error);
    const status = isDatabaseUnavailableError(error) ? 503 : 500;
    return NextResponse.json({
      success: false,
      error: friendlyMessage,
    }, { status });
  }
}

// Reject non-POST methods
export async function GET() {
  return NextResponse.json({
    success: false,
    error: "Method not allowed. Use POST.",
  }, { status: 405 });
}
