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
    
    // Detect ZIP code queries (e.g., "whos my rep for 95762", "who's my rep 95014", "representative 95762")
    const zipMatch = parsed.data.q.match(/(?:who'?s?\s+my\s+rep(?:resentative)?|rep(?:resentative)?)\s+(?:for\s+)?(\d{5})/i);
    if (zipMatch) {
      const zip = zipMatch[1];
      // Return special response for ZIP code queries that frontend can handle
      return NextResponse.json({ 
        zipCode: zip,
        redirectToZip: true,
        ca: { results: [] },
        us: { bills: [] },
        fallbacks: [],
        chips: []
      });
    }
    
    // Normalize "Proposition" to "Prop" for better matching
    let normalizedQuery = parsed.data.q.replace(/\bproposition\s+(\d+)/gi, "Prop $1");
    
    const chips = disambiguate(normalizedQuery);
    // For topic-based searches, try to find bills by subject
    const ql = normalizedQuery.toLowerCase().trim();
    const isTopicSearch = !/(prop|proposition|ab|sb|assembly|senate)\s*\d+/i.test(normalizedQuery) && 
                          /^(healthcare|health|education|environment|climate|energy|tax|budget|crime|criminal)/i.test(normalizedQuery);
    
    // Check for bill identifier patterns first (AB 5, SB 1383, etc.)
    const identMatch = normalizedQuery.toLowerCase().match(/\b(ab|sb)\s*(\d{1,5})\b/);
    
    // Check for proposition patterns (Prop 22, Proposition 22, etc.)
    const propMatch = normalizedQuery.match(/\b(?:prop|proposition)\s*(\d{1,3})\b/i);
    
    // Search both CA and US in parallel
    const [ca, us] = await Promise.all([
      (async () => {
        if (identMatch) {
          // For bill identifiers, search by identifier first
          const ident = `${identMatch[1].toUpperCase()} ${identMatch[2]}`;
          const byIdent: any = await openstates.searchByIdentifier(ident, "ca").catch(() => ({ results: [] }));
          const arr: any[] = Array.isArray(byIdent?.results) ? byIdent.results : [];
          if (arr.length > 0) {
            return { results: arr };
          }
          // Fallback to text search if identifier search fails
        }
        // Use normalized query for search
        return openstates.searchBills(normalizedQuery, "ca").catch(() => ({ results: [] }));
      })(),
      congress.searchBills(normalizedQuery).catch(() => ({ data: { bills: [] } })),
    ]);
    
    // If topic search returned no results, try alternative search strategies
    if (isTopicSearch && Array.isArray((ca as any).results) && (ca as any).results.length === 0) {
      try {
        // Map common topics to OpenStates subject terms
        const topicMap: Record<string, string> = {
          "healthcare": "Health",
          "health": "Health",
          "education": "Education",
          "environment": "Environment",
          "climate": "Environment",
          "energy": "Energy",
          "tax": "Taxation",
          "budget": "Appropriations",
          "crime": "Criminal Justice",
          "criminal": "Criminal Justice",
        };
        
        const subjectTerm = topicMap[ql];
        
        // Try subject-based search using OpenStates subject parameter if we have a mapping
        if (subjectTerm) {
          try {
            const subjectResults = await openstates.searchBySubject(subjectTerm, "ca").catch(() => ({ results: [] }));
            if (Array.isArray(subjectResults?.results) && subjectResults.results.length > 0) {
              (ca as any).results = subjectResults.results;
            }
          } catch (e) {
            // Continue to fallback strategies
          }
        }
        
        // If subject search didn't work, try multiple text search strategies
        if (Array.isArray((ca as any).results) && (ca as any).results.length === 0) {
          const searchStrategies = [
            `California ${parsed.data.q}`,
            parsed.data.q.charAt(0).toUpperCase() + parsed.data.q.slice(1),
            parsed.data.q + " policy",
            parsed.data.q + " legislation",
            parsed.data.q + " bill",
            `CA ${parsed.data.q}`,
          ];
          
          for (const strategy of searchStrategies) {
            try {
              const topicResults = await openstates.searchBills(strategy, "ca").catch(() => ({ results: [] }));
              if (Array.isArray(topicResults?.results) && topicResults.results.length > 0) {
                (ca as any).results = topicResults.results;
                break;
              }
            } catch (e) {
              // Continue to next strategy
            }
          }
        }
        
        // If still no results, try to find any bills that might be related
        if (Array.isArray((ca as any).results) && (ca as any).results.length === 0) {
          // Try searching for bills with the topic in title or subjects
          try {
            // Search for recent bills that might match - use the original query
            const recentSearch = await openstates.searchBills(parsed.data.q, "ca").catch(() => ({ results: [] }));
            if (Array.isArray(recentSearch?.results) && recentSearch.results.length > 0) {
              // Filter results that contain the topic keyword anywhere
              const filtered = recentSearch.results.filter((r: any) => {
                const title = (r.title || "").toLowerCase();
                const identifier = (r.identifier || "").toLowerCase();
                const subjects = Array.isArray(r.subject) ? r.subject.join(" ").toLowerCase() : (r.subject || "").toLowerCase();
                const classification = Array.isArray(r.classification) ? r.classification.join(" ").toLowerCase() : "";
                const latestAction = (r.latest_action_description || "").toLowerCase();
                const allText = `${title} ${identifier} ${subjects} ${classification} ${latestAction}`;
                // Match if topic appears anywhere in bill data
                return allText.includes(ql) || allText.includes(parsed.data.q.toLowerCase());
              });
              if (filtered.length > 0) {
                (ca as any).results = filtered.slice(0, 10);
              } else {
                // If no filtered results, use all results from search (they might still be relevant)
                (ca as any).results = recentSearch.results.slice(0, 10);
              }
            }
          } catch (e) {
            // Accept empty results if all strategies fail
          }
        }
      } catch (e) {
        // Continue with empty results
      }
    }

    // CA ranking & dedupe
    try {
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
            if (/budget act|fast food|family leave|cfra/.test(ql) && /budget|fast|family|leave|cfra/.test(title)) s += 20;
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

    // Identifier-based CA bill lookup (AB/SB patterns)
    try {
      const identMatch = parsed.data.q.toLowerCase().match(/\b(ab|sb)\s*(\d{1,5})\b/);
      if (identMatch) {
        const ident = `${identMatch[1].toUpperCase()} ${identMatch[2]}`;
        const byIdent: any = await openstates.searchByIdentifier(ident, "ca").catch(() => ({ results: [] }));
        const arr: any[] = Array.isArray(byIdent?.results) ? byIdent.results : [];
        if (arr.length) {
          const mapped = arr.map((r: any) => ({
            ...r,
            _direct: true,
            _reason: "Shown because it matches the bill identifier.",
            _preview: r?.latest_action_description || r?.latest_action?.description || r?.extras?.impact_clause?.slice(0, 100) || "",
          }));
          const exactMatch = mapped.find((r: any) => (r.identifier || "").toUpperCase() === ident.toUpperCase());
          if (exactMatch) {
            (ca as any).results = [exactMatch, ...mapped.filter(r => r.id !== exactMatch.id), ...((ca as any).results || [])];
          } else {
            (ca as any).results = [...mapped, ...((ca as any).results || [])];
          }
        } else {
          // Virtual fallback to CA LegInfo when no OpenStates match
          (ca as any).results = [
            {
              id: `ca-virtual-${ident.replace(/\s+/g, "-").toLowerCase()}`,
              identifier: ident,
              title: ident,
              classification: ["bill"],
              externalUrl: `https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml?search_text=${encodeURIComponent(ident)}`,
              _direct: true,
              _reason: "Top pick from official records.",
              _preview: "Open the CA Legislature’s official bill page.",
            },
            ...((ca as any).results || []),
          ];
        }
      }
    } catch {}

    // Build trusted fallback links (always safe to show)
    const fallbacks: Array<{ label: string; url: string; hint: string; kind: "overview" | "official" | "analysis" }> = [];
    
    // ql already defined above, reuse it
    const push = (label: string, url: string, hint: string, kind: "overview" | "official" | "analysis") => fallbacks.push({ label, url, hint, kind });

    // General trusted portals
    push("Open States (California)", `https://v3.openstates.org/?subject=${encodeURIComponent(parsed.data.q)}`, "State bill records", "official");
    push("Congress.gov", `https://www.congress.gov/search?q=${encodeURIComponent(parsed.data.q)}`, "Federal legislation", "official");
    push("GovTrack", `https://www.govtrack.us/search?q=${encodeURIComponent(parsed.data.q)}`, "Federal bill summaries", "overview");
    push("Ballotpedia", `https://ballotpedia.org/wiki/index.php?search=${encodeURIComponent(parsed.data.q)}`, "Ballot measures overview", "overview");
    push("LAO (California)", `https://lao.ca.gov/Search?q=${encodeURIComponent(parsed.data.q)}`, "Legislative Analyst’s Office reports", "analysis");

    // Pattern: CA proposition (handle both "prop" and "proposition")
    // Add a virtual proposition result when user types "prop <number>" or "proposition <number>"
    try {
      const m = ql.match(/(?:prop|proposition)\s*(\d{1,3})/);
      if (m) {
        const n = m[1];
        const ext = `https://www.google.com/search?q=${encodeURIComponent(`California Proposition ${n} site:ballotpedia.org OR site:lao.ca.gov`)}`;
        const virtual = {
          id: `prop-${n}-virtual`,
          identifier: `California Proposition ${n}`,
          title: `California Proposition ${n}`,
          classification: ["ballot"],
          // Keep external as a fallback reference but prefer internal route in UI
          externalUrl: ext,
          _virtual: "prop",
          propNum: n,
          _direct: true,
          _reason: `Shown because it matches Proposition ${n}.`,
          _preview: "Open a trusted overview from Ballotpedia or LAO.",
        } as const;
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
    if (/affordable care act|\baca\b/.test(ql)) {
      push("Affordable Care Act – Congress.gov", "https://www.congress.gov/bill/111th-congress/house-bill/3590", "Original ACA bill page", "official");
      push("GovTrack – ACA overview", "https://www.govtrack.us/congress/bills/111/hr3590", "Bill overview and history", "overview");
    }
    if (/national defense authorization act|\bndaa\b/.test(ql)) {
      push("NDAA – Congress.gov (search)", "https://www.congress.gov/search?q=%22National%20Defense%20Authorization%20Act%22", "Official federal records", "official");
      push("GovTrack – NDAA (search)", "https://www.govtrack.us/search?q=National%20Defense%20Authorization%20Act", "Bill summaries and status", "overview");
    }
    if (/american rescue plan act|\barpa\b/.test(ql)) {
      push("American Rescue Plan Act – Congress.gov", "https://www.congress.gov/bill/117th-congress/house-bill/1319", "Official bill page (117th H.R. 1319)", "official");
      push("GovTrack – ARPA overview", "https://www.govtrack.us/congress/bills/117/hr1319", "Bill overview and history", "overview");
    }
    if (/infrastructure investment and jobs act|bipartisan infrastructure law|\biija\b/.test(ql)) {
      push("Infrastructure Investment and Jobs Act – Congress.gov", "https://www.congress.gov/bill/117th-congress/house-bill/3684", "Official bill page (117th H.R. 3684)", "official");
      push("GovTrack – IIJA overview", "https://www.govtrack.us/congress/bills/117/hr3684", "Bill overview and history", "overview");
    }
    if (/\b2023\b.*budget|budget\s*act/.test(ql)) {
      push("California Budget Act – LAO", "https://lao.ca.gov/Budget", "LAO budget analyses", "analysis");
      push("Budget Act – LegInfo (search)", `https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml?search_text=${encodeURIComponent(parsed.data.q)}`, "CA official search", "official");
    }
    if (/fair\s+sentencing\s+act/.test(ql)) {
      push("Fair Sentencing Act – Congress.gov", "https://www.congress.gov/bill/111th-congress/senate-bill/1789", "Official bill page", "official");
      push("GovTrack – FSA overview", "https://www.govtrack.us/congress/bills/111/s1789", "Bill overview and history", "overview");
    }

    // Disambiguation fallbacks for well-known CA items
    if (/\bab\s*5\b/.test(ql) && /(2019|gig|worker|abc\s*test|contractor)/.test(ql)) {
      push("AB 5 (2019) – LegInfo", "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB5", "Worker classification law (ABC test)", "official");
      push("AB 5 (2019) – Ballotpedia overview", "https://ballotpedia.org/California_Assembly_Bill_5_(2019)", "Background and impacts", "overview");
    }
    if (/\bsb\s*1383\b/.test(ql)) {
      push("SB 1383 (2016) – LegInfo", "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201520160SB1383", "Short-Lived Climate Pollutants / organic waste", "official");
      push("SB 1383 (2020) – LegInfo", "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200SB1383", "CFRA family leave expansion", "official");
    }

    // Promote a top pick when ACA/NDAA detected and no US results
    try {
      const isAca = /affordable care act|\baca\b/.test(ql);
      const isNdaa = /national defense authorization act|\bndaa\b/.test(ql);
      const isFsa = /fair\s+sentencing\s+act/.test(ql);
      const isArpa = /american rescue plan act|\barpa\b/.test(ql);
      const isIija = /infrastructure investment and jobs act|bipartisan infrastructure law|\biija\b/.test(ql);
      const caArr = (ca as any).results || [];
      const usBills = (us as any)?.data?.bills || (us as any)?.bills || [];
      if (isAca || isNdaa || isFsa || isArpa || isIija) {
        const virtBills: any[] = [];
        if (isAca) virtBills.push({ congress: 111, type: "hr", number: "3590", title: "Patient Protection and Affordable Care Act (ACA)", latestAction: { text: "Enacted as Public Law 111-148." } });
        if (isNdaa) virtBills.push({ congress: 119, type: "s", number: "0000", title: "National Defense Authorization Act (NDAA)", latestAction: { text: "See current NDAA in Congress.gov search." } });
        if (isFsa) virtBills.push({ congress: 111, type: "s", number: "1789", title: "Fair Sentencing Act of 2010", latestAction: { text: "Enacted as Public Law 111-220." } });
        if (isArpa) virtBills.push({ congress: 117, type: "hr", number: "1319", title: "American Rescue Plan Act of 2021", latestAction: { text: "Enacted as Public Law 117-2." } });
        if (isIija) virtBills.push({ congress: 117, type: "hr", number: "3684", title: "Infrastructure Investment and Jobs Act", latestAction: { text: "Enacted as Public Law 117-58." } });
        const current = ((us as any)?.bills || (us as any)?.data?.bills || []) as any[];
        const combined = [...virtBills, ...current];
        (us as any).data = (us as any).data || {};
        (us as any).data.bills = combined;
        (us as any).bills = combined;
      }
    } catch {}

    return NextResponse.json({ chips, ca, us, fallbacks });
  } catch (e: any) {
    return NextResponse.json({ chips: [], ca: { results: [] }, us: { data: { bills: [] } }, fallbacks: [], error: e?.message || "search failed" }, { status: 200 });
  }
}


