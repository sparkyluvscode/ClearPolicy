import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ConversationView } from "@/components/conversation/ConversationView";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
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
  });

  if (!conversation) notFound();

  const messagesWithSources = conversation.messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    answerCardData: m.answerCardData
      ? (JSON.parse(m.answerCardData) as {
          heading?: string;
          sections?: import("@/lib/policy-types").AnswerSection;
          fullTextSummary?: string;
        })
      : null,
    sources: m.messageSources.map((ms) => ({
      id: ms.source.id,
      url: ms.source.url,
      title: ms.source.title,
      domain: ms.source.domain,
      sourceType: ms.source.sourceType,
      verified: ms.source.verified,
      citationNumber: ms.citationNumber,
    })),
  }));

  return (
    <ConversationView
      conversationId={conversation.id}
      policyName={conversation.policyName}
      policyLevel={conversation.policyLevel}
      policyCategory={conversation.policyCategory}
      zipCode={conversation.zipCode}
      messages={messagesWithSources}
    />
  );
}
