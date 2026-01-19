import { Citation } from "./citations";

export type EvidenceMatch = {
  quote: string;
  url?: string;
  sourceName: string;
  score: number;
  overlap: number;
  hasNumberMatch: boolean;
};

export type EvidenceClaim = {
  claim: string;
  supported: boolean;
  match?: EvidenceMatch;
  score: number;
  overlap: number;
};

export type AnnotatedClaim = {
  claim: string;
  status: "supported" | "unverified";
  bestCitation?: Citation;
  score: number;
  overlap?: number;
};

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "by",
  "from",
  "that",
  "this",
  "these",
  "those",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "will",
  "shall",
  "may",
  "can",
  "could",
  "should",
  "would",
  "it",
  "its",
  "as",
  "at",
]);

const numberRegex = /\b\d+(?:\.\d+)?\b/g;

function normalize(text: string) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function normalizeKey(text: string) {
  return normalize(text).toLowerCase();
}

function tokenize(text: string) {
  const cleaned = normalize(text).toLowerCase().replace(/[^\w\s]/g, " ");
  return cleaned
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w));
}

export function splitIntoClaims(text: string): string[] {
  const normalized = normalize(text);
  if (!normalized) return [];

  const hasBullets = /\n/.test(normalized) || /\s-\s/.test(normalized) || /\s•\s/.test(normalized);
  const rawParts = hasBullets
    ? normalized
        .split(/\n+|\s-\s|\s•\s/)
        .map((p) => p.trim())
        .filter(Boolean)
    : normalized
        .split(/[.;!?]+/)
        .map((p) => p.trim())
        .filter(Boolean);

  if (rawParts.length <= 1) return [normalized];

  const isMeaningful = (part: string) => {
    if (!/[a-z0-9]/i.test(part)) return false;
    const tokens = tokenize(part);
    const hasNumber = numberRegex.test(part);
    numberRegex.lastIndex = 0;
    return tokens.length > 0 || hasNumber;
  };

  const shouldMerge = (words: string[]) => {
    if (words.length < 6) return true;
    const first = (words[0] || "").toLowerCase();
    if (["and", "or", "but", "also", "with"].includes(first)) return true;
    return false;
  };

  const merged: string[] = [];
  let buffer = "";
  for (const part of rawParts) {
    if (!isMeaningful(part)) continue;
    const words = part.split(/\s+/).filter(Boolean);
    if (shouldMerge(words)) {
      if (merged.length === 0) {
        buffer = buffer ? `${buffer} ${part}` : part;
      } else {
        merged[merged.length - 1] = `${merged[merged.length - 1]} ${part}`.trim();
      }
      continue;
    }
    const candidate = buffer ? `${buffer} ${part}`.trim() : part;
    buffer = "";
    merged.push(candidate);
  }
  if (buffer) {
    if (merged.length > 0) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${buffer}`.trim();
    } else {
      merged.push(buffer);
    }
  }

  const cleaned = merged.filter((part) => {
    const words = part.split(/\s+/).filter(Boolean);
    const hasNumber = numberRegex.test(part);
    numberRegex.lastIndex = 0;
    if (hasNumber) return true;
    return words.length >= 3;
  });

  const claims = cleaned.length ? cleaned.slice(0, 6) : [normalized];
  return claims;
}

export function scoreClaimToQuote(claim: string, quote: string): number {
  return matchClaimToQuote(claim, quote).score;
}

export function matchClaimToQuote(claim: string, quote: string): EvidenceMatch {
  const claimTokens = tokenize(claim);
  const quoteTokens = tokenize(quote);
  const claimSet = new Set(claimTokens);
  const quoteSet = new Set(quoteTokens);

  const intersection = [...claimSet].filter((w) => quoteSet.has(w));
  const union = new Set([...claimSet, ...quoteSet]);

  const jaccard = union.size === 0 ? 0 : intersection.length / union.size;
  const overlap = claimSet.size === 0 ? 0 : intersection.length / claimSet.size;

  const claimNums = claim.match(numberRegex) || [];
  const quoteNums = quote.match(numberRegex) || [];
  const hasNumberMatch = claimNums.some((n) => quoteNums.includes(n));

  let score = 0.6 * overlap + 0.4 * jaccard;
  if (hasNumberMatch) score = Math.min(1, score + 0.1);

  return {
    quote: normalize(quote),
    url: undefined,
    sourceName: "",
    score: Math.min(1, Math.max(0, score)),
    overlap,
    hasNumberMatch,
  };
}

export function dedupeCitations(citations: Citation[]) {
  const seen = new Set<string>();
  return (citations || []).filter((c) => {
    const key = normalizeKey(c?.quote || c?.sourceName || "");
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function findBestEvidenceForClaim(
  claim: string,
  citations: Citation[]
): { best?: Citation; score: number; overlap: number; hasNumberMatch: boolean } {
  let best: Citation | undefined;
  let bestScore = 0;
  let bestOverlap = 0;
  let bestNumberMatch = false;

  for (const c of dedupeCitations(citations || [])) {
    if (!c?.quote) continue;
    const match = matchClaimToQuote(claim, c.quote);
    if (match.score > bestScore) {
      bestScore = match.score;
      bestOverlap = match.overlap;
      bestNumberMatch = match.hasNumberMatch;
      best = c;
    }
  }

  return { best, score: bestScore, overlap: bestOverlap, hasNumberMatch: bestNumberMatch };
}

export function annotateClaimsWithEvidence(
  claims: string[],
  citations: Citation[],
  threshold: number
): AnnotatedClaim[] {
  return (claims || []).map((claim) => {
    const { best, score, overlap } = findBestEvidenceForClaim(claim, citations || []);
    const tokens = tokenize(claim);
    const minOverlap = tokens.length <= 4 ? 0.6 : 0.35;
    const supported = !!best && score >= threshold && overlap >= minOverlap;
    return {
      claim,
      status: supported ? "supported" : "unverified",
      bestCitation: supported ? best : undefined,
      score,
      overlap,
    };
  });
}

