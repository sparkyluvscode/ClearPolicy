import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export type ConversationListItem = {
  id: string;
  title: string | null;
  policyName: string;
  updatedAt: string;
  isStarred: boolean;
};

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Sign in to view history" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });
    if (!user) {
      return NextResponse.json({ conversations: [] });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        policyName: true,
        updatedAt: true,
        isStarred: true,
      },
    });

    const list: ConversationListItem[] = conversations.map((c) => ({
      id: c.id,
      title: c.title,
      policyName: c.policyName,
      updatedAt: c.updatedAt.toISOString(),
      isStarred: c.isStarred,
    }));

    return NextResponse.json({ conversations: list });
  } catch (e) {
    console.error("[api/conversations]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
