import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // TODO: Delete user data from our DB and optionally trigger Clerk user deletion.
  // For now return a stub message.
  return NextResponse.json({
    message: "Account deletion is not implemented yet. Contact support.",
  });
}
