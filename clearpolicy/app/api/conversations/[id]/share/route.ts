import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

function generateToken(): string {
  return randomBytes(9).toString("base64url");
}

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const user = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation || conversation.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (conversation.shareToken) {
      return NextResponse.json({
        shareToken: conversation.shareToken,
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.clearpolicy.org"}/share/${conversation.shareToken}`,
      });
    }

    const token = generateToken();
    await prisma.conversation.update({
      where: { id },
      data: { shareToken: token },
    });

    return NextResponse.json({
      shareToken: token,
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.clearpolicy.org"}/share/${token}`,
    });
  } catch (e) {
    console.error("[api/conversations/[id]/share]", e);
    return NextResponse.json({ error: "Failed to generate share link" }, { status: 500 });
  }
}
