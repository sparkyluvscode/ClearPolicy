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
          take: 100,
          include: {
            messages: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        zipCode: user.zipCode,
        preferredViewAs: user.preferredViewAs,
        theme: user.theme,
        totalConversations: user.totalConversations,
        totalQuestionsAsked: user.totalQuestionsAsked,
      },
      conversations: user.conversations.map((c) => ({
        id: c.id,
        policyName: c.policyName,
        policyLevel: c.policyLevel,
        zipCode: c.zipCode,
        createdAt: c.createdAt,
        messageCount: c.messageCount,
        messages: c.messages.map((m) => ({
          role: m.role,
          content: m.content.slice(0, 500),
          createdAt: m.createdAt,
        })),
      })),
    };

    return NextResponse.json(exportData);
  } catch (e) {
    console.error("[api/settings/export]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
