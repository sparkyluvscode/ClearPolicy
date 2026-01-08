# Bill & Proposition Functionality Checklist

This checklist ensures that any bill or proposition search and display works correctly across the application.

## ✅ Search Functionality

### Pattern Recognition
- [ ] **California Propositions**: `prop 50`, `Prop 50`, `proposition 50`, `Proposition 50`
  - Pattern: `/prop\s*(\d{1,3})/` (matches 1-3 digits)
  - Should create virtual result with `_virtual: "prop"` and `propNum`
  - Should generate link to `/measure/prop/{number}`
  
- [ ] **California Assembly Bills**: `AB 5`, `ab 5`, `Assembly Bill 5`
  - Pattern: `/\b(ab|sb)\s*(\d{1,5})\b/` (matches AB/SB with 1-5 digits)
  - Should search OpenStates by identifier
  - Should fallback to CA LegInfo if no OpenStates match
  
- [ ] **California Senate Bills**: `SB 1383`, `sb 1383`, `Senate Bill 1383`
  - Same pattern as AB bills
  - Should handle multiple bills with same number (e.g., SB 1383 2016 vs 2020)
  
- [ ] **Federal House Bills**: `HR 50`, `H.R. 50`, `House Bill 50`, `hr 50`
  - Should search Congress.gov API
  - Should format as `{congress}:hr:{number}` for detail view
  
- [ ] **Federal Senate Bills**: `S 50`, `S. 50`, `Senate Bill 50`, `s 50`
  - Should search Congress.gov API
  - Should format as `{congress}:s:{number}` for detail view

