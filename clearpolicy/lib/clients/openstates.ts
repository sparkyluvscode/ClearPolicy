const BASE = "https://v3.openstates.org";
export async function os(path: string, params: Record<string, string>) {
  const key = process.env.OPENSTATES_API_KEY as string | undefined;
  if (!key) throw new Error("Missing OPENSTATES_API_KEY");
  // No dev fallback: require real key
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", key);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`OpenStates error ${res.status}`);
  return res.json();
}
export const openstates = {
  searchBills: (q: string, state = "ca") => os("/bills", { q, jurisdiction: state.toUpperCase() }),
  billById: (id: string) => os(`/bills/${id}`, {}),
  searchByIdentifier: (identifier: string, state = "ca") => os("/bills", { identifier, jurisdiction: state.toUpperCase() }),
};


