import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const PatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isStarred: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

async function getConversationForUser(conversationId: string, clerkUserId: string) {
  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) return null;
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation || conversation.userId !== user.id) return null;
  return conversation;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const conversation = await getConversationForUser(id, clerkUserId);
    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.isStarred !== undefined && { isStarred: parsed.data.isStarred }),
        ...(parsed.data.isArchived !== undefined && { isArchived: parsed.data.isArchived }),
      },
    });

    return NextResponse.json({ conversation: { id: updated.id, title: updated.title, isStarred: updated.isStarred, isArchived: updated.isArchived } });
  } catch (e) {
    console.error("[api/conversations/[id] PATCH]", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const conversation = await getConversationForUser(id, clerkUserId);
    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.conversation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[api/conversations/[id] DELETE]", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
