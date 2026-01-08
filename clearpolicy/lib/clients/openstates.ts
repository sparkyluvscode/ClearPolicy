const BASE = "https://v3.openstates.org";
export async function os(path: string, params: Record<string, string>) {
  const key = process.env.OPENSTATES_API_KEY as string | undefined;
  if (!key || key === "your_openstates_key") {
    // Return empty results instead of throwing - allows graceful degradation
    return { results: [] };
  }
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", key);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    // Return empty results on error instead of throwing
    return { results: [] };
  }
  return res.json();
}
export const openstates = {
  searchBills: (q: string, state = "ca") => os("/bills", { q, jurisdiction: state.toUpperCase() }),
  billById: (id: string) => os(`/bills/${id}`, {}),
  searchByIdentifier: (identifier: string, state = "ca") => os("/bills", { identifier, jurisdiction: state.toUpperCase() }),
  searchBySubject: (subject: string, state = "ca") => os("/bills", { subject, jurisdiction: state.toUpperCase() }),
};


