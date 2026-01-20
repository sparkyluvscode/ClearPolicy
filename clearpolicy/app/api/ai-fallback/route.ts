import { NextRequest, NextResponse } from "next/server";
import { generateSummary } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const query = (req.nextUrl.searchParams.get("query") || "").trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const summary = await generateSummary({
      title: query,
      content: `User query: ${query}. Provide a neutral overview of this policy or act, even if it is a general national policy topic.`,
      subjects: [],
      identifier: query,
      type: "bill",
    });
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("AI fallback generation failed:", error);
    return NextResponse.json({ error: "Failed to generate AI fallback" }, { status: 500 });
  }
}
