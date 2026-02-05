# ClearPolicy: Path to "All Policy"

This doc outlines how to evolve ClearPolicy from **California + federal** to **all US policy** (all states, federal, and eventually local) while keeping the codebase maintainable and the UX consistent.

---

## 1. Where We Are Today

| Layer | Current scope | Notes |
|-------|----------------|------|
| **State legislation** | California only | OpenStates calls hardcode `jurisdiction: "ca"`. UI labels say "California (Open States)". |
| **Federal legislation** | Congress.gov | Search + bill detail work. Shown as "Federal (Congress.gov)". |
| **Ballot measures** | CA propositions only | `/measure/prop/[num]` + Ballotpedia/LAO/known-summaries are CA-specific. No "Prop 5 (Texas)" etc. |
| **Search** | CA state + federal | Fast paths for "prop N", "AB N", "SB N" assume CA. Topic search only hits CA. |
| **Identity** | Mixed | Some `ca-prop-17-2020`, OpenStates IDs, `congress:type:number`. No single canonical schema across jurisdictions. |

So today we effectively have **two** policy universes: California state (+ props) and US federal. "All policy" means adding the other 49 states (and DC, territories) in a coherent way.

---

## 2. What "All Policy" Means (Scope)

- **Phase 1 – All state legislation (bills)**  
  Any state’s bills searchable and viewable (e.g. "Texas HB 1", "NY S 1234"). Same UX as today but jurisdiction-aware (state name in labels, links to that state’s official site).

- **Phase 2 – Federal (already done)**  
  Keep Congress.gov as-is; ensure it’s first-class in search and detail (no CA bias in ranking when query is federal).

- **Phase 3 – State ballot measures beyond CA**  
  Other states have initiatives/referenda (e.g. Colorado, Oregon). Need data source(s) and a generic "state + number + year" model instead of a CA-only prop route.

- **Phase 4 (optional) – Local / municipal**  
  City/county ordinances, school boards, etc. OpenStates has some experimental municipal support; otherwise new data sources.

For a first step, **Phase 1 + clear federal treatment** gets us to "all state + federal legislation" without touching ballot measures yet.

---

## 3. Data Layer (What We Already Have)

- **OpenStates API v3**  
  Supports **all 50 states + DC + Puerto Rico**. We already use:
  - `searchBills(q, jurisdiction)`
  - `searchByIdentifier(ident, jurisdiction)`
  - `searchBySubject(subject, jurisdiction)`
  - `billById(id)`  
  So the **only** change needed for multi-state bills is to stop hardcoding `"ca"` and pass jurisdiction from query or config.

- **Congress.gov API v3**  
  Federal only. No change for "all policy" except how we mix it with state results (ranking, filters).

- **Ballot measures**  
  CA: Ballotpedia URLs + LAO + known-summaries. Other states: would need a similar pattern (Ballotpedia has other states; we don’t yet have a generic "state proposition" fetcher).

So for **all state + federal legislation**, we don’t need new APIs—we need **jurisdiction inference** and **multi-jurisdiction search**.

---

## 4. Key Design Decisions

### 4.1 Canonical measure identity

Today we have:

- CA props: `ca-prop-17-2020`, or `/measure/prop/17?year=2020` (CA implied).
- OpenStates bills: OpenStates’ opaque ID (e.g. `obcid-xxx`).
- Federal: `118:hr:4369` (congress:type:number).

For "all policy" we should standardize on a **measure key** that encodes jurisdiction and type, e.g.:

- `us:federal:118:hr:4369`
- `us:ca:bill:obcid-xxx` or `us:ca:bill:2023:ab:5`
- `us:ca:prop:17:2020`
- `us:tx:bill:...` (future)

So: **one canonical ID per measure**, and URLs can map to it (e.g. `/measure/[measureKey]` or keep current paths and map them to measure keys under the hood). This will matter for search result deduping, deep links, and analytics.

### 4.2 Jurisdiction inference from query

To search "all policy" we need to know **which jurisdictions** to query. Options:

- **Infer from query:**  
  - "Prop 17" → today we assume CA; we could keep that as default but allow "TX Prop 7" later.  
  - "AB 5" → in many states "AB" = Assembly Bill (CA, NY, …); we could search CA first, then others, or use state abbreviations if present ("CA AB 5", "NY AB 5").  
  - "HB 1 Texas" / "Texas HB 1" → state=TX, then OpenStates bills for TX.  
  - "H.R. 50" / "S. 100" → federal (Congress).  
- **Explicit filters:**  
  Later: "State: California", "State: All", "Federal only" in the UI so the user can narrow.

For Phase 1, a simple approach:

- If the query looks **federal** (H.R., S., congress, senate, house, federal) → search Congress only (or Congress first).
- If the query contains a **state abbreviation** (e.g. TX, NY, FL) or full name → search that state (and optionally federal).
- Otherwise → search **multiple jurisdictions**: e.g. CA + federal (current behavior), or "top N states" + federal. We can start with CA + federal and add more states incrementally (e.g. TX, NY, FL) to avoid latency.

### 4.3 Search API shape

Current response: `{ ca: { results }, us: { bills }, fallbacks, chips, aiFallback }`.

For "all policy" we have two options:

- **Option A – Keep CA + US, add "other states":**  
  e.g. `{ ca, us, otherStates?: { [stateCode]: { results } }, fallbacks, chips, aiFallback }`.  
  UI can show "California", "Federal", "Texas", etc. as separate sections. Minimal change to existing frontend; we add new keys.

