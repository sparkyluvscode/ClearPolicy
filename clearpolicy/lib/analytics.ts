import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";

function categorizeEvent(eventType: string): string {
  if (eventType.startsWith("search_")) return "search";
  if (eventType.startsWith("follow_up")) return "engagement";
  if (eventType.startsWith("source_")) return "sources";
  return "other";
}

export async function trackEvent(
  eventType: string,
  properties?: Record<string, unknown> & {
    policyId?: string;
    conversationId?: string;
  }
) {
  try {
    const { userId: clerkUserId } = await auth();
    let userId: string | undefined;

    if (clerkUserId) {
      const user = await prisma.user.findUnique({
        where: { clerkUserId },
      });
      userId = user?.id;
    }

    await prisma.event.create({
      data: {
        userId: userId ?? undefined,
        eventType,
        eventCategory: categorizeEvent(eventType),
        policyId: properties?.policyId,
        conversationId: properties?.conversationId,
        properties: properties ? JSON.stringify(properties) : undefined,
      },
    });
  } catch (e) {
    console.error("[analytics] trackEvent failed:", e);
  }
}
