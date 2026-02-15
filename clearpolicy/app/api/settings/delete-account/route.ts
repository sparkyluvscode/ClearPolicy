import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete everything in a transaction so partial deletion can't happen
    await prisma.$transaction([
      prisma.event.deleteMany({ where: { userId: user.id } }),
      prisma.conversation.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    // Note: Clerk user is NOT deleted here (would require Clerk Backend API + CLERK_SECRET_KEY).
    // The user can still sign in with Clerk, but their app data is gone.
    // A fresh User record will be created on next sign-in.

    return NextResponse.json({
      message: "Your account data has been deleted. You can close this page.",
    });
  } catch (e) {
    console.error("[api/settings/delete-account]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete account" },
      { status: 500 }
    );
  }
}
