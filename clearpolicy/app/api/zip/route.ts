import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { openstates } from "@/lib/clients/openstates";

const Params = z.object({
  zip: z.string().regex(/^\d{5}$/).optional(),
  osid: z.string().optional(),
  include_meta: z.string().optional(),
});

type Official = { name: string; party?: string; office?: string; urls?: string[]; context?: string; vote?: string; voteUrl?: string; image?: string };
type PlaceInfo = { city?: string; state?: string; county?: string };
type DistrictInfo = { senate?: string; assembly?: string };
type ZipResponseBase = {
  officials: Official[];
  normalizedInput: { line1: string };
  finderUrl?: string;
  analysisUrl?: string;
  offices?: any[];
  error?: string;
};
type ZipResponseMeta = { place?: PlaceInfo; districts?: DistrictInfo };
type ZipResponse = ZipResponseBase & Partial<ZipResponseMeta>;

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get("zip") ?? undefined;
  const osid = req.nextUrl.searchParams.get("osid") ?? undefined;
  const includeMeta = req.nextUrl.searchParams.get("include_meta") === "1";
  const parsed = Params.safeParse({ zip, osid, include_meta: includeMeta ? "1" : undefined });
  if (!parsed.success || !parsed.data.zip) {
    const base: ZipResponseBase = { error: "Enter a 5-digit ZIP (e.g., 95014).", officials: [], normalizedInput: { line1: zip || "" } };
    return NextResponse.json(base, { status: 200 });
  }

  const zipCode = parsed.data.zip; // Guaranteed non-null after line 30 check
  const normalizedInput = { line1: zipCode };
  const finderUrl = `https://findyourrep.legislature.ca.gov/?myZip=${encodeURIComponent(zipCode)}`;
  const curated: Record<string, Official[]> = {
    "95014": [
      { name: "Josh Becker", party: "Democratic", office: "Senator", urls: ["https://sd13.senate.ca.gov/"] },
      { name: "Evan Low", party: "Democratic", office: "Assemblymember", urls: ["https://a26.asmdc.org/"] },
    ],
    "95762": [
      { name: "Kevin Kiley", party: "Republican", office: "U.S. Representative (CA-3)", urls: ["https://kiley.house.gov/"], image: "/kiley.jpg" },
    ],
  };
  const curatedPlace: Record<string, PlaceInfo> = {
    "95014": { city: "Cupertino", state: "CA" },
    "95762": { city: "Granite Bay", state: "CA" },
  };
  const curatedDistricts: Record<string, DistrictInfo> = {
    "95014": { senate: "13", assembly: "26" },
    "95762": { senate: "01", assembly: "06" },
  };
  const curatedOfficials = curated[zipCode];
  const respond = (base: ZipResponseBase, meta?: ZipResponseMeta) => {
    const payload: ZipResponse = includeMeta && meta ? { ...base, ...meta } : base;
    return NextResponse.json(payload, { status: 200 });
  };
  const fallbackResponse = (error?: string, place?: PlaceInfo, districts?: DistrictInfo) => {
    if (curatedOfficials && curatedOfficials.length) {
      const analysisUrl = `https://news.google.com/search?q=${encodeURIComponent(`${zipCode} California measure impact`)}`;
      const metaDistricts = districts || curatedDistricts[zipCode];
      return respond({ officials: curatedOfficials, normalizedInput, analysisUrl, finderUrl }, { place, districts: metaDistricts });
    }
    return respond({ error: error || "ZIP not found. Try a valid CA ZIP like 95014.", officials: [], normalizedInput }, { place, districts });
  };
  try {
    // 1) ZIP -> lat/lon (Zippopotam.us)
    const zipRes = await fetch(`https://api.zippopotam.us/us/${zipCode}`, { cache: "no-store" });
    if (!zipRes.ok) return fallbackResponse(undefined, curatedPlace[zipCode], curatedDistricts[zipCode]);
    const zipJson: any = await zipRes.json();
    const place = Array.isArray(zipJson?.places) && zipJson.places[0];
    const lat = place ? parseFloat(place.latitude) : NaN;
    const lon = place ? parseFloat(place.longitude) : NaN;
    const city = place?.["place name"] || "";
    const state = place?.state || place?.["state abbreviation"] || "";
    const county = place?.county || "";
    const placeInfo: PlaceInfo = { city, state, county };
    if (!isFinite(lat) || !isFinite(lon)) return fallbackResponse("Could not locate that ZIP. Try another.", placeInfo, curatedDistricts[zipCode]);

    // 2) lat/lon -> districts (Census Geocoder, ACS2025 layers)
    const params = new URLSearchParams({
      x: String(lon),
      y: String(lat),
      benchmark: "Public_AR_Current",
      vintage: "Current_Current",
      layers: "all",
      format: "json",
    });
    const cgRes = await fetch(`https://geocoding.geo.census.gov/geocoder/geographies/coordinates?${params.toString()}`, { cache: "no-store" });
    const cgJson: any = await cgRes.json().catch(() => ({}));
    const geos = cgJson?.result?.geographies || {};
    const keyFor = (kind: "Upper" | "Lower") => Object.keys(geos).find((k) => /State\s+Legislative\s+Districts/.test(k) && new RegExp(kind, "i").test(k));
    const keyU = keyFor("Upper");
    const keyL = keyFor("Lower");
    const upperArr = (keyU && geos[keyU]) || [];
    const lowerArr = (keyL && geos[keyL]) || [];
    const extractNum = (o: any) => {
      const raw = (o?.BASENAME || o?.NAME || o?.DISTRICT || "").toString();
      const m = raw.match(/\d+/);
      return m ? m[0] : raw.trim();
    };
    const upperNum = Array.isArray(upperArr) && upperArr[0] ? extractNum(upperArr[0]) : "";
    const lowerNum = Array.isArray(lowerArr) && lowerArr[0] ? extractNum(lowerArr[0]) : "";

    const divisionIds: string[] = [];
    if (upperNum) divisionIds.push(`ocd-division/country:us/state:ca/sldu:${upperNum}`);
    if (lowerNum) divisionIds.push(`ocd-division/country:us/state:ca/sldl:${lowerNum}`);
    if (divisionIds.length === 0) return fallbackResponse("Could not find CA districts for this ZIP.", placeInfo, curatedDistricts[zipCode]);

    // 3) OpenStates: fetch people for each division_id
    // Fetch by district number and filter by chamber from current_role to ensure correctness
    const key = process.env.OPENSTATES_API_KEY as string;
    const fetchByDistrict = async (district: string, chamber: "upper" | "lower") => {
      if (!district) return [] as any[];
      const url = new URL("https://v3.openstates.org/people");
      url.searchParams.set("jurisdiction", "California");
      url.searchParams.set("district", district);
      url.searchParams.set("per_page", "10");
      url.searchParams.set("org_classification", chamber);
      // don't restrict to active only; some data sets omit this flag or seat temporarily
      url.searchParams.set("apikey", key);
      const r = await fetch(url.toString(), { cache: "no-store" });
      const j: any = await r.json();
      const list: any[] = Array.isArray(j?.results) ? j.results : [];
      // prefer chamber match, but fall back to any if none
      const byChamber = list.filter((p: any) => p?.current_role?.org_classification === chamber);
      return byChamber.length ? byChamber : list;
    };

    let peopleUpper = await fetchByDistrict(upperNum, "upper");
    let peopleLower = await fetchByDistrict(lowerNum, "lower");

    // Fallback: query by division_id and filter by current_role.division_id
    const divFetch = async (divId: string, chamber: "upper" | "lower") => {
      if (!divId) return [] as any[];
      const url = new URL("https://v3.openstates.org/people");
      // Query by division and chamber; include jurisdiction for certainty
      url.searchParams.set("division_id", divId);
      url.searchParams.set("org_classification", chamber);
      url.searchParams.set("jurisdiction", "California");
      url.searchParams.set("per_page", "10");
      url.searchParams.set("apikey", key);
      const r = await fetch(url.toString(), { cache: "no-store" });
      const j: any = await r.json();
      const list: any[] = Array.isArray(j?.results) ? j.results : [];
      const byChamber = list.filter((p: any) => (p?.current_role?.org_classification === chamber) && (p?.current_role?.division_id === divId));
      return byChamber.length ? byChamber : list;
    };
    if (peopleUpper.length === 0 && upperNum) peopleUpper = await divFetch(`ocd-division/country:us/state:ca/sldu:${upperNum}`, "upper");
    if (peopleLower.length === 0 && lowerNum) peopleLower = await divFetch(`ocd-division/country:us/state:ca/sldl:${lowerNum}`, "lower");

    // Final fallback: fetch chamber rosters and filter locally by district number
    const fetchRoster = async (chamber: "upper" | "lower") => {
      const url = new URL("https://v3.openstates.org/people");
      url.searchParams.set("jurisdiction", "California");
      url.searchParams.set("org_classification", chamber);
      url.searchParams.set("per_page", "200");
      url.searchParams.set("apikey", key);
      const r = await fetch(url.toString(), { cache: "no-store" });
      const j: any = await r.json();
      return Array.isArray(j?.results) ? j.results : [];
    };
    if (peopleUpper.length === 0 && upperNum) {
      const rosterU = await fetchRoster("upper");
      peopleUpper = rosterU.filter((p: any) => String(p?.current_role?.district || "").trim() === String(upperNum));
    }
    if (peopleLower.length === 0 && lowerNum) {
      const rosterL = await fetchRoster("lower");
      peopleLower = rosterL.filter((p: any) => String(p?.current_role?.district || "").trim() === String(lowerNum));
    }
    const peopleLists = [peopleUpper, peopleLower];
    const districts: DistrictInfo = {
      senate: upperNum || undefined,
      assembly: lowerNum || undefined,
    };

    const seen = new Set<string>();
    const officials: Official[] = [];
    const pad2 = (n: string) => (n.length === 1 ? `0${n}` : n);
    const computeOfficialHomepage = (person: any): string | null => {
      const role = person?.current_role || {};
      const district: string = String(role?.district || "").trim();
      const chamber: string = String(role?.org_classification || "").trim();
      if (!district) return null;
      if (chamber === "upper") {
        return `https://sd${pad2(district)}.senate.ca.gov/`;
      }
      if (chamber === "lower") {
        const party: string = String(person?.party || "").toLowerCase();
        if (party.startsWith("dem")) return `https://a${pad2(district)}.asmdc.org/`;
        return `https://ad${pad2(district)}.asmrc.org/`;
      }
      return null;
    };

    const pickOfficialUrl = (person: any): string => {
      const urls: string[] = [];
      const push = (u: any) => { if (typeof u === "string" && /^https?:\/\//.test(u)) urls.push(u); };
      if (Array.isArray(person?.links)) person.links.forEach((l: any) => push(l?.url));
      if (Array.isArray(person?.sources)) person.sources.forEach((s: any) => push(s?.url));
      if (Array.isArray(person?.contact_details)) person.contact_details.forEach((cd: any) => { push(cd?.url); push(cd?.website); });
      const guess = computeOfficialHomepage(person);
      if (guess) urls.push(guess);
      const score = (u: string) => {
        try {
          const host = new URL(u).hostname;
          if (host.endsWith("senate.ca.gov")) return 100;
          if (host.endsWith("assembly.ca.gov")) return 95;
          if (host.endsWith("leginfo.legislature.ca.gov")) return 90;
          if (host.endsWith("asmdc.org") || host.endsWith("asmrc.org")) return 85;
          if (host.endsWith("ca.gov")) return 80;
          return 10;
        } catch { return 0; }
      };
      urls.sort((a, b) => score(b) - score(a));
      if (urls[0]) return urls[0];
      return `https://openstates.org/person/${encodeURIComponent(String(person?.id || "").replace("ocd-person/", ""))}/`;
    };

    for (const list of peopleLists) {
      for (const p of list) {
        if (!p?.id || seen.has(p.id)) continue;
        seen.add(p.id);
        const role = p?.current_role || {};
        const office = role?.title || (role?.org_classification === "upper" ? "Senator" : role?.org_classification === "lower" ? "Assemblymember" : "Official");
        const officialUrl = pickOfficialUrl(p);
        officials.push({ name: p?.name || "", party: p?.party, office, urls: [officialUrl], image: p?.image || p?.image_url || p?.photo_url });
      }
    }

    if (officials.length === 0) {
      const cur = curatedOfficials;
      if (cur && cur.length) officials.push(...cur);

      // Helper to parse a likely name from a homepage <title>
      const parseNameFromHtml = (html: string, office: "Senator" | "Assemblymember"): string | null => {
        const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const t = (m ? m[1] : "").replace(/\s+/g, " ").trim();
        if (t) {
          const re = new RegExp(`${office}\\s+(.+)$`, "i");
          const mm = t.match(re);
          if (mm && mm[1]) return mm[1].replace(/\s*\|.*$/, "").trim();
          const stripped = t.replace(/^(Assemblymember|Senator)\s+/i, "").replace(/\s*\|.*$/, "").trim();
          if (stripped && !/^AD\d+$/i.test(stripped)) return stripped;
        }
        // Look for "Assemblymember <Name>" anywhere in the HTML
        if (office === "Assemblymember") {
          const rx = /(Assemblymember|Assemblyman|Assemblywoman)\s+([A-Z][\w.'-]+(?:\s+[A-Z][\w.'-]+)+)/i;
          const mm2 = html.match(rx);
          if (mm2 && mm2[2]) return mm2[2].trim();
        }
        if (office === "Senator") {
          const rx = /Senator\s+([A-Z][\w.'-]+(?:\s+[A-Z][\w.'-]+)+)/i;
          const mm2 = html.match(rx);
          if (mm2 && mm2[1]) return mm2[1].trim();
        }
        return null;
      };

      // Try to infer names from official homepages when API data is missing
      const inferred: Official[] = [];
      if (!cur) {
        // Senate
        if (upperNum) {
          const sUrl = `https://sd${pad2(upperNum)}.senate.ca.gov/`;
          try {
            const r = await fetch(sUrl, { cache: "no-store" });
            const html = await r.text();
            const nm = parseNameFromHtml(html, "Senator");
            inferred.push({ name: nm || `Senator — SD ${upperNum}`, office: "Senator", urls: [sUrl] });
          } catch {
            inferred.push({ name: `Senator — SD ${upperNum}`, office: "Senator", urls: [sUrl] });
          }
        }
        // Assembly: probe both party domains to find a live homepage
        if (lowerNum) {
          const aUrls = [`https://a${pad2(lowerNum)}.asmdc.org/`, `https://ad${pad2(lowerNum)}.asmrc.org/`];
          let aUrl = "";
          let nm: string | null = null;
          for (const u of aUrls) {
            try {
              const r = await fetch(u, { cache: "no-store", redirect: "follow" as RequestRedirect });
              if (r.ok) {
                const html = await r.text();
                nm = parseNameFromHtml(html, "Assemblymember");
                aUrl = u;
                break;
              }
            } catch {}
          }
          if (!aUrl) aUrl = finderUrl;
          inferred.push({ name: nm || `Assemblymember — AD ${lowerNum}`, office: "Assemblymember", urls: [aUrl] });
        }
      }

      if (inferred.length) officials.push(...inferred);
      // Ensure the panel is never blank
      if (officials.length === 0) {
        if (upperNum) officials.push({ name: `Senator — SD ${upperNum}`, office: "Senator", urls: [`https://sd${pad2(upperNum)}.senate.ca.gov/`] });
        if (lowerNum) officials.push({ name: `Assemblymember — AD ${lowerNum}`, office: "Assemblymember", urls: [finderUrl] });
      }
      return respond({ officials, normalizedInput, finderUrl }, { place: placeInfo, districts });
    }

    // Optional measure context: attach simple context note
    let contextLine: string | null = null;
    let votes: Record<string, { vote: string; url?: string }> = {};
    if (osid) {
      try {
        const billRes = await fetch(`https://v3.openstates.org/bills/${encodeURIComponent(osid)}?include=votes&apikey=${key}`, { cache: "no-store" });
        const billJson: any = await billRes.json();
        const title: string = billJson?.title || billJson?.identifier || "";
        const latest: string = billJson?.latest_action_description || billJson?.latest_action?.description || "";
        contextLine = title ? `Context: ${title}${latest ? ` — ${latest}` : ""}` : null;
        const voteEvents: any[] = ([] as any[])
          .concat(billJson?.votes || [])
          .concat(billJson?.vote_events || [])
          .filter(Boolean);
        for (const ev of voteEvents) {
          const voters: any[] = ([] as any[])
            .concat(ev?.voters || [])
            .concat(ev?.roll_calls || [])
            .concat(ev?.votes || [])
            .filter(Boolean);
          for (const v of voters) {
            const nm = String(v?.name || v?.legislator || v?.person || "").toLowerCase();
            const opt = String(v?.vote || v?.option || v?.result || v?.value || "").toLowerCase();
            if (!nm) continue;
            let pretty = "";
            if (/yes|yea|approve|pass/.test(opt)) pretty = "Voted Yes";
            else if (/no|nay|reject|fail/.test(opt)) pretty = "Voted No";
            else if (/abstain|absent|present/.test(opt)) pretty = "Abstained";
            if (pretty) votes[nm] = { vote: pretty, url: ev?.source_url || ev?.url || billJson?.openstates_url };
          }
        }
      } catch {}
    }
    if (contextLine) {
      for (const o of officials) {
        (o as any).context = contextLine;
        // attach vote when name matches
        const keyName = String(o.name || "").toLowerCase();
        const matched = Object.keys(votes).find((vn) => keyName.includes(vn) || vn.includes(keyName));
        if (matched) {
          o.vote = votes[matched].vote;
          if (votes[matched].url) o.voteUrl = votes[matched].url;
        }
      }
    }

    const analysisQuery = contextLine ? `${contextLine} ${city} California` : `${zipCode} California measure impact`;
    const analysisUrl = `https://news.google.com/search?q=${encodeURIComponent(analysisQuery)}`;

    return respond({ officials, normalizedInput, offices: [], analysisUrl, finderUrl }, { place: placeInfo, districts });
  } catch (e) {
    return fallbackResponse("Lookup failed. Try again later.", curatedPlace[zipCode]);
  }
}


