import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: {
        conversations: {
          orderBy: { lastMessageAt: "desc" },
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
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 500,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      format: "ClearPolicy User Data Export v1",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        zipCode: user.zipCode,
        preferredViewAs: user.preferredViewAs,
        theme: user.theme,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        totalConversations: user.totalConversations,
        totalQuestionsAsked: user.totalQuestionsAsked,
      },
      conversations: user.conversations.map((c) => ({
        id: c.id,
        policyName: c.policyName,
        policyLevel: c.policyLevel,
        policyCategory: c.policyCategory,
        title: c.title,
        zipCode: c.zipCode,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messageCount: c.messageCount,
        isStarred: c.isStarred,
        isArchived: c.isArchived,
        messages: c.messages.map((m) => ({
          role: m.role,
          content: m.content,
          answerCardData: m.answerCardData,
          createdAt: m.createdAt,
          wasHelpful: m.wasHelpful,
          sources: m.messageSources.map((ms) => ({
            citationNumber: ms.citationNumber,
            url: ms.source.url,
            title: ms.source.title,
            domain: ms.source.domain,
            sourceType: ms.source.sourceType,
            verified: ms.source.verified,
          })),
        })),
      })),
      events: user.events.map((e) => ({
        eventType: e.eventType,
        eventCategory: e.eventCategory,
        policyId: e.policyId,
        properties: e.properties,
        createdAt: e.createdAt,
      })),
    };

    // Return as a downloadable JSON file
    const json = JSON.stringify(exportData, null, 2);
    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="clearpolicy-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (e) {
    console.error("[api/settings/export]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
