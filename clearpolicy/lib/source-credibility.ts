/**
 * Source Credibility & Bias Transparency Layer
 *
 * Classifies sources by type and known political leaning.
 * Uses a curated lookup table for common policy sources.
 */

export type SourceCategory = "gov" | "data" | "legal" | "news" | "think_tank" | "expert" | "web";
export type BiasRating = "left" | "center-left" | "center" | "center-right" | "right" | "libertarian" | "nonpartisan" | null;

export interface SourceCredibility {
  category: SourceCategory;
  categoryLabel: string;
  bias: BiasRating;
  biasLabel: string | null;
}

const CATEGORY_LABELS: Record<SourceCategory, string> = {
  gov: "Government",
  data: "Research",
  legal: "Legal",
  news: "News",
  think_tank: "Think Tank",
  expert: "Expert",
  web: "Web",
};

const BIAS_LABELS: Record<string, string> = {
  left: "Left-leaning",
  "center-left": "Center-Left",
  center: "Center",
  "center-right": "Center-Right",
  right: "Right-leaning",
  libertarian: "Libertarian",
  nonpartisan: "Non-partisan",
};

interface SourceEntry {
  category: SourceCategory;
  bias: BiasRating;
}

const SOURCE_DB: Record<string, SourceEntry> = {
  // Government (non-partisan)
  "cbo.gov": { category: "gov", bias: "nonpartisan" },
  "congress.gov": { category: "gov", bias: "nonpartisan" },
  "gao.gov": { category: "gov", bias: "nonpartisan" },
  "census.gov": { category: "gov", bias: "nonpartisan" },
  "bls.gov": { category: "gov", bias: "nonpartisan" },
  "cdc.gov": { category: "gov", bias: "nonpartisan" },
  "fbi.gov": { category: "gov", bias: "nonpartisan" },
  "irs.gov": { category: "gov", bias: "nonpartisan" },
  "whitehouse.gov": { category: "gov", bias: null },
  "uscourts.gov": { category: "legal", bias: "nonpartisan" },
  "supremecourt.gov": { category: "legal", bias: "nonpartisan" },
  "state.gov": { category: "gov", bias: null },
  "treasury.gov": { category: "gov", bias: "nonpartisan" },
  "federalregister.gov": { category: "gov", bias: "nonpartisan" },
  "govinfo.gov": { category: "gov", bias: "nonpartisan" },
  "usa.gov": { category: "gov", bias: "nonpartisan" },
  "epa.gov": { category: "gov", bias: "nonpartisan" },
  "ed.gov": { category: "gov", bias: "nonpartisan" },
  "hhs.gov": { category: "gov", bias: "nonpartisan" },
  "dol.gov": { category: "gov", bias: "nonpartisan" },
  "energy.gov": { category: "gov", bias: "nonpartisan" },
  "defense.gov": { category: "gov", bias: "nonpartisan" },
  "justice.gov": { category: "gov", bias: "nonpartisan" },
  "openstates.org": { category: "gov", bias: "nonpartisan" },

  // Research organizations
  "pewresearch.org": { category: "data", bias: "center" },
  "gallup.com": { category: "data", bias: "center" },
  "rand.org": { category: "data", bias: "center" },
  "urban.org": { category: "data", bias: "center-left" },
  "nber.org": { category: "data", bias: "center" },

  // Think tanks
  "brookings.edu": { category: "think_tank", bias: "center-left" },
  "heritage.org": { category: "think_tank", bias: "right" },
  "cato.org": { category: "think_tank", bias: "libertarian" },
  "americanprogress.org": { category: "think_tank", bias: "left" },
  "aei.org": { category: "think_tank", bias: "center-right" },
  "cfr.org": { category: "think_tank", bias: "center" },
  "hoover.org": { category: "think_tank", bias: "center-right" },
  "brennancenter.org": { category: "think_tank", bias: "center-left" },
  "manhattan-institute.org": { category: "think_tank", bias: "center-right" },
  "epi.org": { category: "think_tank", bias: "center-left" },
  "taxfoundation.org": { category: "think_tank", bias: "center-right" },
  "cbpp.org": { category: "think_tank", bias: "center-left" },
  "mercatus.org": { category: "think_tank", bias: "libertarian" },
  "newamerica.org": { category: "think_tank", bias: "center-left" },
  "thirdway.org": { category: "think_tank", bias: "center" },

  // News - wire services
  "apnews.com": { category: "news", bias: "center" },
  "reuters.com": { category: "news", bias: "center" },

  // News - established outlets
  "nytimes.com": { category: "news", bias: "center-left" },
  "washingtonpost.com": { category: "news", bias: "center-left" },
  "wsj.com": { category: "news", bias: "center-right" },
  "politico.com": { category: "news", bias: "center" },
  "thehill.com": { category: "news", bias: "center" },
  "bbc.com": { category: "news", bias: "center" },
  "bbc.co.uk": { category: "news", bias: "center" },
  "npr.org": { category: "news", bias: "center-left" },
  "foxnews.com": { category: "news", bias: "right" },
  "cnn.com": { category: "news", bias: "center-left" },
  "msnbc.com": { category: "news", bias: "left" },
  "axios.com": { category: "news", bias: "center" },
  "usatoday.com": { category: "news", bias: "center" },
  "nbcnews.com": { category: "news", bias: "center-left" },
  "cbsnews.com": { category: "news", bias: "center" },
  "abcnews.go.com": { category: "news", bias: "center" },
  "pbs.org": { category: "news", bias: "center" },
  "c-span.org": { category: "news", bias: "center" },
  "propublica.org": { category: "news", bias: "center-left" },
  "fivethirtyeight.com": { category: "data", bias: "center" },
  "ballotpedia.org": { category: "data", bias: "center" },

  // Legal
  "law.cornell.edu": { category: "legal", bias: "nonpartisan" },
  "scotusblog.com": { category: "legal", bias: "center" },
  "justia.com": { category: "legal", bias: "nonpartisan" },

  // International
  "un.org": { category: "gov", bias: "nonpartisan" },
  "undocs.org": { category: "gov", bias: "nonpartisan" },
  "worldbank.org": { category: "data", bias: "nonpartisan" },
  "data.worldbank.org": { category: "data", bias: "nonpartisan" },
  "eur-lex.europa.eu": { category: "legal", bias: "nonpartisan" },
  "legislation.gov.uk": { category: "legal", bias: "nonpartisan" },
  "who.int": { category: "gov", bias: "nonpartisan" },
  "imf.org": { category: "data", bias: "nonpartisan" },
};

