import { NextRequest, NextResponse } from "next/server";
import { openstates } from "@/lib/clients/openstates";
import { generateSummary } from "@/lib/ai";

async function fetchText(
  url: string,
  userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  timeoutMs = 8000
): Promise<string> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    // Try with comprehensive browser headers to avoid blocking
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": userAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
        "Referer": "https://www.google.com/",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) {
      console.error(`Ballotpedia fetch failed for ${url}: ${res.status} ${res.statusText}`);
      return "";
    }
    const text = await res.text();
    if (!text || text.length < 500) {
      console.error(`Ballotpedia returned empty/short content for ${url} (${text.length} chars)`);
      return "";
    }
    // Check if we got a CAPTCHA or blocking page
    if (text.includes("verify that you're not a robot") ||
      text.includes("captcha") ||
      text.includes("cloudflare") ||
      text.includes("checking your browser")) {
      console.error(`Ballotpedia blocked request for ${url} (CAPTCHA detected)`);
      return "";
    }
    return text;
  } catch (error) {
    console.error(`Ballotpedia fetch error for ${url}:`, error);
    return "";
  }
}

async function fetchTextViaProxy(url: string, timeoutMs = 8000): Promise<string> {
  try {
    const proxyUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(proxyUrl, { cache: "no-store", signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      console.error(`Proxy fetch failed for ${url}: ${res.status} ${res.statusText}`);
      return "";
    }
    const text = await res.text();
    if (!text || text.length < 500) {
      console.error(`Proxy returned empty/short content for ${url} (${text.length} chars)`);
      return "";
    }
    return text;
  } catch (error) {
    console.error(`Proxy fetch error for ${url}:`, error);
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

function extractContent(html: string): { tldr: string; pros: string[]; cons: string[] } {
  let tldr = "";
  let pros: string[] = [];
  let cons: string[] = [];

  if (!html || html.includes("does not exist") || html.includes("not found") || html.length < 500) {
    return { tldr, pros, cons };
  }

  const isPlainText = !/<[^>]+>/.test(html);
  if (isPlainText) {
    const clean = html.replace(/\s+/g, " ").trim();
    const sentences = clean.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 40);
    if (sentences.length) {
      tldr = sentences.slice(0, 2).join(". ").slice(0, 280);
    }
    return { tldr, pros, cons };
  }

  // Try multiple meta tag patterns
  const metaPatterns = [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  ];

  for (const pattern of metaPatterns) {
    const metaMatch = html.match(pattern);
    if (metaMatch && metaMatch[1] && metaMatch[1].length > 30) {
      tldr = strip(metaMatch[1]).slice(0, 280);
      break;
    }
  }

  // Try to find content in mw-content-text div
  const contentMatch = html.match(/<div[^>]*id=["']mw-content-text["'][^>]*>([\s\S]*?)<\/div>/i);
  if (contentMatch) {
    const content = contentMatch[1];

    // Find first substantial paragraph
    if (!tldr) {
      const paraMatch = content.match(/<p[^>]*>(.*?)<\/p>/i);
      if (paraMatch) {
        const paraText = strip(paraMatch[1]);
        if (paraText.length > 50 && !paraText.includes("does not exist")) {
          tldr = paraText.slice(0, 280);
        }
      }
    }

    // Look for "Ballot title" or "Ballot summary" sections with more flexible patterns
    const ballotPatterns = [
      /(?:Ballot\s+title|Ballot\s+summary|Official\s+title)[^<]*:?\s*<p[^>]*>(.*?)<\/p>/i,
      /<h[23][^>]*>Ballot\s+title[^<]*<\/h[23]>[\s\S]*?<p[^>]*>(.*?)<\/p>/i,
      /<div[^>]*class=["'][^"']*ballot[^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    ];

    for (const pattern of ballotPatterns) {
      const match = content.match(pattern);
      if (match && match[1] && !tldr) {
        const text = strip(match[1]);
        if (text.length > 30) {
          tldr = text.slice(0, 280);
          break;
        }
      }
    }

    // Also try to find the first substantial paragraph after the title
    if (!tldr) {
      const paragraphs = content.match(/<p[^>]*>(.*?)<\/p>/g) || [];
      for (const para of paragraphs.slice(0, 5)) {
        const text = strip(para.replace(/<[^>]+>/g, " "));
        if (text.length > 50 && !text.includes("does not exist") && !text.includes("redirect")) {
          tldr = text.slice(0, 280);
          break;
        }
      }
    }

    // Look for support/opposition sections with various patterns
    const supportPatterns = [
      />Support[^<]*<[^>]*>[\s\S]*?<ul[^>]*>(.*?)<\/ul>/i,
      />Arguments?\s+in\s+favor[^<]*<[^>]*>[\s\S]*?<ul[^>]*>(.*?)<\/ul>/i,
      />Yes[^<]*<[^>]*>[\s\S]*?<ul[^>]*>(.*?)<\/ul>/i,
      /<h[23][^>]*>Support[^<]*<\/h[23]>[\s\S]*?<ul[^>]*>(.*?)<\/ul>/i,
    ];

    for (const pattern of supportPatterns) {
      const match = content.match(pattern);
      if (match) {
        const listText = strip(match[1]);
        pros = listText.split(/\s*[•·]\s*|\s*<li[^>]*>|<\/li>\s*/)
          .map(s => strip(s))
          .filter(s => s.length > 10)
          .slice(0, 3);
        if (pros.length > 0) break;
      }
    }

    const opposePatterns = [
      />Opposition[^<]*<[^>]*>[\s\S]*?<ul[^>]*>(.*?)<\/ul>/i,
      />Arguments?\s+against[^<]*<[^>]*>[\s\S]*?<ul[^>]*>(.*?)<\/ul>/i,
      />No[^<]*<[^>]*>[\s\S]*?<ul[^>]*>(.*?)<\/ul>/i,
      /<h[23][^>]*>Opposition[^<]*<\/h[23]>[\s\S]*?<ul[^>]*>(.*?)<\/ul>/i,
    ];

    for (const pattern of opposePatterns) {
      const match = content.match(pattern);
      if (match) {
        const listText = strip(match[1]);
        cons = listText.split(/\s*[•·]\s*|\s*<li[^>]*>|<\/li>\s*/)
          .map(s => strip(s))
          .filter(s => s.length > 10)
          .slice(0, 3);
        if (cons.length > 0) break;
      }
    }
  }

  return { tldr, pros, cons };
}

export async function GET(_req: NextRequest, { params }: { params: { num: string } }) {
  const n = String(params.num || "").replace(/[^0-9]/g, "");
  if (!n) return NextResponse.json({ error: "missing" }, { status: 400 });
  const yearParam = String(_req.nextUrl.searchParams.get("year") || "").replace(/[^0-9]/g, "");
  const requestedYear = yearParam && yearParam.length === 4 ? yearParam : "";
  let yearMismatchInfo: { requestedYear: string; resolvedYear?: string; note: string } | null = null;
  const startAt = Date.now();
  const shouldContinue = () => Date.now() - startAt < 10000;

  // No hardcoded database - we use AI to generate summaries dynamically

  // Then, try to get data from OpenStates
  let tldr = "";
  let pros: string[] = [];
  let cons: string[] = [];
  let ballotpediaUrl: string | null = null;
  let foundInOpenStates = false;
  let levels: any = null;

  // Collect data for AI analysis
  let collectedTitle = `California Proposition ${n}`;
  let collectedContent = "";
  let collectedSubjects: string[] = [];

  try {
    // Search OpenStates for the proposition - try multiple search strategies
    const searchQueries = [
      `California Proposition ${n}`,
      `Prop ${n}`,
      `Proposition ${n}`,
    ];

    let propMatch = null;
    for (const searchQuery of searchQueries) {
      const osResults = await openstates.searchBills(searchQuery, "ca").catch(() => ({ results: [] }));
      const results = Array.isArray(osResults?.results) ? osResults.results : [];

      // Find the best match (should have "proposition" or "prop" in title/identifier)
      propMatch = results.find((r: any) => {
        const title = (r.title || r.identifier || "").toLowerCase();
        return /proposition|prop/.test(title) && new RegExp(`\\b${n}\\b`).test(title);
      });

      if (propMatch) break;
    }

    if (propMatch) {
      foundInOpenStates = true;
      const title = propMatch.title || propMatch.identifier || "";
      const abstract = propMatch.abstract || "";
      const latestAction = propMatch.latest_action?.description || propMatch.latest_action_description || "";
      const impactClause = propMatch.extras?.impact_clause || "";
      const summary = propMatch.summary || "";

      collectedTitle = title || collectedTitle;
      collectedContent = [abstract, latestAction, summary, impactClause, title].filter(Boolean).join(". ");

      // Extract subjects/classification for context
      const subjects = propMatch.subjects || propMatch.classification || [];
      collectedSubjects = Array.isArray(subjects) ? subjects : [];

      // Use abstract or latest action for TL;DR
      if (abstract && abstract.length > 30) {
        tldr = abstract.slice(0, 280);
      } else if (impactClause && impactClause.length > 30) {
        tldr = impactClause.replace(/^An act to /i, "").replace(/, relating to .*$/i, "").trim().slice(0, 280);
      } else if (summary && summary.length > 30) {
        tldr = summary.slice(0, 280);
      } else if (latestAction && latestAction.length > 30) {
        tldr = latestAction.slice(0, 280);
      } else if (title && title.length > 30) {
        tldr = title;
      }

      if (subjects.length > 0 && tldr) {
        tldr = `${tldr} Related to: ${subjects.slice(0, 3).join(", ")}.`.slice(0, 280);
      }
    }
  } catch (error) {
    console.error("OpenStates search error:", error);
  }

  // Try Ballotpedia with common years if we don't have good content
  // Note: Prop 22 (2020) was about app-based drivers, Prop 22 (2010) was about redistricting
  const commonYears = ["2024", "2022", "2020", "2018", "2016", "2014", "2012", "2010", "2008", "2006"];
  const yearCandidates = requestedYear ? [requestedYear] : commonYears;
  let bpHtml = "";

  if (!tldr || tldr.length < 50) {
    for (const year of yearCandidates) {
      if (!shouldContinue()) break;
      const bpUrl = `https://ballotpedia.org/California_Proposition_${n}_(${year})`;
      bpHtml = await fetchText(bpUrl);

      // Check if we got actual content (not just error page)
      if (bpHtml && bpHtml.length > 2000 && !bpHtml.includes("does not exist") && !bpHtml.includes("not found") && !bpHtml.includes("404")) {
        ballotpediaUrl = bpUrl;
        const extracted = extractContent(bpHtml);
        if (extracted.tldr && extracted.tldr.length > 50) {
          tldr = extracted.tldr;
          pros = extracted.pros;
          cons = extracted.cons;
          console.log(`Found Prop ${n} content from Ballotpedia (${year})`);
          break;
        }
      } else if (!bpHtml || bpHtml.length < 500) {
        const proxyText = await fetchTextViaProxy(bpUrl);
        if (proxyText) {
          ballotpediaUrl = bpUrl;
          const extracted = extractContent(proxyText);
          if (extracted.tldr && extracted.tldr.length > 50) {
            tldr = extracted.tldr;
            pros = extracted.pros;
            cons = extracted.cons;
            console.log(`Found Prop ${n} content via proxy (${year})`);
            break;
          }
        }
      }
    }

    // Also try without year as fallback
    if (!tldr || tldr.length < 50) {
      const bpUrlNoYear = `https://ballotpedia.org/California_Proposition_${n}`;
      const bpHtmlNoYear = await fetchText(bpUrlNoYear);
      if (bpHtmlNoYear && bpHtmlNoYear.length > 2000 && !bpHtmlNoYear.includes("does not exist")) {
        if (!ballotpediaUrl) ballotpediaUrl = bpUrlNoYear;
        const extracted = extractContent(bpHtmlNoYear);
        if (extracted.tldr && extracted.tldr.length > 50) {
          tldr = extracted.tldr;
          pros = extracted.pros;
          cons = extracted.cons;
        }
      } else if (!bpHtmlNoYear || bpHtmlNoYear.length < 500) {
        const proxyText = await fetchTextViaProxy(bpUrlNoYear);
        if (proxyText) {
          if (!ballotpediaUrl) ballotpediaUrl = bpUrlNoYear;
          const extracted = extractContent(proxyText);
          if (extracted.tldr && extracted.tldr.length > 50) {
            tldr = extracted.tldr;
            pros = extracted.pros;
            cons = extracted.cons;
          }
        }
      }
    }
  } else {
    // If we have OpenStates content, still try to get pros/cons from Ballotpedia
    for (const year of yearCandidates) {
      if (!shouldContinue()) break;
      const bpUrl = `https://ballotpedia.org/California_Proposition_${n}_(${year})`;
      bpHtml = await fetchText(bpUrl);

      if (bpHtml && bpHtml.length > 2000 && !bpHtml.includes("does not exist")) {
        if (!ballotpediaUrl) ballotpediaUrl = bpUrl;
        const extracted = extractContent(bpHtml);
        if (extracted.pros.length > 0) pros = extracted.pros;
        if (extracted.cons.length > 0) cons = extracted.cons;
        if (pros.length > 0 && cons.length > 0) break;
      } else if (!bpHtml || bpHtml.length < 500) {
        const proxyText = await fetchTextViaProxy(bpUrl);
        if (proxyText) {
          if (!ballotpediaUrl) ballotpediaUrl = bpUrl;
          const extracted = extractContent(proxyText);
          if (extracted.pros.length > 0) pros = extracted.pros;
          if (extracted.cons.length > 0) cons = extracted.cons;
          if (pros.length > 0 && cons.length > 0) break;
        }
      }
    }
  }

  const laoUrl = "https://lao.ca.gov/BallotAnalysis/Propositions";

  // Check if we have GOOD content (not just a generic fallback)
  const hasGoodContent = tldr &&
    tldr.length > 50 &&
    !tldr.includes("See official sources for details") &&
    !tldr.includes("For detailed information") &&
    !tldr.includes("was a ballot measure");

  // Track the year if we found one
  let foundYear = "";
  if (ballotpediaUrl) {
    const yearMatch = ballotpediaUrl.match(/\((\d{4})\)/);
    if (yearMatch) {
      foundYear = yearMatch[1];
    }
  }

  // If we don't have good content, try AI to generate a summary from available data
  if (!hasGoodContent) {
    // Try Ballotpedia one more time with different years
    const recentYears = ["2024", "2022", "2020", "2018", "2016", "2014", "2012", "2010"];
    const retryYears = requestedYear ? [requestedYear] : recentYears;
    if (!foundYear) {
      for (const year of retryYears) {
        if (!shouldContinue()) break;
        try {
          const bpUrl = `https://ballotpedia.org/California_Proposition_${n}_(${year})`;
          const testHtml = await fetchText(bpUrl);
          if (testHtml && testHtml.length > 2000 && !testHtml.includes("does not exist") && !testHtml.includes("verify that you're not a robot")) {
            ballotpediaUrl = bpUrl;
            foundYear = year;
            const extracted = extractContent(testHtml);
            if (extracted.tldr && extracted.tldr.length > 50) {
              tldr = extracted.tldr;
              pros = extracted.pros;
              cons = extracted.cons;
              break;
            }
          } else if (!testHtml || testHtml.length < 500) {
            const proxyText = await fetchTextViaProxy(bpUrl);
            if (proxyText) {
              ballotpediaUrl = bpUrl;
              foundYear = year;
              const extracted = extractContent(proxyText);
              if (extracted.tldr && extracted.tldr.length > 50) {
                tldr = extracted.tldr;
                pros = extracted.pros;
                cons = extracted.cons;
                break;
              }
            }
          }
        } catch (e) {
          // Continue to next year
        }
      }
    }

    // Always use generateSummary to get enhanced fallback.
    // If a specific year was requested, we try that year first (and we avoid returning known summaries
    // for a different year). If that fails, we may fall back to the closest known year but will
    // explicitly mark the year mismatch in the response.
    const allContent = [
      collectedContent,
      collectedTitle,
      collectedSubjects.join(", "),
      tldr, // Include existing tldr as context
    ].filter(Boolean).join(". ");

    // Use generateSummary which will handle known props and AI
    try {
      const summaryPrimary = await generateSummary({
        title: collectedTitle || `California Proposition ${n}`,
        content: allContent || `California Proposition ${n} ballot measure`,
        subjects: collectedSubjects,
        identifier: `Prop ${n}`,
        type: "proposition",
        year: requestedYear || foundYear, // Prefer user-requested year context
      });

      // Always use the summary (it may be AI or known)
      if (summaryPrimary.levels) {
        // Use level 8 (standard) for top-level backward compatibility
        const standard = summaryPrimary.levels["8"];
        if (standard) {
          tldr = standard.tldr;
          if (standard.pros.length > 0) pros = standard.pros;
          if (standard.cons.length > 0) cons = standard.cons;
        }
        // Only trust a year coming from the model if we have a verified upstream source
        // (Ballotpedia/OpenStates). Otherwise, the model can "agree" with the requested year
        // even when that year doesn't exist for this proposition number.
        if (summaryPrimary.year && (ballotpediaUrl || foundInOpenStates)) foundYear = summaryPrimary.year;

        // Store the full levels object to return
        levels = summaryPrimary.levels;
      }

      // If the user requested a year and we didn't resolve that year, attempt a second pass
      // without year constraint to get a known summary, and mark mismatch explicitly.
      if (requestedYear && (!foundYear || foundYear !== requestedYear)) {
        const summaryFallback = await generateSummary({
          title: collectedTitle || `California Proposition ${n}`,
          content: allContent || `California Proposition ${n} ballot measure`,
          subjects: collectedSubjects,
          identifier: `Prop ${n}`,
          type: "proposition",
          // omit year to allow known summaries for other years
        });
        if (summaryFallback?.levels) {
          const standard2 = summaryFallback.levels["8"];
          if (standard2) {
            tldr = standard2.tldr;
            if (standard2.pros.length > 0) pros = standard2.pros;
            if (standard2.cons.length > 0) cons = standard2.cons;
          }
          levels = summaryFallback.levels;
          const resolved = summaryFallback.year || foundYear || "";
          if (resolved && resolved !== requestedYear) {
            yearMismatchInfo = {
              requestedYear,
              resolvedYear: resolved,
              note: `No matching Proposition ${n} content was found for ${requestedYear}. Showing the closest available summary (${resolved}).`,
            };
            foundYear = resolved;
          }
        }
      }
    } catch (e) {
      console.error(`[Prop ${n}] Summary generation failed:`, e);
    }

    // Final fallback ONLY if generateSummary completely failed
    if (!tldr || tldr.length < 20 || (tldr.includes("See official sources") && pros.length === 0)) {
      if (!ballotpediaUrl) {
        ballotpediaUrl = `https://ballotpedia.org/California_Proposition_${n}`;
      }
      // Only use generic message if we truly have nothing
      if (pros.length === 0 && cons.length === 0) {
        tldr = `California Proposition ${n} was a ballot measure. For detailed information about what this proposition does, please visit the official sources linked below.`;
      }
    }
  }

  // Generate whatItDoes from tldr if not already set
  let whatItDoes = tldr;
  if (tldr && tldr.length > 50) {
    // Extract a more detailed "what it does" from the TL;DR
    // Try to expand on the key actions
    const sentences = tldr.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length > 1) {
      whatItDoes = sentences.join(". ").trim();
    } else if (sentences.length === 1) {
      // Expand single sentence with more detail
      const sentence = sentences[0];
      // Add context about implementation if available
      if (collectedContent && collectedContent.length > 50) {
        const contentSentences = collectedContent.split(/[.!?]+/).filter(s => s.trim().length > 30);
        if (contentSentences.length > 0) {
          whatItDoes = `${sentence}. ${contentSentences[0]}`.trim();
        }
      } else {
        whatItDoes = sentence;
      }
    }
  }

  // If we don't have AI levels, construct them from the single source we have
  if (!levels) {
    const singleLevel = {
      tldr,
      whatItDoes: whatItDoes || tldr,
      whoAffected: "See official sources for details.", // Basic fallback
      pros: pros.length > 0 ? pros : [],
      cons: cons.length > 0 ? cons : []
    };
    levels = {
      "5": singleLevel,
      "8": singleLevel,
      "12": singleLevel
    };
  }

  const citations = [] as Array<{ quote: string; sourceName: string; url?: string; location?: "tldr" | "what" | "who" | "pros" | "cons" }>;
  const primarySourceName = ballotpediaUrl ? "Ballotpedia" : "LAO";
  const primaryUrl = ballotpediaUrl || laoUrl;
  if (tldr) citations.push({ quote: tldr, sourceName: primarySourceName, url: primaryUrl, location: "tldr" });
  if (whatItDoes) citations.push({ quote: whatItDoes, sourceName: primarySourceName, url: primaryUrl, location: "what" });
  if (tldr) citations.push({ quote: tldr, sourceName: primarySourceName, url: primaryUrl, location: "who" });
  if (pros.length) citations.push({ quote: pros[0], sourceName: primarySourceName, url: primaryUrl, location: "pros" });
  if (cons.length) citations.push({ quote: cons[0], sourceName: primarySourceName, url: primaryUrl, location: "cons" });

  const requestedYearOut = requestedYear || undefined;
  const yearMismatchOut =
    yearMismatchInfo ||
    (requestedYear && foundYear && requestedYear !== foundYear
      ? {
          requestedYear,
          resolvedYear: foundYear,
          note: `Requested year ${requestedYear} did not match the available proposition year (${foundYear}).`,
        }
      : undefined);

  return NextResponse.json({
    number: n,
    year: foundYear, // Include year in response
    requestedYear: requestedYearOut,
    yearMismatch: yearMismatchOut,
    sources: {
      ballotpedia: ballotpediaUrl,
      lao: laoUrl,
    },
    tldr,
    whatItDoes: whatItDoes || tldr,
    pros: pros.length > 0 ? pros : [],
    cons: cons.length > 0 ? cons : [],
    levels, // Include the multi-level data
    citations,
  });
}


