import { NextRequest, NextResponse } from "next/server";
import { generatePolicyAnswer, generateDebateAnswer } from "@/lib/policyEngine";
import { classifyQuery } from "@/lib/omni-classifier";
import { matchKnownSummary } from "@/lib/known-summaries";
import { searchWeb, filterValidResults, formatWebContext } from "@/lib/web-search";
import { fetchGovData, formatGovContext, govBillsToSources } from "@/lib/gov-data";
import { detectInternationalQuery, fetchIntlData, formatIntlContext, intlSourcesToAnswerSources } from "@/lib/intl-data";
import { prisma, withRetry } from "@/lib/db";
import type { OmniResponse, AnswerSection as OmniAnswerSection, Source, PerspectiveView, PolicyMeta } from "@/lib/omni-types";
import type { Answer, AnswerSource as PolicySource } from "@/lib/policy-types";

export const dynamic = "force-dynamic";

/* ── Conversation persistence (fire-and-forget, never blocks the response) ── */
async function saveConversation(
  query: string,
  answer: Answer,
  zip?: string,
): Promise<string | null> {
  try {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      // User not signed in - expected for anonymous searches
      return null;
    }

    // Find or create user in DB (handles first-time users automatically)
    let user = await withRetry(() =>
      prisma.user.findUnique({ where: { clerkUserId } })
    );
    if (!user) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? `${clerkUserId}@clerk`;
      user = await withRetry(() =>
        prisma.user.create({
          data: {
            clerkUserId,
            email,
            fullName: clerkUser?.firstName
              ? `${clerkUser.firstName}${clerkUser.lastName ? " " + clerkUser.lastName : ""}`
              : null,
            avatarUrl: clerkUser?.imageUrl ?? null,
          },
        })
      );
    }

    const conversation = await withRetry(() =>
      prisma.conversation.create({
        data: {
          userId: user!.id,
          policyId: answer.policyId,
          policyName: answer.policyName,
          policyLevel: answer.level,
          policyCategory: answer.category,
          title: answer.policyName.slice(0, 120),
          zipCode: zip ?? null,
          messageCount: 2,
          lastMessageAt: new Date(),
        },
      })
    );

    await withRetry(() =>
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: query,
        },
      })
    );

    const assistantMsg = await withRetry(() =>
      prisma.message.create({
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
      })
    );

    const validSources = (answer.sources || []).filter(
      (s) => {
        if (!s.url || !s.url.startsWith("http")) return false;
        try {
          const host = new URL(s.url).hostname.replace("www.", "");
          return !["example.com", "example.org", "example.net", "placeholder.com", "domain.com"].includes(host);
        } catch { return false; }
      }
    );
    for (let i = 0; i < validSources.length; i++) {
      const s = validSources[i];
      try {
        const convSource = await withRetry(() =>
          prisma.convSource.upsert({
            where: { url: s.url },
            create: {
              url: s.url,
              title: s.title,
              domain: s.domain,
              sourceType: s.type,
              verified: s.verified,
            },
            update: {},
          })
        );
        await prisma.messageSource.create({
          data: {
            messageId: assistantMsg.id,
            sourceId: convSource.id,
            citationNumber: i + 1,
          },
        });
      } catch (srcErr) {
        console.warn("[omni] Failed to save source:", s.url, srcErr);
      }
    }

    return conversation.id;
  } catch (e) {
    // Never let DB errors block the search response
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("[omni] saveConversation failed (non-fatal):", err.message, err.stack);
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
    known.citations[0]?.sourceName?.replace(/^[^-]+-\s*/, "").trim() ||
    query.slice(0, 80);
  const sources: PolicySource[] = known.citations
    .filter((c) => c.url && c.url.startsWith("http"))
    .map((c, i) => ({
      id: i + 1,
      title: c.sourceName || "Source",
      url: c.url!,
      domain: (() => {
        try {
          return new URL(c.url!).hostname.replace("www.", "");
        } catch {
          return "source";
        }
      })(),
      type: "State" as const,
      verified: true,
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

function mapPolicyAnswerToOmni(answer: Answer, persona: string, intent: string = "general_policy", perspectives?: PerspectiveView[], meta?: Partial<PolicyMeta>): OmniResponse {
  const hasSources = (answer.sources?.length ?? 0) > 0;
  const baseConfidence = hasSources ? "verified" : "unverified";

  const sections: OmniAnswerSection[] = [];
  if (answer.sections.summary) {
    sections.push({
      heading: "Summary",
      content: answer.sections.summary,
      citations: [],
      confidence: baseConfidence,
    });
  }
  if (answer.sections.keyProvisions?.length) {
    sections.push({
      heading: "Key provisions",
      content: answer.sections.keyProvisions.join("\n\n"),
      citations: [],
      confidence: baseConfidence,
    });
  }
  if (answer.sections.localImpact?.content) {
    sections.push({
      heading: `Local impact (${answer.sections.localImpact.location})`,
      content: answer.sections.localImpact.content,
      citations: [],
      confidence: baseConfidence,
    });
  }
  if (answer.sections.argumentsFor?.length) {
    sections.push({
      heading: "Arguments for",
      content: answer.sections.argumentsFor.map((p) => p.trim()).filter(Boolean).join("\n"),
      citations: [],
      confidence: hasSources ? "inferred" : "unverified",
    });
  }
  if (answer.sections.argumentsAgainst?.length) {
    sections.push({
      heading: "Arguments against",
      content: answer.sections.argumentsAgainst.map((p) => p.trim()).filter(Boolean).join("\n"),
      citations: [],
      confidence: hasSources ? "inferred" : "unverified",
    });
  }
  if (sections.length === 0) {
    sections.push({
      heading: "Overview",
      content: answer.fullTextSummary,
      citations: [],
      confidence: baseConfidence,
    });
  }

  const sources: Source[] = answer.sources.map((s: PolicySource, i: number) => ({
    id: `src-${i}`,
    type: s.type === "Federal" ? "federal_bill" : s.type === "State" ? "state_bill" : s.domain === "uploaded" ? "uploaded_document" : "government_site",
    title: s.title,
    url: s.url,
    snippet: s.excerpt || s.title,
    publisher: s.domain === "uploaded" ? "Uploaded Document" : s.domain,
    relevance: s.verified ? 1 : 0.8,
    jurisdiction: (s.type.toLowerCase() as "federal" | "state" | "local") || undefined,
  }));

  const govSourceCount = sources.filter(s => s.type === "federal_bill" || s.type === "state_bill" || s.type === "government_site").length;
  const hasCitations = sections.some(sec => /\[\d+\]/.test(sec.content));

  const policyMeta: PolicyMeta = {
    level: answer.level || "",
    category: answer.category || "",
    sourceCount: sources.length,
    govSourceCount,
    hasCitations,
    intent: (intent as PolicyMeta["intent"]) || "general_policy",
    ...meta,
  };

  return {
    id: answer.policyId,
    intent: intent as OmniResponse["intent"],
    title: answer.policyName,
    tldr: answer.fullTextSummary.slice(0, 200),
    sections,
    sources,
    policyMeta,
    perspectives,
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
    const debateMode = body?.debateMode === true;
    const documentText = typeof body?.documentText === "string" ? body.documentText.slice(0, 50000) : undefined;
    const documentFilename = typeof body?.documentFilename === "string" ? body.documentFilename : undefined;

    const classified = classifyQuery(query);
    const useDebate = debateMode || classified.needsDebate;

    // Fast path: known curated summaries (human-verified, skip all fetching)
    const knownAnswer = !useDebate ? knownSummaryToAnswer(query, zip ?? null) : null;
    if (knownAnswer) {
      const data = mapPolicyAnswerToOmni(knownAnswer, persona, classified.intent);
      const conversationId = await saveConversation(query, knownAnswer, zip).catch(() => null);
      return NextResponse.json({ success: true, data, conversationId });
    }

    // ── Gov Data First pipeline ──
    // Step 1: Detect if query is international and fetch all data in parallel
    const isNews = classified.intent === "news_update";
    const intlDetection = detectInternationalQuery(query);
    const isIntl = intlDetection.isInternational;

    const [govData, webSearchResults, intlData] = await Promise.all([
      // US gov data (skip heavy fetching for clearly international queries)
      (!isIntl ? fetchGovData({
        query,
        billId: classified.billId,
        zip,
        state: classified.state,
        intent: classified.intent,
        topics: classified.topics,
      }) : Promise.resolve({ bills: [], representatives: [], hadDirectBillLookup: false }))
        .catch((e) => {
          console.error("[omni] gov data fetch failed (non-fatal):", e);
          return { bills: [] as any[], representatives: [] as any[], hadDirectBillLookup: false };
        }),
      searchWeb(query, { isNews }).catch((e) => {
        console.error("[omni] web search failed (non-fatal):", e);
        return null;
      }),
      // International data (World Bank, EU, UK legislation)
      (isIntl ? fetchIntlData(query, intlDetection.regions) : Promise.resolve({ sources: [], region: "global" as const }))
        .catch((e) => {
          console.error("[omni] intl data fetch failed (non-fatal):", e);
          return { sources: [] as any[], region: "global" as const };
        }),
    ]);

    // Step 2: Build UNIFIED sources array with consistent numbering.
    // Order: intl sources -> gov sources -> web sources
    const intlSources = intlSourcesToAnswerSources(intlData.sources);
    const govSources = govBillsToSources(govData.bills);
    const rawWebResults = webSearchResults?.results ?? [];
    const validWebResults = filterValidResults(rawWebResults);

    const unifiedSources: PolicySource[] = [];

    // International sources get first positions [1]..[intlCount]
    for (let i = 0; i < intlSources.length; i++) {
      unifiedSources.push({ ...intlSources[i], id: i + 1 });
    }
    const intlCount = intlSources.length;

    // Gov sources get positions [intlCount+1]..[intlCount+govCount]
    for (let i = 0; i < govSources.length; i++) {
      unifiedSources.push({ ...govSources[i], id: intlCount + i + 1 });
    }
    const govCount = govSources.length;
    const preWebCount = intlCount + govCount;

    // Web sources get positions [preWebCount+1]..[total]
    const webSourceEntries = validWebResults.slice(0, 6);
    for (let i = 0; i < webSourceEntries.length; i++) {
      const r = webSourceEntries[i];
      let domain = "";
      try { domain = new URL(r.url).hostname.replace("www.", ""); } catch { domain = "source"; }
      const isGov = domain.endsWith(".gov");
      unifiedSources.push({
        id: preWebCount + i + 1,
        title: r.title,
        url: r.url,
        domain,
        type: isGov ? "Federal" : "Web",
        verified: true,
        excerpt: r.content?.slice(0, 300) || "",
      });
    }

    // Build the unified context string the AI sees (same numbering)
    const { text: intlContextStr, numberedCount: intlNumberedCount } = formatIntlContext(intlData, 1);
    const { text: govContextStr, numberedCount: govNumberedCount } = formatGovContext(govData, intlNumberedCount + 1);
    const webContextStr = formatWebContext(webSourceEntries, intlNumberedCount + govNumberedCount + 1);
    const combinedContext = [intlContextStr, govContextStr, webContextStr].filter(Boolean).join("\n\n");

    // Step 3: Generate answer with unified sources
    let data: OmniResponse;
    let answer: Answer;

    if (useDebate) {
      const result = await generateDebateAnswer(query, zip ?? null, combinedContext || undefined, unifiedSources);
      answer = result.answer;
      const perspectives: PerspectiveView[] = result.perspectives.map(p => ({
        label: p.label,
        summary: p.summary,
        citations: [],
        thinktank: p.thinktank,
      }));
      data = mapPolicyAnswerToOmni(answer, persona, "debate_prep", perspectives);
    } else {
      const docContext = documentText
        ? `[Uploaded: ${documentFilename || "document"}]\n\n${documentText}`
        : undefined;
      answer = await generatePolicyAnswer(query, zip ?? null, combinedContext || undefined, unifiedSources, docContext);
      const resolvedIntent = documentText ? "document_analysis" : isIntl ? "international_policy" : classified.intent;
      data = mapPolicyAnswerToOmni(answer, persona, resolvedIntent);
    }

    // Sources are already correct -- no prepending or shifting needed.

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
