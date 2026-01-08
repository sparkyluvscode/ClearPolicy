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

  // 3. Topic matches
  if (/theft|shoplift|steal|crime|robbery/.test(q)) {
    if (!chips.some(c => c.label.includes("47"))) {
      chips.push({ label: "Prop 47 (2014)", hint: "Related to retail theft penalties", slug: "ca-prop-47-2014" });
    }
  }
  if (/parole|vote|felon|voting/.test(q)) {
    if (!chips.some(c => c.label.includes("17"))) {
      chips.push({ label: "Prop 17 (2020)", hint: "Parolee voting rights", slug: "ca-prop-17-2020" });
    }
  }

  return chips;
}


