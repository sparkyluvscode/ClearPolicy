/**
 * Gov Data First pipeline - fetches structured data from government APIs
 * (Congress.gov, Open States, Google Civic) BEFORE calling the LLM.
 *
 * The AI's job becomes: summarize and explain verified data, not invent facts.
 */

import { congress } from "./clients/congress";
import { openstates } from "./clients/openstates";
import type { AnswerSource } from "./policy-types";

/* --- Types --- */

export interface GovBill {
  identifier: string;
  title: string;
  summary?: string;
  status?: string;
  latestAction?: string;
  sponsors?: string[];
  introducedDate?: string;
  chamber?: string;
  level: "Federal" | "State";
  state?: string;
  sourceUrl: string;
  sourceName: string;
  provisions?: string[];
}

export interface GovRepresentative {
  name: string;
  party?: string;
  office?: string;
  url?: string;
}

export interface GovContext {
  bills: GovBill[];
  representatives: GovRepresentative[];
  location?: { city?: string; state?: string };
  hadDirectBillLookup: boolean;
}

/* --- Bill ID parsing --- */

interface ParsedBillRef {
  type: "federal" | "state";
  chamber?: "hr" | "s" | "hjres" | "sjres" | "hconres" | "sconres" | "hres" | "sres";
  prefix?: string; // AB, SB, HB, etc.
  number: string;
  congressNum?: string;
}

function parseBillId(raw: string, state?: string): ParsedBillRef | null {
  const cleaned = raw.trim();

  // Federal: H.R. 1234, HR 1234, S. 5678, S 5678, H.J.Res. 12, etc.
  const fedMatch = cleaned.match(
    /\b(H\.?\s*R\.?|H\.?\s*J\.?\s*R(?:es)?\.?|H\.?\s*(?:Con)?\.?\s*Res\.?|S\.?\s*J\.?\s*R(?:es)?\.?|S\.?\s*(?:Con)?\.?\s*Res\.?|S\.?)\s*\.?\s*(\d+)/i
  );
  if (fedMatch) {
    const rawPrefix = fedMatch[1].replace(/[\s.]/g, "").toLowerCase();
    let chamber: ParsedBillRef["chamber"] = "hr";
    if (/^s$/i.test(rawPrefix) || rawPrefix === "s") chamber = "s";
    else if (/^(hr|h\.?r\.?)$/i.test(rawPrefix)) chamber = "hr";
    else if (/hjr/i.test(rawPrefix)) chamber = "hjres";
    else if (/sjr/i.test(rawPrefix)) chamber = "sjres";
    else if (/hconres/i.test(rawPrefix)) chamber = "hconres";
    else if (/sconres/i.test(rawPrefix)) chamber = "sconres";
    else if (/hres/i.test(rawPrefix)) chamber = "hres";
    else if (/sres/i.test(rawPrefix)) chamber = "sres";
    return { type: "federal", chamber, number: fedMatch[2] };
  }

  // State: AB 1482, SB 1234, HB 100, etc.
  const stateMatch = cleaned.match(/\b(A\.?B\.?|S\.?B\.?|H\.?B\.?)\s*\.?\s*(\d+)/i);
  if (stateMatch) {
    return {
      type: "state",
      prefix: stateMatch[1].replace(/\./g, "").toUpperCase(),
      number: stateMatch[2],
    };
  }

  // Proposition: Prop 22, Proposition 36
  const propMatch = cleaned.match(/\b(?:prop|proposition)\s*(\d+)/i);
  if (propMatch) {
    return {
      type: "state",
      prefix: "PROP",
      number: propMatch[1],
    };
  }

  return null;
}

/* --- Congress.gov fetcher --- */

