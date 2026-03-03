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

const POLICY_DOMAINS = [
  "congress.gov",
  "govinfo.gov",
  "whitehouse.gov",
  "supremecourt.gov",
  "uscourts.gov",
  "federalregister.gov",
  "leginfo.legislature.ca.gov",
  "reuters.com",
  "apnews.com",
  "politico.com",
  "nytimes.com",
  "washingtonpost.com",
  "bbc.com",
  "npr.org",
  "brookings.edu",
  "heritage.org",
  "cato.org",
  "ballotpedia.org",
];

// Simple in-memory cache: key -> { data, timestamp }
const cache = new Map<string, { data: WebSearchResponse; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
      ...(isNews ? {} : { includeDomains: POLICY_DOMAINS }),
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

    // Evict stale entries periodically
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
 * Formats web search results into a context block for injection into AI prompts.
 */
export function formatWebContext(results: WebSearchResult[]): string {
  if (results.length === 0) return "";

  const lines = results.map((r, i) => {
    let domain = "";
    try { domain = new URL(r.url).hostname.replace("www.", ""); } catch {}
    const snippet = r.content.slice(0, 400);
    const date = r.publishedDate ? ` (${r.publishedDate})` : "";
    return `[${i + 1}] "${r.title}" (${domain}${date})\nURL: ${r.url}\n${snippet}`;
  });

  return `Here are real-time web search results with their verified URLs. Use these as your PRIMARY source of facts. When citing sources in your response, use ONLY the URLs listed here. Do NOT invent or hallucinate any URLs.\n\n${lines.join("\n\n")}`;
}
