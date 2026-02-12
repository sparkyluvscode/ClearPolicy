/**
 * Query Classifier
 *
 * Determines the intent of a user query using pattern matching first
 * (fast, free) and falls back to LLM classification for ambiguous queries.
 *
 * This is the "router" that decides which pipeline handles the request.
 */

import type { ClassifiedQuery, QueryIntent } from "./omni-types";

/* ─── Pattern-based classification (fast, no API call) ─── */

const BILL_PATTERNS = [
  /\b(S\.?B\.?|A\.?B\.?|H\.?R\.?|H\.?B\.?|S\.?\s*J\.?\s*R\.?|H\.?\s*J\.?\s*R\.?)\s*\.?\s*(\d+)/i,
  /\b(senate|house|assembly)\s+bill\s+(\d+)/i,
  /\b(prop|proposition)\s+(\d+)/i,
  /\bexecutive\s+order\s+(\d+)/i,
];

const ZIP_PATTERN = /\b(\d{5})(?:-\d{4})?\b/;

const DEBATE_KEYWORDS = [
  "debate", "argue", "arguments for", "arguments against",
  "pros and cons", "perspectives on", "both sides",
  "compare views", "left vs right", "partisan",
  "should we", "is it good", "is it bad",
];

const LOCAL_KEYWORDS = [
  "ballot", "my district", "my area", "local",
  "near me", "my city", "my county", "my state",
  "school board", "city council", "municipal",
  "zoning", "neighborhood",
];

const NEWS_KEYWORDS = [
  "latest", "recent", "update", "breaking",
  "just passed", "just signed", "new law",
  "markup", "committee action", "vote today",
];

const LEGAL_EXPLAINER_KEYWORDS = [
  "explain", "what is", "what are", "how does",
  "define", "meaning of", "in plain english",
  "f-1 visa", "h-1b", "cfr", "usc", "regulation",
  "rights", "legal", "law says",
];

function extractBillId(query: string): string | undefined {
  for (const pattern of BILL_PATTERNS) {
    const match = query.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  return undefined;
}

function extractZip(query: string): string | undefined {
  const match = query.match(ZIP_PATTERN);
  if (match) {
    const zip = match[1];
    // Basic validation: US ZIP codes are 00501-99950
    const num = parseInt(zip, 10);
    if (num >= 501 && num <= 99950) return zip;
  }
  return undefined;
}

const STATE_MAP: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR",
  california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS",
  kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
  "new york": "NY", "north carolina": "NC", "north dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA",
  "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY",
};

function extractState(query: string): string | undefined {
  const lower = query.toLowerCase();
  for (const [name, abbr] of Object.entries(STATE_MAP)) {
    if (lower.includes(name)) return abbr;
  }
  // Also check for state abbreviations like "CA", "NY" (2-letter uppercase)
  const abbrMatch = query.match(/\b([A-Z]{2})\b/);
  if (abbrMatch && Object.values(STATE_MAP).includes(abbrMatch[1])) {
    return abbrMatch[1];
  }
  return undefined;
}

function extractYear(query: string): string | undefined {
  const match = query.match(/\b(19\d{2}|20\d{2})\b/);
  return match ? match[1] : undefined;
}

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

/**
 * Fast, deterministic query classification using patterns and keywords.
 * No API call needed for most queries.
 */
export function classifyQuery(query: string, hasDocument?: boolean): ClassifiedQuery {
  const cleaned = query.trim();
  const lower = cleaned.toLowerCase();

  // Document upload takes priority
  if (hasDocument) {
    return {
      intent: "document_analysis",
      originalQuery: query,
      cleanedQuery: cleaned,
      topics: [],
      needsDebate: false,
      needsLocalContext: false,
      confidence: 0.95,
    };
  }

  // Extract structured data
  const billId = extractBillId(cleaned);
  const zip = extractZip(cleaned);
  const state = extractState(cleaned);
  const year = extractYear(cleaned);

  // Score each intent
  const scores: Record<QueryIntent, number> = {
    bill_lookup: 0,
    legal_explainer: 0,
    local_ballot: 0,
    debate_prep: 0,
    general_policy: 0,
    document_analysis: 0,
    news_update: 0,
  };

  // Bill lookup: strong if bill ID found
  if (billId) scores.bill_lookup += 0.8;
  if (/\b(bill|act|law|resolution|amendment|legislation)\b/i.test(lower)) {
    scores.bill_lookup += 0.2;
  }

  // Local ballot: strong if ZIP + local keywords
  if (containsAny(lower, LOCAL_KEYWORDS)) scores.local_ballot += 0.5;
  if (zip) scores.local_ballot += 0.3;
  if (/\bballot\b/i.test(lower)) scores.local_ballot += 0.3;

  // Debate: strong if debate keywords
  if (containsAny(lower, DEBATE_KEYWORDS)) scores.debate_prep += 0.7;
  if (/\bvs\.?\b/i.test(lower)) scores.debate_prep += 0.2;

  // News: strong if news keywords
  if (containsAny(lower, NEWS_KEYWORDS)) scores.news_update += 0.6;
  if (/\b(today|this week|2025|2026)\b/i.test(lower)) scores.news_update += 0.2;

  // Legal explainer: explainer keywords
  if (containsAny(lower, LEGAL_EXPLAINER_KEYWORDS)) scores.legal_explainer += 0.5;
  if (/\b(visa|immigration|tax|regulation|cfr|usc)\b/i.test(lower)) {
    scores.legal_explainer += 0.3;
  }

  // General policy: default fallback, slight boost for policy terms
  scores.general_policy = 0.2; // base score
  if (/\b(policy|government|public|healthcare|education|housing|climate|economy)\b/i.test(lower)) {
    scores.general_policy += 0.3;
  }

  // Find the winning intent
  let bestIntent: QueryIntent = "general_policy";
  let bestScore = 0;
  for (const [intent, score] of Object.entries(scores) as [QueryIntent, number][]) {
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  // Extract simple topics from the query
  const topicPatterns = [
    /\b(healthcare|health care|health)\b/i,
    /\b(immigration|visa|border)\b/i,
    /\b(housing|rent|zoning)\b/i,
    /\b(education|school|university)\b/i,
    /\b(climate|environment|energy|emissions)\b/i,
    /\b(economy|jobs|employment|wages)\b/i,
    /\b(crime|police|justice|prison)\b/i,
    /\b(tax|taxes|taxation)\b/i,
    /\b(gun|firearm|second amendment)\b/i,
    /\b(tech|ai|crypto|data privacy)\b/i,
    /\b(abortion|reproductive)\b/i,
    /\b(voting|election|ballot)\b/i,
    /\b(military|defense|foreign policy)\b/i,
  ];

  const topics: string[] = [];
  for (const p of topicPatterns) {
    const m = lower.match(p);
    if (m) topics.push(m[1].toLowerCase());
  }

  return {
    intent: bestIntent,
    originalQuery: query,
    cleanedQuery: cleaned,
    billId,
    topics,
    zip,
    state,
    year,
    needsDebate: bestIntent === "debate_prep" || containsAny(lower, DEBATE_KEYWORDS),
    needsLocalContext: !!zip || containsAny(lower, LOCAL_KEYWORDS),
    confidence: Math.min(bestScore, 1),
  };
}
