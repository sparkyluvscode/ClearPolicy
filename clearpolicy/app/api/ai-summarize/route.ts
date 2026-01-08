import { NextRequest, NextResponse } from "next/server";
import { generateSummary } from "@/lib/ai";

/**
 * AI-powered summarization endpoint
 * Takes raw bill/proposition data and generates a comprehensive summary
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, subjects, identifier, type } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: title, content" },
        { status: 400 }
      );
    }

    const summary = await generateSummary({
      title,
      content,
      subjects: subjects || [],
      identifier,
      type: type || "bill",
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("AI summarization error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}

