/**
 * International Data Pipeline
 *
 * Fetches structured data from international government/institution APIs
 * BEFORE calling the LLM, mirroring the US "Gov Data First" pattern.
 *
 * Sources:
 *  - World Bank API (economic/development indicators, no auth required)
 *  - EU Legislation API (EU laws, free JSON)
 *  - UK Legislation API (UK statutes, free)
 *  - UN document linking (direct UNDOCS links for resolutions)
 */

import type { AnswerSource } from "./policy-types";

/* ─── Types ─── */

export interface IntlSource {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  type: "international";
  org: string;
}

export interface IntlContext {
  sources: IntlSource[];
  region: "un" | "eu" | "uk" | "global" | "mixed";
}

/* ─── Detection ─── */

const UN_KEYWORDS = [
  "united nations", "un resolution", "un general assembly", "un security council",
  "unsc", "unga", "sdg", "sustainable development", "paris agreement",
  "kyoto protocol", "un treaty", "unhcr", "unicef", "who ",
  "world health organization", "geneva convention", "international court",
  "international law", "multilateral", "un charter", "peacekeeping",
  "human rights council", "unfccc", "cop27", "cop28", "cop29", "cop30",
  "un women", "undp", "unep", "wto", "world trade organization",
  "international criminal court", "icc", "icj", "refugee",
  "convention on the rights", "universal declaration",
];

const EU_KEYWORDS = [
  "european union", "eu regulation", "eu directive", "eu policy",
  "european commission", "european parliament", "gdpr", "eu law",
  "brussels", "eu trade", "eurozone", "schengen", "eu migration",
  "eu climate", "european council", "eu digital", "eu ai act",
  "eu taxonomy", "green deal", "eu referendum",
];

const UK_KEYWORDS = [
  "united kingdom", "uk law", "uk policy", "british parliament",
  "house of commons", "house of lords", "westminster", "uk act",
  "nhs policy", "uk immigration", "british law", "uk government",
  "uk regulation", "england law", "scotland law", "wales law",
  "uk trade", "brexit",
];

const INTL_GENERIC = [
  "international policy", "global policy", "foreign policy",
  "treaty", "bilateral", "geopolitical", "sanctions",
  "trade agreement", "diplomacy", "international relations",
  "world bank", "imf", "nato", "g7", "g20",
];

export function detectInternationalQuery(query: string): {
  isInternational: boolean;
  regions: ("un" | "eu" | "uk" | "global")[];
} {
  const lower = query.toLowerCase();
  const regions: ("un" | "eu" | "uk" | "global")[] = [];

  if (UN_KEYWORDS.some(kw => lower.includes(kw))) regions.push("un");
  if (EU_KEYWORDS.some(kw => lower.includes(kw))) regions.push("eu");
  if (UK_KEYWORDS.some(kw => lower.includes(kw))) regions.push("uk");
  if (INTL_GENERIC.some(kw => lower.includes(kw))) regions.push("global");

  return { isInternational: regions.length > 0, regions };
}

/* ─── UN Resolution Linking ─── */

const UN_RESOLUTION_PATTERN = /\b(?:A\/RES\/|S\/RES\/)(\d+)(?:\/(\d+))?\b/i;

function extractUNDocSymbol(query: string): string | null {
  const match = query.match(UN_RESOLUTION_PATTERN);
  if (match) return match[0];

  const shortMatch = query.match(/\bresolution\s+(\d+)\b/i);
  if (shortMatch) return null;
  return null;
}

function buildUNDocUrl(symbol: string): string {
  return `https://undocs.org/${encodeURIComponent(symbol)}`;
}

/* ─── World Bank API ─── */

interface WBIndicatorData {
  indicator: string;
  indicatorName: string;
  country: string;
  value: number | null;
  date: string;
}

