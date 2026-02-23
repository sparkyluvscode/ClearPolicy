import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userCount = await withRetry(() => prisma.user.count());
    const convCount = await withRetry(() => prisma.conversation.count());
    return NextResponse.json({
      status: "ok",
      database: "connected",
      users: userCount,
      conversations: convCount,
      cwd: process.cwd(),
      dbUrl: process.env.DATABASE_URL?.replace(/\/Users\/[^/]+/, "/Users/***"),
    });
  } catch (e) {
    return NextResponse.json(
      {
        status: "error",
        database: "failed",
        error: e instanceof Error ? e.message : String(e),
        cwd: process.cwd(),
        dbUrl: process.env.DATABASE_URL?.replace(/\/Users\/[^/]+/, "/Users/***"),
      },
      { status: 500 },
    );
  }
}
