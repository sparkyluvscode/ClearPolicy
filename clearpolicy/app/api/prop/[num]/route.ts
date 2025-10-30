import { NextRequest, NextResponse } from "next/server";

async function fetchText(url: string): Promise<string> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

function strip(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(_req: NextRequest, { params }: { params: { num: string } }) {
  const n = String(params.num || "").replace(/[^0-9]/g, "");
  if (!n) return NextResponse.json({ error: "missing" }, { status: 400 });

  const bpUrl = `https://ballotpedia.org/California_Proposition_${n}`;
  const laoUrl = `https://lao.ca.gov/BallotAnalysis/Propositions`;
  const [bp, lao] = await Promise.all([fetchText(bpUrl), fetchText(laoUrl)]);

  // Naive extraction for Ballotpedia: first paragraph after title and simple pros/cons bullets by headings
  let tldr = "";
  let pros: string[] = [];
  let cons: string[] = [];
  if (bp) {
    // Try meta description first for concise TL;DR
    const meta = bp.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    if (meta) tldr = strip(meta[1]).slice(0, 280);
    if (!tldr) {
      const paraMatch = bp.match(/<p>([\s\S]*?)<\/p>/i);
      if (paraMatch) tldr = strip(paraMatch[1]).slice(0, 280);
    }
    // Look for support/opposition sections
    const supportSec = bp.match(/>Support<[^]*?(<ul>[^]*?<\/ul>)/i) || bp.match(/Arguments\s+in\s+favor[^]*?(<ul>[^]*?<\/ul>)/i);
    if (supportSec) pros = strip(supportSec[1]).split(/\s*•\s*|\s*\n\s*/).filter(Boolean).slice(0, 3);
    const opposeSec = bp.match(/>Opposition<[^]*?(<ul>[^]*?<\/ul>)/i) || bp.match(/Arguments\s+against[^]*?(<ul>[^]*?<\/ul>)/i);
    if (opposeSec) cons = strip(opposeSec[1]).split(/\s*•\s*|\s*\n\s*/).filter(Boolean).slice(0, 3);
  }

  return NextResponse.json({
    number: n,
    sources: {
      ballotpedia: bp ? bpUrl : null,
      lao: lao ? laoUrl : null,
    },
    tldr,
    pros,
    cons,
  });
}