const TOPIC_TO_INDICATORS: Record<string, { code: string; name: string }[]> = {
  healthcare: [
    { code: "SH.XPD.CHEX.GD.ZS", name: "Health expenditure (% of GDP)" },
    { code: "SP.DYN.LE00.IN", name: "Life expectancy at birth" },
  ],
  education: [
    { code: "SE.XPD.TOTL.GD.ZS", name: "Education expenditure (% of GDP)" },
    { code: "SE.ADT.LITR.ZS", name: "Adult literacy rate" },
  ],
  climate: [
    { code: "EN.ATM.CO2E.PC", name: "CO2 emissions (metric tons per capita)" },
    { code: "EG.FEC.RNEW.ZS", name: "Renewable energy (% of total)" },
  ],
  economy: [
    { code: "NY.GDP.MKTP.CD", name: "GDP (current US$)" },
    { code: "FP.CPI.TOTL.ZG", name: "Inflation, consumer prices (annual %)" },
  ],
  poverty: [
    { code: "SI.POV.DDAY", name: "Poverty headcount ratio ($2.15/day)" },
    { code: "SI.POV.GINI", name: "GINI index" },
  ],
  trade: [
    { code: "NE.TRD.GNFS.ZS", name: "Trade (% of GDP)" },
    { code: "TM.TAX.MRCH.WM.AR.ZS", name: "Tariff rate, applied (weighted mean)" },
  ],
  refugee: [
    { code: "SM.POP.REFG", name: "Refugee population by country of asylum" },
    { code: "SM.POP.REFG.OR", name: "Refugee population by country of origin" },
  ],
};

function matchTopics(query: string): string[] {
  const lower = query.toLowerCase();
  const matched: string[] = [];
  const checks: [string, RegExp][] = [
    ["healthcare", /\b(health|healthcare|medical|disease|pandemic|who)\b/],
    ["education", /\b(education|school|literacy|university|student)\b/],
    ["climate", /\b(climate|emission|carbon|renewable|environment|green|cop\d{2})\b/],
    ["economy", /\b(economy|gdp|inflation|economic|growth|recession)\b/],
    ["poverty", /\b(poverty|inequality|gini|development|aid)\b/],
    ["trade", /\b(trade|tariff|import|export|wto|agreement)\b/],
    ["refugee", /\b(refugee|asylum|displaced|migration|unhcr)\b/],
  ];
  for (const [topic, re] of checks) {
    if (re.test(lower)) matched.push(topic);
  }
  return matched.length > 0 ? matched : ["economy"];
}

async function fetchWorldBankData(
  topics: string[],
  countries: string[] = ["WLD"],
): Promise<WBIndicatorData[]> {
  const results: WBIndicatorData[] = [];
  const indicators = topics.flatMap(t => TOPIC_TO_INDICATORS[t] ?? []).slice(0, 4);

  for (const ind of indicators) {
    for (const country of countries) {
      try {
        const url = `https://api.worldbank.org/v2/country/${country}/indicator/${ind.code}?format=json&per_page=3&mrv=3`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) continue;
        const json = await res.json();
        const data = json?.[1];
        if (!Array.isArray(data)) continue;
        for (const d of data) {
          if (d.value != null) {
            results.push({
              indicator: ind.code,
              indicatorName: ind.name,
              country: d.country?.value || country,
              value: d.value,
              date: d.date,
            });
            break;
          }
        }
      } catch {
        // Non-fatal
      }
    }
  }
  return results;
}

/* ─── EU Legislation API ─── */

interface EULegislation {
  title: string;
  celexNumber: string;
  type: string;
  date: string;
  url: string;
}