export function classifySource(url: string, title?: string): SourceCredibility {
  let domain = "";
  try {
    domain = new URL(url).hostname.replace("www.", "");
  } catch {
    return { category: "web", categoryLabel: "Web", bias: null, biasLabel: null };
  }

  // Direct match
  if (SOURCE_DB[domain]) {
    const entry = SOURCE_DB[domain];
    return {
      category: entry.category,
      categoryLabel: CATEGORY_LABELS[entry.category],
      bias: entry.bias,
      biasLabel: entry.bias ? BIAS_LABELS[entry.bias] || null : null,
    };
  }

  // Subdomain match (e.g. crsreports.congress.gov)
  for (const [key, entry] of Object.entries(SOURCE_DB)) {
    if (domain.endsWith(`.${key}`) || domain === key) {
      return {
        category: entry.category,
        categoryLabel: CATEGORY_LABELS[entry.category],
        bias: entry.bias,
        biasLabel: entry.bias ? BIAS_LABELS[entry.bias] || null : null,
      };
    }
  }

  // Heuristic: .gov domains are government
  if (domain.endsWith(".gov")) {
    return { category: "gov", categoryLabel: "Government", bias: "nonpartisan", biasLabel: "Non-partisan" };
  }

  // Heuristic: .edu domains are research
  if (domain.endsWith(".edu")) {
    return { category: "data", categoryLabel: "Research", bias: "center", biasLabel: "Center" };
  }

  return { category: "web", categoryLabel: "Web", bias: null, biasLabel: null };
}

export function getSourcePriorityPrompt(): string {
  return `SOURCE PRIORITY (cite in this order of preference):
1. Government sources (CBO, Census, GAO, CRS, state agencies) — highest credibility
2. Non-partisan research (Pew, Gallup, NBER, academic institutions)
3. Legal sources (court rulings, legislative text)
4. Wire services (AP, Reuters) and factual reporting
5. Think tanks — ALWAYS name them explicitly: "The Heritage Foundation argues..." or "According to Brookings..." — NEVER cite a think tank's claim as a neutral fact
6. Opinion/editorial — use sparingly, only to illustrate that a viewpoint exists`;
}
