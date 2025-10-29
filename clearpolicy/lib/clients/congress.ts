export const congress = {
  async searchBills(query: string) {
    const key = process.env.CONGRESS_API_KEY;
    if (!key || key === "your_api_data_gov_key") {
      throw new Error("Missing CONGRESS_API_KEY");
    }
    const url = new URL("https://api.congress.gov/v3/bill");
    url.searchParams.set("api_key", key);
    url.searchParams.set("format", "json");
    url.searchParams.set("query", query);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Congress.gov search failed");
    return res.json();
  },
  async billDetail(congressNum: string, billType: string, billNumber: string) {
    const key = process.env.CONGRESS_API_KEY;
    if (!key || key === "your_api_data_gov_key") {
      throw new Error("Missing CONGRESS_API_KEY");
    }
    const url = new URL(`https://api.congress.gov/v3/bill/${congressNum}/${billType}/${billNumber}`);
    url.searchParams.set("api_key", key);
    url.searchParams.set("format", "json");
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Congress.gov billDetail failed");
    return res.json();
  },
};