async function fetchEULegislation(query: string): Promise<EULegislation[]> {
  try {
    const searchTerms = query
      .toLowerCase()
      .replace(/\b(eu|european union|regulation|directive|policy)\b/gi, "")
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 3)
      .join("+");

    if (!searchTerms) return [];

    const url = `http://api.epdb.eu/eurlex/document/?search=${encodeURIComponent(searchTerms)}&format=json&per_page=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const json = await res.json();
    const docs = json?.results ?? json?.objects ?? [];
    if (!Array.isArray(docs)) return [];

    return docs.slice(0, 3).map((d: any) => ({
      title: d.title || d.name || "EU Document",
      celexNumber: d.celex_number || d.id || "",
      type: d.type || "Regulation",
      date: d.date || d.created || "",
      url: d.celex_number
        ? `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${d.celex_number}`
        : d.url || "https://eur-lex.europa.eu/",
    }));
  } catch {
    return [];
  }
}

/* ─── UK Legislation API ─── */

interface UKLegislation {
  title: string;
  year: string;
  type: string;
  url: string;
}

async function fetchUKLegislation(query: string): Promise<UKLegislation[]> {
  try {
    const searchTerms = query
      .toLowerCase()
      .replace(/\b(uk|united kingdom|british|law|act|policy|parliament)\b/gi, "")
      .trim();

    if (!searchTerms) return [];

    const url = `https://www.legislation.gov.uk/search?text=${encodeURIComponent(searchTerms)}&page=1`;
    const res = await fetch(url, {
      headers: { Accept: "application/atom+xml" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];

    const text = await res.text();
    const entries: UKLegislation[] = [];
    const entryMatches = text.match(/<entry>[\s\S]*?<\/entry>/g);
    if (!entryMatches) return [];

    for (const entry of entryMatches.slice(0, 3)) {
      const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
      const linkMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
      const updatedMatch = entry.match(/<updated>([\s\S]*?)<\/updated>/);
      if (titleMatch && linkMatch) {
        entries.push({
          title: titleMatch[1].replace(/<[^>]+>/g, "").trim(),
          year: updatedMatch ? updatedMatch[1].slice(0, 4) : "",
          type: "UK Act",
          url: linkMatch[1].trim(),
        });
      }
    }
    return entries;
  } catch {
    return [];
  }
}

/* ─── Main Orchestrator ─── */

export async function fetchIntlData(
  query: string,
  regions: ("un" | "eu" | "uk" | "global")[],
): Promise<IntlContext> {
  const sources: IntlSource[] = [];
  const topics = matchTopics(query);

  const promises: Promise<void>[] = [];

  // World Bank data for any international query
  promises.push(
    fetchWorldBankData(topics).then(wbData => {
      if (wbData.length > 0) {
        const snippet = wbData
          .map(d => `${d.indicatorName}: ${typeof d.value === "number" ? d.value.toLocaleString() : d.value} (${d.country}, ${d.date})`)
          .join("; ");
        sources.push({
          title: `World Bank: ${topics.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")} Indicators`,
          url: `https://data.worldbank.org/indicator/${wbData[0].indicator}`,
          domain: "data.worldbank.org",
          snippet,
          type: "international",
          org: "World Bank",
        });
      }
    }),
  );

  // UN resolution linking
  const unDocSymbol = extractUNDocSymbol(query);
  if (unDocSymbol) {
    sources.push({
      title: `UN Document: ${unDocSymbol}`,
      url: buildUNDocUrl(unDocSymbol),
      domain: "undocs.org",
      snippet: `Official UN document ${unDocSymbol}. Access the full text at the UN Official Document System.`,
      type: "international",
      org: "United Nations",
    });
  }

  // EU legislation
  if (regions.includes("eu") || regions.includes("global")) {
    promises.push(
      fetchEULegislation(query).then(euDocs => {
        for (const doc of euDocs) {
          sources.push({
            title: doc.title,
            url: doc.url,
            domain: "eur-lex.europa.eu",
            snippet: `${doc.type}${doc.celexNumber ? ` (${doc.celexNumber})` : ""}${doc.date ? `, dated ${doc.date}` : ""}`,
            type: "international",
            org: "European Union",
          });
        }
      }),
    );
  }

  // UK legislation
  if (regions.includes("uk") || regions.includes("global")) {
    promises.push(
      fetchUKLegislation(query).then(ukDocs => {
        for (const doc of ukDocs) {
          sources.push({
            title: doc.title,
            url: doc.url,
            domain: "legislation.gov.uk",
            snippet: `${doc.type}${doc.year ? ` (${doc.year})` : ""}`,
            type: "international",
            org: "UK Parliament",
          });
        }
      }),
    );
  }

  await Promise.all(promises);

  const region: IntlContext["region"] =
    regions.length > 1 ? "mixed" :
    regions[0] || "global";

  return { sources, region };
}

/* ─── Format for AI prompt ─── */

export function formatIntlContext(
  ctx: IntlContext,
  startIndex: number = 1,
): { text: string; numberedCount: number } {
  if (ctx.sources.length === 0) return { text: "", numberedCount: 0 };

  const numbered = ctx.sources.slice(0, 6);
  const lines: string[] = [
    `VERIFIED INTERNATIONAL SOURCES (cite as [${startIndex}]${numbered.length > 1 ? `..[${startIndex + numbered.length - 1}]` : ""}):`,
  ];

  numbered.forEach((src, i) => {
    const num = startIndex + i;
    lines.push(`[${num}] "${src.title}" (${src.org})\nURL: ${src.url}\n${src.snippet}`);
  });

  return { text: lines.join("\n\n"), numberedCount: numbered.length };
}

/* ─── Convert to AnswerSource for UI ─── */

export function intlSourcesToAnswerSources(sources: IntlSource[]): AnswerSource[] {
  return sources.slice(0, 6).map((s, i) => ({
    id: i + 1,
    title: s.title,
    url: s.url,
    domain: s.domain,
    type: "Web" as const,
    verified: true,
    excerpt: s.snippet,
  }));
}
