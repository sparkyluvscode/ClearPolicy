import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ShareView } from "./ShareView";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { shareToken: token },
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
  });

  if (!conversation) notFound();

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

  const cards = conversation.messages
    .filter((m) => m.role === "assistant" && m.answerCardData)
    .map((m, i) => {
      const data = JSON.parse(m.answerCardData!) as {
        heading?: string;
        sections?: Record<string, unknown>;
        fullTextSummary?: string;
      };
      const sec = data.sections || {};
      const sections: import("@/lib/omni-types").AnswerSection[] = [];

      if (typeof sec === "object" && "summary" in sec && sec.summary) {
        sections.push({ heading: "Summary", content: String(sec.summary), citations: [], confidence: "verified" as const });
      }
      const kp = (sec as Record<string, unknown>).keyProvisions;
      if (Array.isArray(kp) && kp.length > 0) {
        sections.push({ heading: "Key provisions", content: kp.join("\n"), citations: [], confidence: "verified" as const });
      }
      const li = (sec as Record<string, unknown>).localImpact as { content?: string; zipCode?: string; location?: string } | undefined;
      if (li?.content) {
        sections.push({ heading: `Local impact${li.zipCode ? ` · ${li.zipCode}` : ""}`, content: li.content, citations: [], confidence: "inferred" as const });
      }
      const af = (sec as Record<string, unknown>).argumentsFor;
      if (Array.isArray(af) && af.length > 0) {
        sections.push({ heading: "Arguments for", content: af.join("\n"), citations: [], confidence: "inferred" as const });
      }
      const aa = (sec as Record<string, unknown>).argumentsAgainst;
      if (Array.isArray(aa) && aa.length > 0) {
        sections.push({ heading: "Arguments against", content: aa.join("\n"), citations: [], confidence: "inferred" as const });
      }

      const msgIndex = conversation.messages.indexOf(m);
      const prevUser = msgIndex > 0 && conversation.messages[msgIndex - 1].role === "user" ? conversation.messages[msgIndex - 1].content : undefined;

      return {
        id: `card-${i}`,
        userQuery: i === 0 ? undefined : prevUser,
        heading: data.heading || conversation.policyName,
        cardType: "general" as const,
        sections,
        followUpSuggestions: [] as string[],
      };
    });

  return (
    <ShareView
      policyName={conversation.policyName}
      policyLevel={conversation.policyLevel || ""}
      cards={cards}
      sources={sources}
    />
  );
}
