import { NextRequest, NextResponse } from "next/server";
import { congress } from "@/lib/clients/congress";
import { openstates } from "@/lib/clients/openstates";
import { z } from "zod";

const Params = z.object({ id: z.string(), source: z.enum(["os", "congress"]) });

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const source = req.nextUrl.searchParams.get("source");
  const parsed = Params.safeParse({ id, source });
  if (!parsed.success) return NextResponse.json({ error: "missing params" }, { status: 400 });

  if (parsed.data.source === "os") {
    const data = await openstates.billById(parsed.data.id).catch(() => null);
    if (!data) return NextResponse.json({ kind: "prop", jurisdiction: "CA", raw: null, error: "openstates unavailable" });
    return NextResponse.json({ kind: "prop", jurisdiction: "CA", raw: data });
  }
  if (parsed.data.source === "congress") {
    const [congressNum, billType, billNumber] = parsed.data.id.split(":");
    const data = await congress.billDetail(congressNum, billType, billNumber).catch(() => null);
    if (!data) return NextResponse.json({ kind: "bill", jurisdiction: "US", raw: null, error: "congress.gov unavailable" });
    return NextResponse.json({ kind: "bill", jurisdiction: "US", raw: data });
  }
  return NextResponse.json({ error: "bad source" }, { status: 400 });
}


