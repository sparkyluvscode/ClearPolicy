import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { openstates } from "@/lib/clients/openstates";

const Params = z.object({ zip: z.string().regex(/^\d{5}$/).optional() });

type Official = { name: string; party?: string; office?: string; urls?: string[] };

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get("zip") ?? undefined;
  const parsed = Params.safeParse({ zip });
  if (!parsed.success || !parsed.data.zip) return NextResponse.json({ error: "Enter a 5-digit ZIP (e.g., 95014).", officials: [], normalizedInput: { line1: zip || "" } }, { status: 200 });

  const normalizedInput = { line1: parsed.data.zip };
  try {
    // 1) ZIP -> lat/lon (Zippopotam.us)
    const zipRes = await fetch(`https://api.zippopotam.us/us/${parsed.data.zip}`, { cache: "no-store" });
    if (!zipRes.ok) return NextResponse.json({ error: "ZIP not found. Try a valid CA ZIP like 95014.", officials: [], normalizedInput }, { status: 200 });
    const zipJson: any = await zipRes.json();
    const place = Array.isArray(zipJson?.places) && zipJson.places[0];
    const lat = place ? parseFloat(place.latitude) : NaN;
    const lon = place ? parseFloat(place.longitude) : NaN;
    if (!isFinite(lat) || !isFinite(lon)) return NextResponse.json({ error: "Could not locate that ZIP. Try another.", officials: [], normalizedInput }, { status: 200 });

    // 2) lat/lon -> districts (Census Geocoder, ACS2025 layers)
    const params = new URLSearchParams({
      x: String(lon),
      y: String(lat),
      benchmark: "Public_AR_ACS2025",
      vintage: "Current_ACS2025",
      layers: "all",
      format: "json",
    });
    const cgRes = await fetch(`https://geocoding.geo.census.gov/geocoder/geographies/coordinates?${params.toString()}`, { cache: "no-store" });
    const cgJson: any = await cgRes.json().catch(() => ({}));
    const geos = cgJson?.result?.geographies || {};
    const upperArr = geos["2024 State Legislative Districts - Upper"] || geos["State Legislative Districts - Upper"] || [];
    const lowerArr = geos["2024 State Legislative Districts - Lower"] || geos["State Legislative Districts - Lower"] || [];
    const upperNum = Array.isArray(upperArr) && upperArr[0] ? (upperArr[0].BASENAME || upperArr[0].NAME || upperArr[0].DISTRICT || "").toString().trim() : "";
    const lowerNum = Array.isArray(lowerArr) && lowerArr[0] ? (lowerArr[0].BASENAME || lowerArr[0].NAME || lowerArr[0].DISTRICT || "").toString().trim() : "";

    const divisionIds: string[] = [];
    if (upperNum) divisionIds.push(`ocd-division/country:us/state:ca/sldu:${upperNum}`);
    if (lowerNum) divisionIds.push(`ocd-division/country:us/state:ca/sldl:${lowerNum}`);
    if (divisionIds.length === 0) return NextResponse.json({ error: "Could not find CA districts for this ZIP.", officials: [], normalizedInput }, { status: 200 });

    // 3) OpenStates: fetch people for each division_id
    // Fetch by district number and filter by chamber from current_role to ensure correctness
    const key = process.env.OPENSTATES_API_KEY as string;
    const fetchByDistrict = async (district: string, chamber: "upper" | "lower") => {
      if (!district) return [] as any[];
      const url = new URL("https://v3.openstates.org/people");
      url.searchParams.set("jurisdiction", "California");
      url.searchParams.set("district", district);
      url.searchParams.set("active", "true");
      url.searchParams.set("apikey", key);
      const r = await fetch(url.toString(), { cache: "no-store" });
      const j: any = await r.json();
      const list: any[] = Array.isArray(j?.results) ? j.results : [];
      return list.filter((p: any) => p?.current_role?.org_classification === chamber);
    };

    let peopleUpper = await fetchByDistrict(upperNum, "upper");
    let peopleLower = await fetchByDistrict(lowerNum, "lower");

    // Fallback: query by division_id and filter by current_role.division_id
    const divFetch = async (divId: string, chamber: "upper" | "lower") => {
      if (!divId) return [] as any[];
      const url = new URL("https://v3.openstates.org/people");
      url.searchParams.set("jurisdiction", "California");
      url.searchParams.set("division_id", divId);
      url.searchParams.set("active", "true");
      url.searchParams.set("apikey", key);
      const r = await fetch(url.toString(), { cache: "no-store" });
      const j: any = await r.json();
      const list: any[] = Array.isArray(j?.results) ? j.results : [];
      return list.filter((p: any) => (p?.current_role?.org_classification === chamber) && (p?.current_role?.division_id === divId));
    };
    if (peopleUpper.length === 0 && upperNum) peopleUpper = await divFetch(`ocd-division/country:us/state:ca/sldu:${upperNum}`, "upper");
    if (peopleLower.length === 0 && lowerNum) peopleLower = await divFetch(`ocd-division/country:us/state:ca/sldl:${lowerNum}`, "lower");
    const peopleLists = [peopleUpper, peopleLower];

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
        const domain = party.startsWith("dem") ? "asmdc.org" : "asmrc.org";
        return `https://a${pad2(district)}.${domain}/`;
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
        officials.push({ name: p?.name || "", party: p?.party, office, urls: [officialUrl] });
      }
    }

    if (officials.length === 0) return NextResponse.json({ error: "No officials found for this ZIP.", officials: [], normalizedInput }, { status: 200 });

    return NextResponse.json({ officials, normalizedInput, offices: [] }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Lookup failed. Try again later.", officials: [], normalizedInput }, { status: 200 });
  }
}


