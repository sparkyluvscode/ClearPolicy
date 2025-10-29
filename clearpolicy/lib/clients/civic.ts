export async function repsByZip(zip: string) {
  const key = process.env.GOOGLE_CIVIC_API_KEY;
  if (!key || key === "your_google_civic_key") {
    throw new Error("Missing GOOGLE_CIVIC_API_KEY");
  }
  const url = new URL("https://civicinfo.googleapis.com/civicinfo/v2/representatives");
  url.searchParams.set("key", key);
  url.searchParams.set("address", zip);
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      // Helps when the key is restricted to HTTP referrers
      Referer: base,
      Origin: base,
    },
  });
  if (!res.ok) throw new Error("Civic API failure");
  const data = await res.json();
  return {
    offices: Array.isArray(data.offices) ? data.offices : [],
    officials: Array.isArray(data.officials) ? data.officials : [],
    normalizedInput: data.normalizedInput || { line1: zip },
  };
}


