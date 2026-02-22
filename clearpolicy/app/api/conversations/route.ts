import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, withRetry } from "@/lib/db";

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

    let user = await withRetry(() =>
      prisma.user.findUnique({ where: { clerkUserId } })
    );

    if (!user) {
      try {
        const { currentUser } = await import("@clerk/nextjs/server");
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
      } catch (createErr) {
        console.warn("[api/conversations] User creation failed:", createErr);
        return NextResponse.json({ conversations: [] });
      }
    }

    const conversations = await withRetry(() =>
      prisma.conversation.findMany({
        where: { userId: user!.id, isArchived: false },
        orderBy: { lastMessageAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          policyName: true,
          updatedAt: true,
          isStarred: true,
        },
      })
    );

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
      { error: e instanceof Error ? e.message : "Failed to load conversations" },
      { status: 500 }
    );
  }
}
