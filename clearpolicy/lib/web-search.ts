import { tavily } from "@tavily/core";

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
  score: number;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  query: string;
}

const PLACEHOLDER_DOMAINS = new Set([
  "example.com", "example.org", "example.net",
  "placeholder.com", "test.com", "fake.com",
  "source.com", "website.com", "domain.com",
]);

export function isValidSourceUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const host = parsed.hostname.replace("www.", "");
    if (PLACEHOLDER_DOMAINS.has(host)) return false;
    if (!host.includes(".")) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Pre-filter web results to remove invalid/placeholder URLs.
 * Call this BEFORE numbering to avoid index gaps.
 */
export function filterValidResults(results: WebSearchResult[]): WebSearchResult[] {
  return results.filter(r => isValidSourceUrl(r.url));
}

// Simple in-memory cache: key -> { data, timestamp }
const cache = new Map<string, { data: WebSearchResponse; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCacheKey(query: string, isNews: boolean): string {
  return `${isNews ? "news:" : "gen:"}${query.toLowerCase().trim()}`;
}

export async function searchWeb(
  query: string,
  options?: { isNews?: boolean; maxResults?: number }
): Promise<WebSearchResponse> {
  const isNews = options?.isNews ?? false;
  const maxResults = options?.maxResults ?? 6;

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("[web-search] TAVILY_API_KEY not set, skipping web search");
    return { results: [], query };
  }

  const key = getCacheKey(query, isNews);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const client = tavily({ apiKey });

    const response = await client.search(query, {
      searchDepth: "advanced",
      topic: isNews ? "news" : "general",
      maxResults,
      includeAnswer: false,
      ...(isNews ? { days: 7 } : {}),
    });

    const results: WebSearchResult[] = response.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      publishedDate: r.publishedDate || undefined,
      score: r.score,
    }));

    const data: WebSearchResponse = { results, query };
    cache.set(key, { data, ts: Date.now() });

    if (cache.size > 200) {
      const now = Date.now();
      for (const [k, v] of cache) {
        if (now - v.ts > CACHE_TTL_MS) cache.delete(k);
      }
    }

    return data;
  } catch (error) {
    console.error("[web-search] Tavily search failed:", error);
    return { results: [], query };
  }
}

/**
 * Formats web search results into a numbered context block for AI prompts.
 * @param startIndex - first citation number (default 1). Use this when gov sources
 *   occupy [1]..[N] and web results should start at [N+1].
 */
export function formatWebContext(results: WebSearchResult[], startIndex: number = 1): string {
  if (results.length === 0) return "";

  const lines = results.map((r, i) => {
    let domain = "";
    try { domain = new URL(r.url).hostname.replace("www.", ""); } catch {}
    const snippet = r.content.slice(0, 400);
    const date = r.publishedDate ? ` (${r.publishedDate})` : "";
    return `[${startIndex + i}] "${r.title}" (${domain}${date})\nURL: ${r.url}\n${snippet}`;
  });

  return `VERIFIED WEB SOURCES (cite as [${startIndex}], [${startIndex + 1}], etc.):
Each source below has a number. Place the citation [N] immediately after the claim it supports.

${lines.join("\n\n")}`;
}
