import { NextRequest, NextResponse } from "next/server";
import { generatePolicyAnswer } from "@/lib/policyEngine";
import { matchKnownSummary } from "@/lib/known-summaries";
import { prisma } from "@/lib/db";
import type { OmniResponse, AnswerSection as OmniAnswerSection, Source } from "@/lib/omni-types";
import type { Answer, AnswerSource as PolicySource } from "@/lib/policy-types";

export const dynamic = "force-dynamic";

/* ── Conversation persistence (fire-and-forget, never blocks the response) ── */
async function saveConversation(
  query: string,
  answer: Answer,
  zip?: string,
): Promise<string | null> {
  try {
    // Dynamic import so middleware edge runtime doesn't choke on Clerk server
    const { auth } = await import("@clerk/nextjs/server");
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return null;

    const user = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) return null;

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        policyId: answer.policyId,
        policyName: answer.policyName,
        policyLevel: answer.level,
        policyCategory: answer.category,
        title: answer.policyName.slice(0, 120),
        zipCode: zip ?? null,
        messageCount: 2,
        lastMessageAt: new Date(),
      },
    });

    // User message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: query,
      },
    });

    // Assistant message (with full answer data for re-rendering)
    const assistantMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: answer.fullTextSummary,
        answerCardData: JSON.stringify({
          heading: answer.policyName,
          sections: answer.sections,
          fullTextSummary: answer.fullTextSummary,
        }),
      },
    });

    // Save sources + link to assistant message
    for (let i = 0; i < answer.sources.length; i++) {
      const s = answer.sources[i];
      if (!s.url || s.url === "https://example.com") continue;
      const convSource = await prisma.convSource.upsert({
        where: { url: s.url },
        create: {
          url: s.url,
          title: s.title,
          domain: s.domain,
          sourceType: s.type,
          verified: s.verified,
        },
        update: {},
      });
      await prisma.messageSource.create({
        data: {
          messageId: assistantMsg.id,
          sourceId: convSource.id,
          citationNumber: i + 1,
        },
      });
    }

    return conversation.id;
  } catch (e) {
    // Never let DB errors block the search response
    console.error("[omni] saveConversation failed (non-fatal):", e);
    return null;
  }
}

/** Try to get a known summary for CA props/bills so we show verified content instead of AI. */
function knownSummaryToAnswer(query: string, zipCode: string | null): Answer | null {
  const yearMatch = query.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : undefined;
  const base = { title: query, content: query, identifier: "", year };
  const known =
    matchKnownSummary({ ...base, type: "proposition" }) ??
    matchKnownSummary({ ...base, type: "bill" });
  if (!known || !known.citations?.length) return null;

  const level = known.levels["8"];
  const policyName =
    known.citations[0]?.sourceName?.replace(/^[^—]+—\s*/, "").trim() ||
    query.slice(0, 80);
  const sources: PolicySource[] = known.citations.map((c, i) => ({
    id: i + 1,
    title: c.sourceName || "Source",
    url: c.url || "",
    domain: (() => {
      try {
        return c.url ? new URL(c.url).hostname : "example.com";
      } catch {
        return "example.com";
      }
    })(),
    type: "State" as const,
    verified: !!c.url,
  }));

  const keyProvisions = level.whatItDoes
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    policyId: `known-${known.year || "summary"}-${Date.now()}`,
    policyName,
    level: "State",
    category: "Ballot measure",
    fullTextSummary: level.tldr,
    sections: {
      summary: level.tldr,
      keyProvisions: keyProvisions.length > 0 ? keyProvisions : undefined,
      localImpact: zipCode
        ? {
            zipCode,
            location: `ZIP ${zipCode}`,
            content: level.whoAffected,
          }
        : undefined,
      argumentsFor: level.pros?.length ? level.pros : undefined,
      argumentsAgainst: level.cons?.length ? level.cons : undefined,
    },
    sources,
  };
}

function mapPolicyAnswerToOmni(answer: Answer, persona: string, intent: "general_policy" | "bill_lookup" = "general_policy"): OmniResponse {
  const sections: OmniAnswerSection[] = [];
  if (answer.sections.summary) {
    sections.push({
      heading: "Summary",
      content: answer.sections.summary,
      citations: [],
      confidence: "verified",
    });
  }
  if (answer.sections.keyProvisions?.length) {
    sections.push({
      heading: "Key provisions",
      content: answer.sections.keyProvisions.join("\n\n"),
      citations: [],
      confidence: "verified",
    });
  }
  if (answer.sections.localImpact?.content) {
    sections.push({
      heading: `Local impact (${answer.sections.localImpact.location})`,
      content: answer.sections.localImpact.content,
      citations: [],
      confidence: "verified",
    });
  }
  if (answer.sections.argumentsFor?.length) {
    sections.push({
      heading: "Arguments for",
      content: answer.sections.argumentsFor.map((p) => p.trim()).filter(Boolean).join("\n"),
      citations: [],
      confidence: "inferred",
    });
  }
  if (answer.sections.argumentsAgainst?.length) {
    sections.push({
      heading: "Arguments against",
      content: answer.sections.argumentsAgainst.map((p) => p.trim()).filter(Boolean).join("\n"),
      citations: [],
      confidence: "inferred",
    });
  }
  if (sections.length === 0) {
    sections.push({
      heading: "Overview",
      content: answer.fullTextSummary,
      citations: [],
      confidence: "verified",
    });
  }

  const sources: Source[] = answer.sources.map((s: PolicySource, i: number) => ({
    id: `src-${i}`,
    type: s.type === "Federal" ? "federal_bill" : s.type === "State" ? "state_bill" : "government_site",
    title: s.title,
    url: s.url,
    snippet: s.title,
    publisher: s.domain,
    relevance: s.verified ? 1 : 0.8,
    jurisdiction: (s.type.toLowerCase() as "federal" | "state" | "local") || undefined,
  }));

  return {
    id: answer.policyId,
    intent,
    title: answer.policyName,
    tldr: answer.fullTextSummary.slice(0, 200),
    sections,
    sources,
    persona: (persona as "general") || "general",
    followUps: [
      "What are the main arguments for and against?",
      "How does this affect my area?",
      "Compare to similar policies",
    ],
    model: "policy-engine",
    processingTimeMs: 0,
    warnings: [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json({ success: false, error: "Missing query" }, { status: 400 });
    }
    const zip = typeof body?.zip === "string" ? body.zip : undefined;
    const persona = typeof body?.persona === "string" ? body.persona : "general";

    // Use verified known summaries for CA propositions/bills when available (avoids AI hallucination).
    const knownAnswer = knownSummaryToAnswer(query, zip ?? null);
    const answer = knownAnswer ?? (await generatePolicyAnswer(query, zip ?? null));
    const data = mapPolicyAnswerToOmni(answer, persona);

    // Save conversation in the background (never blocks the response)
    const conversationId = await saveConversation(query, answer, zip).catch(() => null);

    return NextResponse.json({ success: true, data, conversationId });
  } catch (e) {
    console.error("[api/omni]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 }
    );
  }
}
