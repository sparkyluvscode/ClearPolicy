import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma, withRetry } from "@/lib/db";
import { z } from "zod";

const BodySchema = z.object({
  query: z.string().min(1),
  title: z.string().min(1),
  tldr: z.string(),
  sections: z.array(z.object({
    heading: z.string(),
    content: z.string(),
    citations: z.array(z.unknown()).optional(),
    confidence: z.string().optional(),
  })),
  sources: z.array(z.object({
    id: z.union([z.string(), z.number()]),
    title: z.string(),
    url: z.string(),
    type: z.string().optional(),
    publisher: z.string().optional(),
  })),
  zip: z.string().optional(),
});

export const dynamic = "force-dynamic";

/**
 * Fallback: save a search result to My Research when the initial omni save
 * failed (e.g. auth cookie not sent). Call this from the search page when
 * the user is signed in but conversationId was null.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Sign in to save" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { query, title, tldr, sections, sources, zip } = parsed.data;

    const fullTextSummary = sections.length > 0
      ? sections.map((s) => `${s.heading}\n${s.content}`).join("\n\n")
      : tldr;

    const answerSections: Record<string, unknown> = {};
    const summarySec = sections.find((s) => s.heading.toLowerCase().includes("summary"));
    if (summarySec) answerSections.summary = summarySec.content;
    const kpSec = sections.find((s) => s.heading.toLowerCase().includes("provision") || s.heading.toLowerCase().includes("key"));
    if (kpSec) answerSections.keyProvisions = kpSec.content.split("\n").filter(Boolean);
    const afSec = sections.find((s) => s.heading.toLowerCase().includes("for"));
    if (afSec) answerSections.argumentsFor = afSec.content.split("\n").filter(Boolean);
    const aaSec = sections.find((s) => s.heading.toLowerCase().includes("against"));
    if (aaSec) answerSections.argumentsAgainst = aaSec.content.split("\n").filter(Boolean);

    const policySources = sources.map((s, i) => ({
      id: i + 1,
      title: s.title,
      url: s.url,
      domain: s.publisher || (() => {
        try {
          return s.url ? new URL(s.url).hostname : "example.com";
        } catch {
          return "example.com";
        }
      })(),
      type: (s.type === "federal_bill" ? "Federal" : s.type === "state_bill" ? "State" : "Web") as "Federal" | "State" | "Local" | "Web",
      verified: !!s.url,
    }));

    let user = await withRetry(() =>
      prisma.user.findUnique({ where: { clerkUserId } })
    );
    if (!user) {
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
    }

    const conversation = await withRetry(() =>
      prisma.conversation.create({
        data: {
          userId: user!.id,
          policyId: `save-${Date.now()}`,
          policyName: title,
          policyLevel: "",
          policyCategory: "",
          title: title.slice(0, 120),
          zipCode: zip ?? null,
          messageCount: 2,
          lastMessageAt: new Date(),
        },
      })
    );

    await withRetry(() =>
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: query,
        },
      })
    );

    const assistantMsg = await withRetry(() =>
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: fullTextSummary,
          answerCardData: JSON.stringify({
            heading: title,
            sections: answerSections,
            fullTextSummary,
          }),
        },
      })
    );

    const validSources = policySources.filter((s) => s.url && s.url !== "https://example.com");
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
            messageId: assistantMsg.id,
            sourceId: convSource.id,
            citationNumber: i + 1,
          },
        });
      } catch (srcErr) {
        console.warn("[save-search] Failed to save source:", s.url, srcErr);
      }
    }

    return NextResponse.json({ conversationId: conversation.id });
  } catch (e) {
    console.error("[save-search]", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