- **Option B – Single list with jurisdiction tags:**  
  `{ measures: Array<{ jurisdiction, id, title, ... }>, fallbacks, chips }`.  
  One list, sorted by relevance; each item has `jurisdiction: "CA" | "US" | "TX" | ...`.  
  Cleaner long-term but requires more frontend refactor.

Recommendation: **Option A for Phase 1** (add `otherStates` and optionally a `states` array of state codes we searched). This preserves current behavior and adds other states without breaking the existing UI. We can migrate to Option B later if we want a single ranked list.

### 4.4 Detail pages and deep links

- **Federal:** Already have `/measure/live?source=congress&id=...`. Keep it; eventually we could add a pretty URL like `/measure/us/118/hr/4369`.
- **State bills (any state):** Already have `/measure/live?source=os&id=...`. OpenStates IDs are global, so the same route works for CA, TX, etc. We only need to **label** the jurisdiction (e.g. "Texas HB 1") and link to the correct state’s LegInfo-equivalent (e.g. Texas Legislature Online).
- **State propositions:**  
  - CA: keep `/measure/prop/[num]?year=...` (or slug `ca-prop-17-2020`).  
  - Other states: add a generic route, e.g. `/measure/state/[state]/prop/[num]?year=...`, and a data layer that can fetch Ballotpedia (or other) for that state. Phase 3.

So for Phase 1 we don’t need new detail page routes—we need **search** to return bills from more states and **UI** to show which state each result is from and link to the right external site.

---

## 5. Implementation Phases (Concrete)

### Phase 1 – Multi-state bills (no new APIs)

1. **Jurisdiction helper**  
   Add a small module (e.g. `lib/jurisdiction.ts`) that:
   - Parses state abbreviation or name from the query (e.g. "TX", "Texas", "Florida").
   - Returns a list of jurisdictions to search: e.g. `["ca"]`, `["tx"]`, `["ca", "us"]`, `["us"]` (federal only).
   - Default when nothing is detected: `["ca", "us"]` (current behavior).

2. **Search API**  
   - Use the helper to get `jurisdictions: string[]` (e.g. `["ca", "us"]` or `["tx", "us"]`).
   - For each state in `jurisdictions`, call OpenStates with that state code (e.g. `openstates.searchBills(q, "tx")`). Keep federal search as today.
   - Build response: keep `ca` and `us` for backward compatibility. If we searched other states, add `otherStates: { tx: { results }, ... }` or a flat list with a `jurisdiction` field per item so the UI can show "Texas", "New York", etc.
   - Preserve existing fast paths (e.g. "prop 17" → CA prop) but scope them by inferred jurisdiction when we have state in query.

3. **UI**  
   - Replace the single "California (Open States)" section with jurisdiction-aware sections: "California", "Federal", and if present "Texas", "New York", etc., each showing that jurisdiction’s results. Reuse the same card component; only the section title and optional "View on [State] Legislature" link change.
   - Ensure bill links still use `/measure/live?source=os&id=...` (works for any state). Add a helper to get "official bill URL" by state (e.g. Texas: capitol.texas.gov, NY: nysenate.gov, etc.) for the card or detail page.

4. **Measure API**  
   - `/api/measure` already takes `source=os` and OpenStates ID. No change; OpenStates IDs are global. Optionally add a `jurisdiction` in the response so the UI can show "Texas" vs "California".

5. **Deploy / config**  
   - No new env vars. Optionally add a list of "default states to search" when no state is in the query (e.g. `CA,TX,NY`) so we gradually expand beyond CA without changing UX.

### Phase 2 – Federal first-class

- When the query is clearly federal, search only Congress (or Congress first) and rank federal results higher.
- In the UI, when we have both state and federal results, consider a tab or section order that doesn’t always put CA first (e.g. "Federal" first when the query is "H.R. 50").

### Phase 3 – State ballot measures (beyond CA)

- Add a generic "state proposition" data path: e.g. state code + prop number + year → Ballotpedia (or other) URL pattern per state.
- New route or extend current: e.g. `/measure/prop/[num]?year=...&state=ca` (default state=ca), or `/measure/state/[state]/prop/[num]`.
- Known-summaries and LAO are CA-specific; other states would rely on Ballotpedia + AI fallback until we have more curated content.

### Phase 4 – Local (later)

- Depends on data (OpenStates municipal, or other). Likely a separate "Local" section and filters.

---

## 6. File-Level Checklist (Phase 1)

- **`lib/jurisdiction.ts`** (new): Parse state from query; return list of jurisdictions to search.
- **`lib/clients/openstates.ts`**: No change (already accepts jurisdiction).
- **`app/api/search/route.ts`**: Use jurisdiction helper; call OpenStates for each state; add `otherStates` (or normalized list) to response; keep CA and US keys for backward compatibility.
- **`app/page.tsx`**: Render "California", "Federal", and any other states’ results with correct labels and official links.
- **`app/api/measure/route.ts`**: Optionally add jurisdiction in response for OS bills (can derive from bill data or OpenStates).
- **Docs**: Link this strategy in README or CONTRIBUTING so future work stays aligned.

---

## 7. Success Criteria for "All Policy" (Phase 1)

- User can search "Texas HB 1" or "Florida education" and see results from that state.
- User can open a state bill (any state) and see summary + link to that state’s official site.
- Existing CA and federal behavior unchanged; no regression.
- Clear path to add more states (config or query) without new APIs.

Once Phase 1 is done, we can iterate on ranking, default state list, and then Phase 3 (state propositions) so ClearPolicy truly works for "all policy" across the US.