async function fetchFederalBill(ref: ParsedBillRef): Promise<GovBill | null> {
  try {
    // Try bill detail with current congress (119th for 2025-2026)
    const congresses = ["119", "118", "117"];
    for (const congressNum of congresses) {
      const detail = await congress.billDetail(congressNum, ref.chamber || "hr", ref.number);
      if (detail?.bill) {
        const b = detail.bill;
        const sponsors = [];
        if (b.sponsors?.length) {
          sponsors.push(...b.sponsors.map((s: any) => s.fullName || s.firstName + " " + s.lastName).filter(Boolean));
        } else if (b.sponsor) {
          sponsors.push(b.sponsor.fullName || `${b.sponsor.firstName || ""} ${b.sponsor.lastName || ""}`.trim());
        }
        return {
          identifier: `${(ref.chamber || "hr").toUpperCase()} ${ref.number}`,
          title: b.title || b.shortTitle || "",
          summary: b.summaries?.[0]?.text || b.summary?.text || undefined,
          status: b.latestAction?.text || undefined,
          latestAction: b.latestAction?.text || undefined,
          sponsors: sponsors.length ? sponsors : undefined,
          introducedDate: b.introducedDate || undefined,
          chamber: ref.chamber === "s" || ref.chamber === "sjres" || ref.chamber === "sconres" || ref.chamber === "sres" ? "Senate" : "House",
          level: "Federal",
          sourceUrl: `https://www.congress.gov/bill/${congressNum}th-congress/${ref.chamber === "s" ? "senate" : "house"}-bill/${ref.number}`,
          sourceName: "Congress.gov",
        };
      }
    }

    // Fallback: search by text
    const searchResult = await congress.searchBills(`${(ref.chamber || "hr").toUpperCase()} ${ref.number}`);
    const bills = searchResult?.data?.bills;
    if (Array.isArray(bills) && bills.length > 0) {
      const b = bills[0];
      return {
        identifier: `${(ref.chamber || "hr").toUpperCase()} ${ref.number}`,
        title: b.title || "",
        status: b.latestAction?.text || undefined,
        latestAction: b.latestAction?.text || undefined,
        introducedDate: b.introducedDate || undefined,
        level: "Federal",
        sourceUrl: b.url || `https://www.congress.gov/bill/${b.congress || "119"}th-congress/${ref.chamber === "s" ? "senate" : "house"}-bill/${ref.number}`,
        sourceName: "Congress.gov",
      };
    }
  } catch (e) {
    console.error("[gov-data] Congress.gov fetch failed:", e);
  }
  return null;
}

/* --- Open States fetcher --- */

async function fetchStateBills(ref: ParsedBillRef, stateCode: string): Promise<GovBill[]> {
  try {
    if (ref.prefix === "PROP") {
      const result = await openstates.searchBills(`proposition ${ref.number}`, stateCode);
      const bills = result?.results;
      if (Array.isArray(bills) && bills.length > 0) {
        return bills.slice(0, 3).map((b: any) => mapOpenStatesBill(b, stateCode, `Proposition ${ref.number}`));
      }
      return [];
    }

    const identifier = `${ref.prefix} ${ref.number}`;
    const byId = await openstates.searchByIdentifier(identifier, stateCode);
    if (byId?.results?.length) {
      return byId.results.slice(0, 3).map((b: any) => mapOpenStatesBill(b, stateCode, identifier));
    }

    const byText = await openstates.searchBills(identifier, stateCode);
    if (byText?.results?.length) {
      return byText.results.slice(0, 3).map((b: any) => mapOpenStatesBill(b, stateCode, identifier));
    }
  } catch (e) {
    console.error("[gov-data] Open States fetch failed:", e);
  }
  return [];
}

function mapOpenStatesBill(b: any, stateCode: string, fallbackId: string): GovBill {
  const sponsors = Array.isArray(b.sponsors)
    ? b.sponsors.map((s: any) => s.name).filter(Boolean)
    : undefined;
  return {
    identifier: b.identifier || fallbackId,
    title: b.title || "",
    summary: b.abstract || b.description || undefined,
    status: b.latest_action_description || undefined,
    latestAction: b.latest_action_description || undefined,
    sponsors,
    introducedDate: b.created_at || b.first_action_date || undefined,
    chamber: b.from_organization?.classification || undefined,
    level: "State",
    state: stateCode.toUpperCase(),
    sourceUrl: b.openstates_url || `https://openstates.org/search/?query=${encodeURIComponent(fallbackId)}`,
    sourceName: `Open States (${stateCode.toUpperCase()})`,
  };
}

/* --- Topic search (returns multiple related bills) --- */

