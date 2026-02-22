import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, withRetry } from "@/lib/db";
import { generateFollowUpAnswer } from "@/lib/policyEngine";
import { trackEvent } from "@/lib/analytics";
import { z } from "zod";

const BodySchema = z.object({
  message: z.string().min(1),
  persona: z.string().nullable().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Sign in to ask follow-ups" }, { status: 401 });
    }

    const { id: conversationId } = await context.params;
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { message, persona } = parsed.data;

    const user = await withRetry(() =>
      prisma.user.findUnique({ where: { clerkUserId } })
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const conversation = await withRetry(() =>
      prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    );

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    if (conversation.userId !== user.id) {
      return NextResponse.json({ error: "Not your conversation" }, { status: 403 });
    }

    const history = conversation.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const { answer, suggestions } = await generateFollowUpAnswer(
      message,
      history,
      persona
    );

    await withRetry(() =>
      prisma.message.create({
        data: {
          conversationId,
          role: "user",
          content: message,
        },
      })
    );

    const assistantMessage = await withRetry(() =>
      prisma.message.create({
        data: {
          conversationId,
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
      (s) => s.url && s.url !== "https://example.com"
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
            messageId: assistantMessage.id,
            sourceId: convSource.id,
            citationNumber: i + 1,
          },
        });
      } catch (srcErr) {
        console.warn("[conversation/message] Failed to save source:", s.url, srcErr);
      }
    }

    await withRetry(() =>
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          messageCount: conversation.messageCount + 2,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      })
    );

    await trackEvent("follow_up_asked", {
      conversationId,
      policyId: answer.policyId,
    });

    return NextResponse.json({
      answer: {
        policyId: answer.policyId,
        policyName: answer.policyName,
        level: answer.level,
        category: answer.category,
        fullTextSummary: answer.fullTextSummary,
        sections: answer.sections,
        sources: answer.sources,
      },
      followUpSuggestions: suggestions,
      assistantMessage: { id: assistantMessage.id },
    });
  } catch (e) {
    console.error("[api/conversation message]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
