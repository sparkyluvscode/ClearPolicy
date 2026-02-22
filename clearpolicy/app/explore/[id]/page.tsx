import { notFound } from "next/navigation";
import { prisma, withRetry } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { ExploreClient } from "./ExploreClient";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let clerkUserId: string | null = null;
  try {
    const authResult = await auth();
    clerkUserId = authResult.userId;
  } catch {
    // Auth unavailable — treat as unauthenticated
  }

  if (!clerkUserId) notFound();

  const conversation = await withRetry(() =>
    prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            messageSources: {
              include: { source: true },
            },
          },
        },
      },
    })
  );

  if (!conversation) notFound();

  // Verify ownership
  const user = await withRetry(() =>
    prisma.user.findUnique({ where: { clerkUserId: clerkUserId! } })
  );
  if (!user || conversation.userId !== user.id) notFound();

  // Reconstruct the data in the shape the immersive search UI expects
  const sources = Array.from(
    new Map(
      conversation.messages
        .flatMap((m) =>
          m.messageSources.map((ms) => ({
            id: ms.source.id,
            type: (ms.source.sourceType === "Federal"
              ? "federal_bill"
              : ms.source.sourceType === "State"
              ? "state_bill"
              : ms.source.sourceType === "Gov"
              ? "government_site"
              : "web_search") as import("@/lib/omni-types").SourceType,
            title: ms.source.title || "Source",
            url: ms.source.url,
            snippet: "",
            publisher: ms.source.domain || undefined,
            relevance: 1,
            jurisdiction: (ms.source.sourceType === "Federal"
              ? "federal"
              : ms.source.sourceType === "State"
              ? "state"
              : undefined) as "federal" | "state" | "local" | undefined,
          }))
        )
        .map((s) => [s.id, s])
    ).values()
  );

  // Build cards from assistant messages with safe JSON parsing
  const cards = conversation.messages
    .filter((m) => m.role === "assistant" && m.answerCardData)
    .map((m, i) => {
      let data: {
        heading?: string;
        sections?: Record<string, unknown>;
        fullTextSummary?: string;
      };
      try {
        data = JSON.parse(m.answerCardData!);
      } catch {
        data = {
          heading: conversation.policyName,
          sections: {},
          fullTextSummary: m.content,
        };
      }
      const sec = data.sections || {};
      const sections: import("@/lib/omni-types").AnswerSection[] = [];

      if (typeof sec === "object" && "summary" in sec && sec.summary) {
        sections.push({
          heading: "Summary",
          content: String(sec.summary),
          citations: [],
          confidence: "verified" as const,
        });
      }

      const kp = (sec as Record<string, unknown>).keyProvisions;
      if (Array.isArray(kp) && kp.length > 0) {
        sections.push({
          heading: "Key provisions",
          content: kp.join("\n"),
          citations: [],
          confidence: "verified" as const,
        });
      }

      const li = (sec as Record<string, unknown>).localImpact as
        | { content?: string; zipCode?: string; location?: string }
        | undefined;
      if (li?.content) {
        sections.push({
          heading: `Local impact${li.zipCode ? ` · ${li.zipCode}` : ""}`,
          content: li.content,
          citations: [],
          confidence: "inferred" as const,
        });
      }

      const af = (sec as Record<string, unknown>).argumentsFor;
      if (Array.isArray(af) && af.length > 0) {
        sections.push({
          heading: "Arguments for",
          content: af.join("\n"),
          citations: [],
          confidence: "inferred" as const,
        });
      }

      const aa = (sec as Record<string, unknown>).argumentsAgainst;
      if (Array.isArray(aa) && aa.length > 0) {
        sections.push({
          heading: "Arguments against",
          content: aa.join("\n"),
          citations: [],
          confidence: "inferred" as const,
        });
      }

      // Fallback if no structured sections were extracted
      if (sections.length === 0 && (data.fullTextSummary || m.content)) {
        sections.push({
          heading: "Overview",
          content: data.fullTextSummary || m.content,
          citations: [],
          confidence: "verified" as const,
        });
      }

      // Find the user message right before this assistant message
      const msgIndex = conversation.messages.indexOf(m);
      const prevUser =
        msgIndex > 0 && conversation.messages[msgIndex - 1].role === "user"
          ? conversation.messages[msgIndex - 1].content
          : undefined;

      return {
        id: `card-${i}`,
        userQuery: i === 0 ? undefined : prevUser,
        heading: data.heading || conversation.policyName,
        cardType: "general" as const,
        sections,
        followUpSuggestions:
          i === conversation.messages.filter((x) => x.role === "assistant").length - 1
            ? [
                "How does this affect renters?",
                "What are the main criticisms?",
                "Compare to similar policies",
              ]
            : [],
      };
    });

  const firstUserMsg = conversation.messages.find((m) => m.role === "user");

  return (
    <ExploreClient
      conversationId={conversation.id}
      policyName={conversation.policyName}
      policyLevel={conversation.policyLevel || ""}
      originalQuery={firstUserMsg?.content || conversation.policyName}
      zip={conversation.zipCode || undefined}
      cards={cards}
      sources={sources}
    />
  );
}
