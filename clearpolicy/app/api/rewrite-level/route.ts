import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

interface SectionInput {
  heading: string;
  content: string;
}

const LEVEL_INSTRUCTIONS: Record<string, string> = {
  "5": `Rewrite at a 5th-grade reading level. Use short, simple sentences. Replace jargon with everyday words. Use analogies a child would understand. Keep each section to 2-3 sentences max. Avoid complex vocabulary — if a simpler word exists, use it.`,
  "12": `Rewrite at a 12th-grade / college-prep reading level. Add more technical detail, nuance, and specificity. Use precise terminology (with brief explanations where helpful). Include additional context such as historical precedent, legal mechanisms, or economic implications. Expand each section with deeper analysis. Aim for 4-8 sentences per section.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const level = typeof body?.level === "string" ? body.level : "";
    const sections: SectionInput[] = Array.isArray(body?.sections) ? body.sections : [];
    const policyTitle = typeof body?.title === "string" ? body.title : "";

    if (!["5", "12"].includes(level)) {
      return NextResponse.json(
        { success: false, error: "Invalid reading level. Use '5' or '12'." },
        { status: 400 }
      );
    }

    if (sections.length === 0) {
      return NextResponse.json(
        { success: false, error: "No sections provided." },
        { status: 400 }
      );
    }

    const client = getOpenAI();
    if (!client) {
      return NextResponse.json(
        { success: false, error: "AI service unavailable." },
        { status: 503 }
      );
    }

    const sectionsBlock = sections
      .map((s, i) => `[Section ${i + 1}: "${s.heading}"]\n${s.content}`)
      .join("\n\n");

    const prompt = `You are rewriting a policy analysis about "${policyTitle}" at a different reading level.

${LEVEL_INSTRUCTIONS[level]}

Here are the original sections to rewrite:

${sectionsBlock}

Return ONLY valid JSON (no markdown, no code fence):
{
  "sections": [
    { "heading": "Original heading (keep the same heading text)", "content": "Rewritten content at the target reading level" }
  ]
}

Critical rules:
- Preserve ALL factual information — do not remove data, dates, numbers, or key details.
- Keep the same number of sections and the same heading text for each.
- ${level === "5" ? "Simplify vocabulary and sentence structure. Use analogies. Keep it concise but complete." : "Add depth, technical precision, and analytical context. Make it richer, not just longer."}
- Do NOT add disclaimers or meta-commentary about the rewriting itself.
- Preserve any citation markers like [1], [2] etc. exactly as they appear.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a skilled editor who adapts policy content for different reading levels while preserving accuracy and completeness. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Empty AI response" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);
    const rewrittenSections = Array.isArray(parsed.sections) ? parsed.sections : [];

    if (rewrittenSections.length !== sections.length) {
      return NextResponse.json(
        { success: false, error: "Rewrite produced mismatched section count" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, sections: rewrittenSections });
  } catch (e) {
    console.error("[api/rewrite-level]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Rewrite failed" },
      { status: 500 }
    );
  }
}
