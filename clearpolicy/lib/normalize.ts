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
  if (/prop\s*17/.test(q) && /theft|retail|shoplift/.test(q)) {
    chips.push(
      { label: "Prop 17 (2020)", hint: "voting rights for people on parole", slug: "ca-prop-17-2020" },
      { label: "Prop 47 (2014)", hint: "theft & drug penalties ($950)", slug: "ca-prop-47-2014" }
    );
  }
  const m = q.match(/prop\s*(\d{1,3})/);
  if (m) {
    const n = m[1];
    // We only have seeded cards for 17 and 47; for others, nudge the user
    if (n !== "17" && n !== "47") {
      chips.push({ label: `California Proposition ${n}`, hint: "Open live legislative summaries", slug: undefined });
    }
  }
  return chips;
}