const TOPIC_TO_SEARCH: Record<string, string> = {
  healthcare: "healthcare health care medical",
  health: "healthcare public health",
  immigration: "immigration visa border",
  housing: "housing rent affordable",
  education: "education schools K-12 higher education",
  climate: "climate change environment emissions",
  economy: "economy jobs employment wages",
  crime: "criminal justice public safety",
  tax: "taxation tax reform",
  gun: "firearms gun control second amendment",
  tech: "technology artificial intelligence data privacy",
  voting: "voting election ballot",
};

function extractTopicSearchTerms(query: string, topics?: string[]): string {
  if (topics?.length) {
    const expanded = topics.map((t) => TOPIC_TO_SEARCH[t] || t);
    return expanded.join(" ");
  }
  return query
    .replace(/\b(what|which|how|does|do|is|are|the|my|in|for|about|affect|impact|explain|tell me|can you|area|policies)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || query;
}

async function searchBillsByTopic(query: string, state?: string, topics?: string[]): Promise<GovBill[]> {
  const searchTerms = extractTopicSearchTerms(query, topics);
  const bills: GovBill[] = [];

  const stateCode = state || "ca";
  const [fedResult, stateResult] = await Promise.allSettled([
    congress.searchBills(searchTerms),
    openstates.searchBills(searchTerms, stateCode),
  ]);

  if (fedResult.status === "fulfilled") {
    const fedBills = fedResult.value?.data?.bills;
    if (Array.isArray(fedBills)) {
      for (const b of fedBills.slice(0, 3)) {
        bills.push({
          identifier: `${b.type || "HR"} ${b.number || ""}`.trim(),
          title: b.title || "",
          status: b.latestAction?.text || undefined,
          introducedDate: b.introducedDate || undefined,
          level: "Federal",
          sourceUrl: b.url || "https://www.congress.gov",
          sourceName: "Congress.gov",
        });
      }
    }
  }

  if (stateResult.status === "fulfilled") {
    const stateCode = state || "ca";
    const stateBills = stateResult.value?.results;
    if (Array.isArray(stateBills)) {
      for (const b of stateBills.slice(0, 3)) {
        bills.push(mapOpenStatesBill(b, stateCode, b.identifier || searchTerms));
      }
    }
  }

  return bills;
}

/* --- Civic API - representative lookup --- */

async function fetchRepresentatives(zip: string): Promise<{
  reps: GovRepresentative[];
  location?: { city?: string; state?: string };
}> {
  try {
    const key = process.env.GOOGLE_CIVIC_API_KEY;
    if (!key || key === "your_google_civic_key") {
      return { reps: [] };
    }

    const url = new URL("https://www.googleapis.com/civicinfo/v2/representatives");
    url.searchParams.set("key", key);
    url.searchParams.set("address", zip);
    url.searchParams.set("levels", "country");
    url.searchParams.set("levels", "administrativeArea1");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return { reps: [] };

    const data = await res.json();
    const officials = data?.officials || [];
    const offices = data?.offices || [];
    const normalizedInput = data?.normalizedInput || {};

    const reps: GovRepresentative[] = [];
    for (const office of offices) {
      const indices = office.officialIndices || [];
      for (const idx of indices) {
        const official = officials[idx];
        if (official) {
          reps.push({
            name: official.name,
            party: official.party,
            office: office.name,
            url: official.urls?.[0] || undefined,
          });
        }
      }
    }

    return {
      reps,
      location: {
        city: normalizedInput.city || undefined,
        state: normalizedInput.state || undefined,
      },
    };
  } catch (e) {
    console.error("[gov-data] Civic API fetch failed:", e);
    return { reps: [] };
  }
}

/* --- Main orchestrator --- */

export interface FetchGovDataOptions {
  query: string;
  billId?: string;
  zip?: string;
  state?: string;
  intent?: string;
  topics?: string[];
}

export async function fetchGovData(options: FetchGovDataOptions): Promise<GovContext> {
  const { query, billId, zip, state, intent, topics } = options;

  const context: GovContext = { bills: [], representatives: [], hadDirectBillLookup: false };

  // 1. Bill lookup - highest priority when a bill identifier is detected
  if (billId) {
    const ref = parseBillId(billId, state);
    if (ref) {
      if (ref.type === "federal") {
        const bill = await fetchFederalBill(ref);
        if (bill) {
          context.bills.push(bill);
          context.hadDirectBillLookup = true;
        }
      } else {
        const bills = await fetchStateBills(ref, state || "ca");
        if (bills.length) {
          context.bills.push(...bills);
          context.hadDirectBillLookup = true;
        }
      }
    }
  }

  // 2. Topic search - when no specific bill is found, search for related legislation
  if (context.bills.length === 0 && intent !== "news_update") {
    const topicBills = await searchBillsByTopic(query, state, topics);
    // Filter to bills that are actually relevant to the query
    const queryWords = new Set(
      query.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 3)
    );
    const relevant = topicBills.filter((b) => {
      const titleWords = b.title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
      const overlap = titleWords.filter((w) => queryWords.has(w)).length;
      return overlap >= 1 || b.title.toLowerCase().includes(query.toLowerCase().slice(0, 20));
    });
    context.bills.push(...(relevant.length > 0 ? relevant : topicBills.slice(0, 2)));
  }

  // 3. Representative lookup when ZIP is provided
  if (zip) {
    const { reps, location } = await fetchRepresentatives(zip);
    context.representatives = reps;
    context.location = location;
  }

  return context;
}

