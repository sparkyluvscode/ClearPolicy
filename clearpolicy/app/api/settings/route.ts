import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  zipCode: z.string().nullable().optional(),
  preferredViewAs: z.string().nullable().optional(),
  theme: z.enum(["light", "dark"]).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        zipCode: parsed.data.zipCode ?? undefined,
        preferredViewAs: parsed.data.preferredViewAs ?? undefined,
        theme: parsed.data.theme ?? undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[api/settings PATCH]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
