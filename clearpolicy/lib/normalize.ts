export type NormalMeasure = {
  kind: "prop" | "bill";
  jurisdiction: "CA" | "US";
  number: string; // e.g., "Prop 47" or "H.R. 4369"
  title: string;
  status?: string;
  id: string; // source id
  slug: string; // for routing
};

export function slugify(m: NormalMeasure) {
  return `${m.jurisdiction}-${m.number.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function disambiguate(rawQuery: string) {
  const q = rawQuery.toLowerCase();
  const chips: { label: string; hint: string; slug?: string }[] = [];

  // 1. Matches for "Prop" or "Proposition"
  const propMatch = q.match(/(?:prop|proposition)\s*(\d{1,3})/);
  if (propMatch) {
    const n = propMatch[1];
    if (n === "17") {
      chips.push({ label: "Prop 17 (2020)", hint: "Voting rights for people on parole", slug: "ca-prop-17-2020" });
    } else if (n === "47") {
      chips.push({ label: "Prop 47 (2014)", hint: "Reduced penalties for theft & drug crimes", slug: "ca-prop-47-2014" });
    } else if (n === "50") {
      chips.push({ label: "Prop 50 (2016)", hint: "Water infrastructure financing", slug: undefined });
    } else {
      // General dynamic prop suggestion
      chips.push({ label: `California Proposition ${n}`, hint: "Search for this ballot measure", slug: undefined });
    }
  }
  // 2. Fallback: If user types just "Prop", give them the popular ones
  else if (/^prop(?:osition)?\s*$/.test(q)) {
    chips.push(
      { label: "Prop 47 (2014)", hint: "Theft & drug penalties", slug: "ca-prop-47-2014" },
      { label: "Prop 17 (2020)", hint: "Parolee voting rights", slug: "ca-prop-17-2020" }
    );
  }

  // 2b. If user types just "AB", suggest real bills
  if (/^ab\s*$/.test(q)) {
    chips.push(
      { label: "AB 5 (2019)", hint: "Gig worker classification (ABC test)", slug: undefined },
      { label: "AB 257 (2021)", hint: "Fast Food Accountability", slug: undefined },
      { label: "AB 1088 (2023)", hint: "Youth voting pre‑registration", slug: undefined }
    );
  }

  // 3. Bill identifier matches (AB/SB)
  const billMatch = q.match(/\b(ab|sb)\s*(\d{1,5})\b/);
  if (billMatch) {
    const prefix = billMatch[1].toUpperCase();
    const num = billMatch[2];
    if (prefix === "AB" && num === "5") {
      chips.push({ label: "AB 5 (2019)", hint: "Gig worker classification (ABC test)", slug: undefined });
    } else if (prefix === "SB" && num === "1383") {
      chips.push({ label: "SB 1383 (2016)", hint: "Organic waste & methane reduction", slug: undefined });
    } else {
      chips.push({ label: `${prefix} ${num}`, hint: "Search this bill number", slug: undefined });
    }
  }

  // 4. Topic matches (only when no prop number is specified)
  if (!propMatch && /theft|shoplift|steal|crime|robbery/.test(q)) {
    chips.push({ label: "Prop 47 (2014)", hint: "Related to retail theft penalties", slug: "ca-prop-47-2014" });
  }
  if (!propMatch && /parole|vote|felon|voting/.test(q)) {
    chips.push({ label: "Prop 17 (2020)", hint: "Parolee voting rights", slug: "ca-prop-17-2020" });
  }

  return chips;
}