/* --- Format gov data into prompt context --- */

export function formatGovContext(ctx: GovContext): string {
  if (ctx.bills.length === 0 && ctx.representatives.length === 0) return "";

  const parts: string[] = [];

  if (ctx.bills.length > 0) {
    parts.push("=== OFFICIAL GOVERNMENT DATA (use as PRIMARY factual basis) ===");

    for (const bill of ctx.bills) {
      const lines: string[] = [];
      lines.push(`Bill: ${bill.identifier} - ${bill.title}`);
      lines.push(`Source: ${bill.sourceName} (${bill.sourceUrl})`);
      lines.push(`Level: ${bill.level}${bill.state ? ` (${bill.state})` : ""}`);
      if (bill.status) lines.push(`Status: ${bill.status}`);
      if (bill.latestAction) lines.push(`Latest Action: ${bill.latestAction}`);
      if (bill.sponsors?.length) lines.push(`Sponsors: ${bill.sponsors.join(", ")}`);
      if (bill.introducedDate) lines.push(`Introduced: ${bill.introducedDate}`);
      if (bill.chamber) lines.push(`Chamber: ${bill.chamber}`);
      if (bill.summary) {
        const cleanSummary = bill.summary
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 1500);
        lines.push(`Official Summary: ${cleanSummary}`);
      }
      parts.push(lines.join("\n"));
    }
  }

  if (ctx.representatives.length > 0) {
    parts.push("\n=== USER'S ELECTED REPRESENTATIVES ===");
    const location = ctx.location
      ? `Location: ${[ctx.location.city, ctx.location.state].filter(Boolean).join(", ")}`
      : "";
    if (location) parts.push(location);
    for (const rep of ctx.representatives) {
      const repLine = [
        rep.name,
        rep.party ? `(${rep.party})` : "",
        rep.office ? `- ${rep.office}` : "",
      ].filter(Boolean).join(" ");
      parts.push(`• ${repLine}`);
    }
  }

  return parts.join("\n\n");
}

/* --- Convert gov bills to AnswerSource for the UI --- */

export function govBillsToSources(bills: GovBill[]): AnswerSource[] {
  return bills.slice(0, 6).map((b, i) => {
    let domain = "";
    try { domain = new URL(b.sourceUrl).hostname.replace("www.", ""); } catch { domain = "source"; }
    const excerptParts = [
      b.summary,
      b.latestAction ? `Latest action: ${b.latestAction}` : null,
      b.sponsors?.length ? `Sponsor(s): ${b.sponsors.join(", ")}` : null,
      b.status ? `Status: ${b.status}` : null,
    ].filter(Boolean);
    return {
      id: i + 1,
      title: `${b.identifier}: ${b.title}`.slice(0, 120),
      url: b.sourceUrl,
      domain,
      type: b.level,
      verified: true,
      excerpt: excerptParts.join(" | ").slice(0, 400) || undefined,
    };
  });
}
