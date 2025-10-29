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
      // Attach reason/score and partition direct vs related
      const enrich = (r: any) => {
        const title: string = String(r?.title || r?.identifier || "");
        const cls: string[] = Array.isArray(r?.classification) ? r.classification : [];
        const lower = title.toLowerCase();
        const sc = score(r);
        let reason = "Shown because it is related to your query.";
        let direct = false;
        if (lower === ql) { reason = "Shown because the title exactly matches your query."; direct = true; }
        else if (lower.includes(ql)) { reason = "Shown because the title contains your query words."; direct = true; }
        const m = ql.match(/prop\s*(\d+)/);
        if (m && (/proposition\s*\d+/i.test(title) || /prop\s*\d+/i.test(title))) { reason = `Shown because it matches Proposition ${m[1]}.`; direct = true; }
        if ((cls || []).map((x: any)=>String(x).toLowerCase()).includes("appropriation") && direct) { reason += " It is an appropriation bill."; }
        const preview = String(
          r?.latest_action_description || r?.latest_action?.description ||
          (Array.isArray(cls) && cls.length ? `Type: ${cls.join(", ")}` : "")
        ).slice(0, 180);
        return { ...r, _score: sc, _reason: reason, _direct: direct, _preview: preview };
      };
      const enriched = deduped.map(enrich);
      // Suppress weak related items
      const strong = enriched.filter((r: any) => r._direct || r._score >= 20);
      (ca as any).results = strong;
    } catch {}

    // Build trusted fallback links (always safe to show)
    const fallbacks: Array<{ label: string; url: string; hint: string; kind: "overview" | "official" | "analysis" }> = [];

    const ql = parsed.data.q.toLowerCase().trim();
    const push = (label: string, url: string, hint: string, kind: "overview" | "official" | "analysis") => fallbacks.push({ label, url, hint, kind });

    // General trusted portals
    push("Open States (California)", `https://v3.openstates.org/?subject=${encodeURIComponent(parsed.data.q)}`, "State bill records", "official");
    push("Congress.gov", `https://www.congress.gov/search?q=${encodeURIComponent(parsed.data.q)}`, "Federal legislation", "official");
    push("GovTrack", `https://www.govtrack.us/search?q=${encodeURIComponent(parsed.data.q)}`, "Federal bill summaries", "overview");
    push("Ballotpedia", `https://ballotpedia.org/wiki/index.php?search=${encodeURIComponent(parsed.data.q)}`, "Ballot measures overview", "overview");
    push("LAO (California)", `https://lao.ca.gov/Search?q=${encodeURIComponent(parsed.data.q)}`, "Legislative Analyst’s Office reports", "analysis");

    // Pattern: CA proposition
    // Add a virtual proposition result when user types "prop <number>"
    try {
      const m = ql.match(/prop\s*(\d{1,3})/);
      if (m) {
        const n = m[1];
        const ext = `https://www.google.com/search?q=${encodeURIComponent(`California Proposition ${n} site:ballotpedia.org OR site:lao.ca.gov`)}`;
        const virtual = {
          id: `prop-${n}-external`,
          identifier: `California Proposition ${n}`,
          title: `California Proposition ${n}`,
          classification: ["ballot"],
          externalUrl: ext,
          _direct: true,
          _reason: `Shown because it matches Proposition ${n}.`,
          _preview: "Open a trusted overview from Ballotpedia or LAO.",
        };
        const arr = Array.isArray((ca as any).results) ? (ca as any).results : [];
        (ca as any).results = [virtual, ...arr];
        push(`Ballotpedia – Proposition ${n}`, `https://ballotpedia.org/California_Proposition_${n}`, "Detailed ballot analysis", "overview");
        push("LAO – Propositions", `https://lao.ca.gov/BallotAnalysis/Propositions`, "Official LAO analyses", "analysis");
      }
    } catch {}

    // Pattern: CA bill AB/SB
    try {
      const mb = ql.match(/\b(a[bs]|sb|ab)\s*(\d{1,5})\b/);
      if (mb) {
        const bill = `${mb[1].toUpperCase()} ${mb[2]}`.replace("AS", "AB");
        push(`${bill} on Open States`, `https://v3.openstates.org/bills?jurisdiction=California&q=${encodeURIComponent(bill)}`, "Bill record", "official");
        push(`${bill} on LegInfo`, `https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml?search_text=${encodeURIComponent(bill)}`, "CA official site", "official");
      }
    } catch {}

    // Pattern: common federal acts
    if (/affordable care act|aca\b/.test(ql)) {
      push("Affordable Care Act – Congress.gov", "https://www.congress.gov/bill/111th-congress/house-bill/3590", "Original ACA bill page", "official");
      push("GovTrack – ACA overview", "https://www.govtrack.us/congress/bills/111/hr3590", "Bill overview and history", "overview");
    }
    if (/national defense authorization act|ndaa\b/.test(ql)) {
      push("NDAA – Congress.gov (search)", "https://www.congress.gov/search?q=%22National%20Defense%20Authorization%20Act%22", "Official federal records", "official");
      push("GovTrack – NDAA (search)", "https://www.govtrack.us/search?q=National%20Defense%20Authorization%20Act", "Bill summaries and status", "overview");
    }

    return NextResponse.json({ chips, ca, us, fallbacks });
  } catch (e: any) {
    return NextResponse.json({ chips: [], ca: { results: [] }, us: { data: { bills: [] } }, fallbacks: [], error: e?.message || "search failed" }, { status: 200 });
  }
}


