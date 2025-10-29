import { NextRequest, NextResponse } from "next/server";
import { openstates } from "@/lib/clients/openstates";
import { congress } from "@/lib/clients/congress";
import { disambiguate } from "@/lib/normalize";
import { z } from "zod";

const QuerySchema = z.object({ q: z.string().default("") });

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const parsed = QuerySchema.safeParse({ q });
    if (!parsed.success) return NextResponse.json({ error: "invalid query" }, { status: 400 });
    const chips = disambiguate(parsed.data.q);
    const [ca, us] = await Promise.all([
      openstates.searchBills(parsed.data.q, "ca").catch(() => ({ results: [] })),
      congress.searchBills(parsed.data.q).catch(() => ({ data: { bills: [] } })),
    ]);

    // CA ranking & dedupe
    try {
      const ql = parsed.data.q.toLowerCase();
      const caItems: any[] = Array.isArray((ca as any).results) ? (ca as any).results : [];
      const seen = new Set<string>();
      const deduped = caItems.filter((r: any) => {
        const key = (r?.title || r?.identifier || "").toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const score = (r: any) => {
        const title: string = String(r?.title || r?.identifier || "").toLowerCase();
        const cls: string[] = Array.isArray(r?.classification) ? r.classification.map((x: any) => String(x).toLowerCase()) : [];
        let s = 0;
        if (title === ql) s += 100;
        if (title.includes(ql)) s += 40;
        // Prop N detection boosts
        const m = ql.match(/prop\s*(\d+)/);
        if (m) {
          if (/proposition\s*\d+/.test(title) || /prop\s*\d+/.test(title)) s += 30;
          // de-boost appropriation noise
          if (cls.includes("appropriation")) s -= 30;
        }
        if (title.length < 12) s -= 5;
        const updated = Date.parse(r?.updated_at || r?.created_at || "");
        if (!isNaN(updated)) s += Math.min(20, Math.max(0, (updated - Date.parse("2010-01-01")) / (1000 * 3600 * 24 * 365)));
        return s;
      };
      deduped.sort((a, b) => {
        const sb = score(b);
        const sa = score(a);
        const nb = Number.isFinite(sb) ? sb : -Infinity;
        const na = Number.isFinite(sa) ? sa : -Infinity;
        return nb - na;
      });
      (ca as any).results = deduped;
    } catch {}

    return NextResponse.json({ chips, ca, us });
  } catch (e: any) {
    return NextResponse.json({ chips: [], ca: { results: [] }, us: { data: { bills: [] } }, error: e?.message || "search failed" }, { status: 200 });
  }
}


