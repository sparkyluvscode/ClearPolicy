import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const Body = z.object({ page: z.string(), measureSlug: z.string().optional(), message: z.string().min(3), contact: z.string().optional() });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const f = await prisma.feedback.create({ data: parsed.data });
  return NextResponse.json({ ok: true, id: f.id });
}