### Search API (`/api/search`)
- [ ] Accepts query parameter `q`
- [ ] Returns structure: `{ chips, ca: { results }, us: { bills }, fallbacks }`
- [ ] Handles empty queries gracefully
- [ ] Handles API errors gracefully (returns empty arrays, doesn't crash)
- [ ] Creates virtual proposition results for `prop {number}` patterns
- [ ] Creates virtual bill results for `AB/SB {number}` patterns when OpenStates fails
- [ ] Ranks and deduplicates CA results
- [ ] Marks direct matches with `_direct: true`
- [ ] Provides `_reason` for why each result is shown
- [ ] Includes fallback links to external sources (Ballotpedia, LAO, etc.)

### Search UI (`app/page.tsx`)
- [ ] Form submission triggers `doSearch()` function
- [ ] Search input updates state correctly
- [ ] Loading state shows "Searching…" during API call
- [ ] Results section appears when `showResults` is true
- [ ] Results display correctly for:
  - CA direct matches (top pick with emerald border)
  - CA related matches
  - US federal bills
  - Disambiguation chips
- [ ] Links in results navigate correctly:
  - Virtual props → `/measure/prop/{number}`
  - OpenStates bills → `/measure/live?source=os&id={id}`
  - Congress bills → `/measure/live?source=congress&id={congress}:{type}:{number}`
  - External URLs → opens in new tab

## ✅ Routing & Navigation

### Proposition Routes (`/measure/prop/[num]`)
- [ ] Route accepts numeric proposition number
- [ ] Strips non-numeric characters from param
- [ ] Handles missing/invalid numbers gracefully
- [ ] Fetches data from `/api/prop/{num}` endpoint
- [ ] Displays proposition title: "California Proposition {num}"
- [ ] Shows links to LAO and LegInfo
- [ ] Renders `ProvisionalCard` component with summary

### Live Measure Routes (`/measure/live`)
- [ ] Accepts `source` parameter: `os` or `congress`
- [ ] Accepts `id` parameter (format depends on source)
- [ ] Validates parameters before fetching
- [ ] Fetches from `/api/measure?source={source}&id={id}`
- [ ] Handles missing data gracefully
- [ ] Displays `LiveMeasureCard` component

### Slug-based Routes (`/measure/[slug]`)
- [ ] Accepts slug format: `{jurisdiction}-{number}-{year?}`
- [ ] Looks up measure in database
- [ ] Handles missing measures gracefully
- [ ] Displays summaries with reading level toggle

## ✅ API Endpoints

### `/api/search`
- [ ] Validates query parameter
- [ ] Calls `disambiguate()` for chips
- [ ] Calls `openstates.searchBills()` for CA results
- [ ] Calls `congress.searchBills()` for US results
- [ ] Handles API failures gracefully
- [ ] Creates virtual results for patterns
- [ ] Returns proper JSON structure

### `/api/prop/[num]`
- [ ] Extracts numeric proposition number
- [ ] Fetches from Ballotpedia: `https://ballotpedia.org/California_Proposition_{num}`
- [ ] Fetches from LAO: `https://lao.ca.gov/BallotAnalysis/Propositions`
- [ ] Extracts TL;DR from meta description or first paragraph
- [ ] Extracts pros/cons from support/opposition sections
- [ ] Returns: `{ number, sources: { ballotpedia, lao }, tldr, pros, cons }`
- [ ] Handles fetch errors gracefully

### `/api/measure`
- [ ] Validates `source` and `id` parameters
- [ ] For `source=os`: calls `openstates.billById(id)`
- [ ] For `source=congress`: parses `{congress}:{type}:{number}` and calls `congress.billDetail()`
- [ ] Returns: `{ kind, jurisdiction, raw, error? }`
- [ ] Handles API failures gracefully

## ✅ Data Processing

### Pattern Matching
- [ ] Proposition numbers: 1-999 (3 digits max)
- [ ] CA bill numbers: 1-99999 (5 digits max)
- [ ] Federal bill numbers: variable length
- [ ] Handles case-insensitive matching
- [ ] Handles variations: "Prop", "Proposition", "prop", "PROP"

### Result Ranking
- [ ] Exact title match: +100 points
- [ ] Title contains query: +40 points
- [ ] Proposition number match: +30 points
- [ ] Recent updates: +0-20 points (based on date)
- [ ] Appropriation bills: -30 points (de-boost)
- [ ] Short titles: -5 points
- [ ] Results sorted by score (highest first)

### Result Enrichment
- [ ] Adds `_direct` flag for direct matches
- [ ] Adds `_reason` explaining why result is shown
- [ ] Adds `_preview` from latest action or classification
- [ ] Adds `_score` for ranking
- [ ] Filters out weak results (score < 20 unless direct match)

## ✅ Error Handling

### API Failures
- [ ] OpenStates API failure → returns empty results array
- [ ] Congress.gov API failure → returns empty bills array
- [ ] Ballotpedia fetch failure → returns null source URL
- [ ] LAO fetch failure → returns null source URL
- [ ] All failures logged to console but don't crash app

### Invalid Input
- [ ] Empty query → no search performed
- [ ] Invalid proposition number → shows error message
- [ ] Missing route parameters → shows appropriate error
- [ ] Invalid bill ID format → shows error message

### Missing Data
- [ ] No search results → shows "No results" message with suggestions
- [ ] No summaries available → shows "No summaries" message
- [ ] Missing measure in database → shows "Measure not found"

## ✅ Edge Cases

### Proposition Edge Cases
- [ ] Single digit: `prop 5` ✓
- [ ] Double digit: `prop 50` ✓
- [ ] Triple digit: `prop 999`
- [ ] With year: `prop 47 2014` (should still match)
- [ ] With extra text: `prop 50 california` (should still match)
- [ ] Case variations: `PROP 50`, `Prop 50`, `prop 50`

### Bill Edge Cases
- [ ] CA bills with same number different years: `SB 1383` (2016 vs 2020)
- [ ] Federal bills without congress number (defaults to 118)
- [ ] Bills with leading zeros: `HR 0050` vs `HR 50`
- [ ] Bills with special characters in title

### Search Edge Cases
- [ ] Very long queries (should truncate or handle gracefully)
- [ ] Special characters in query (should encode properly)
- [ ] Multiple patterns in one query: `prop 50 and AB 5`
- [ ] Empty search after typing
- [ ] Rapid successive searches (should cancel previous)

## ✅ UI/UX

### Search Interface
- [ ] Search box is accessible (proper labels, ARIA attributes)
- [ ] Search button is accessible
- [ ] Loading state is clear
- [ ] Results appear below search form
- [ ] Results are clearly labeled (CA vs US)
- [ ] Top pick is visually distinct (emerald border)
- [ ] Links are clearly clickable
- [ ] External links open in new tab with proper rel attributes

### Results Display
- [ ] Direct matches shown first
- [ ] Related matches shown in "See also" section
- [ ] Each result shows:
  - Title/identifier
  - Match reason
  - Preview text
  - Classification tags
  - Action link
- [ ] Disambiguation chips appear when multiple options exist
- [ ] Fallback links appear when no direct matches

### Page Display
- [ ] Proposition pages show correct title
- [ ] Proposition pages show source links
- [ ] Proposition pages show summary content
- [ ] Live measure pages show bill details
- [ ] Reading level toggle works (5th, 8th, 12th grade)
- [ ] Citations are properly formatted
- [ ] Source meter shows accurate source ratio

## ✅ Testing Scenarios

### Test These Searches
1. `prop 50` → Should show Prop 50 result, link to `/measure/prop/50`
2. `Prop 47` → Should show Prop 47 result
3. `AB 5` → Should show Assembly Bill 5 results
4. `SB 1383` → Should show Senate Bill 1383 (may have multiple)
5. `HR 50` → Should show House Resolution 50 results
6. `S 50` → Should show Senate Bill 50 results
7. `proposition 17` → Should match Prop 17
8. `california prop 50` → Should match Prop 50
9. `retail theft` → Should show related bills (Prop 47, etc.)
10. `95014` → Should trigger ZIP lookup (different feature)

### Test These Routes
1. `/measure/prop/50` → Should display Prop 50 page
2. `/measure/prop/999` → Should display Prop 999 page (even if doesn't exist)
3. `/measure/live?source=os&id={id}` → Should display OpenStates bill
4. `/measure/live?source=congress&id=118:hr:50` → Should display Congress bill
5. `/measure/ca-prop-47-2014` → Should display seeded measure if exists

## ✅ Performance

- [ ] Search API responds in < 2 seconds
- [ ] Results render without lag
- [ ] Page navigation is smooth
- [ ] No unnecessary re-renders
- [ ] API calls are debounced for suggestions
- [ ] Previous API calls are cancelled when new search starts

## ✅ Accessibility

- [ ] All form inputs have labels
- [ ] All buttons have accessible names
- [ ] Search results have proper ARIA roles
- [ ] Links have descriptive text
- [ ] Error messages are announced
- [ ] Loading states are announced
- [ ] Keyboard navigation works
- [ ] Focus management is correct

## ✅ Documentation

- [ ] Code comments explain pattern matching logic
- [ ] API routes have clear parameter documentation
- [ ] Component props are typed correctly
- [ ] Error messages are user-friendly

---

## Quick Verification Commands

```bash
# Test search API
curl "http://localhost:3001/api/search?q=Prop%2050"

# Test prop API
curl "http://localhost:3001/api/prop/50"

# Test measure API
curl "http://localhost:3001/api/measure?source=congress&id=118:hr:50"

# Test prop page
curl "http://localhost:3001/measure/prop/50"
```

---

## Notes

- Virtual results are created for propositions even if they don't exist in OpenStates
- CA bills fallback to LegInfo when OpenStates has no match
- Federal bills require Congress.gov API key
- Proposition pages fetch from Ballotpedia and LAO for content
- All external API calls should have error handling
- Results are ranked by relevance score
- Direct matches are prioritized over related matches

