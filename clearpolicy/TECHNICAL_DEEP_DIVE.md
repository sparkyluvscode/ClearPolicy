# ClearPolicy: Comprehensive Technical Deep Dive
## How It Works, From Concept to Code

---

## Table of Contents

1. [Executive Summary: What is ClearPolicy?](#executive-summary)
2. [System Architecture Overview](#system-architecture)
3. [The Search System: How Users Find Information](#search-system)
4. [Data Flow: From Query to Results](#data-flow)
5. [API Integration Layer](#api-integration)
6. [The Reading Level System](#reading-level-system)
7. [Citation and Source Tracking](#citation-system)
8. [Database Schema and Data Storage](#database-schema)
9. [Frontend Architecture and React Components](#frontend-architecture)
10. [State Management and User Interactions](#state-management)
11. [The Disambiguation System](#disambiguation-system)
12. [Virtual Results and Fallback Strategies](#virtual-results)
13. [ZIP Code Lookup and Local Lens](#zip-lookup)
14. [Testing Infrastructure](#testing-infrastructure)
15. [Conclusion: How It All Fits Together](#conclusion)

---

## Executive Summary: What is ClearPolicy? {#executive-summary}

ClearPolicy is a non-partisan civic education web application designed to make government policy accessible to everyone, especially students and first-time voters. The core problem it solves is that ballot measures, bills, and propositions are written in dense legal language that most people find difficult to understand. ClearPolicy addresses this by:

1. **Providing Plain-English Summaries**: Converting complex legal text into understandable language
2. **Multiple Reading Levels**: Adjusting text complexity to 5th, 8th, or 12th grade reading levels
3. **Source Transparency**: Every claim is linked to official sources with line-referenced citations
4. **Comprehensive Search**: Users can search for any proposition, bill, or act by number, name, or topic
5. **Disambiguation**: When searches are ambiguous (e.g., "prop 17 retail theft"), the system helps users choose between similar measures
6. **Local Representation Lookup**: Finding local representatives by ZIP code

The application is built as a Next.js 14 web application using TypeScript, React, and Tailwind CSS. It integrates with three government APIs (Congress.gov, Open States, and Google Civic Information) to fetch real-time legislative data, while maintaining a local SQLite database for curated content.

---

## System Architecture Overview {#system-architecture}

ClearPolicy follows a modern full-stack architecture pattern using Next.js 14's App Router:

### Technology Stack

**Frontend:**
- **Next.js 14** with App Router for server-side rendering and routing
- **React 18** with TypeScript for component-based UI
- **Tailwind CSS** for utility-first styling
- **Client-side state management** using React hooks (useState, useEffect, useMemo)

**Backend:**
- **Next.js API Routes** (serverless functions) for backend logic
- **Prisma ORM** with SQLite database for data persistence
- **Zod** for runtime type validation and schema validation

**External Integrations:**
- **Open States API v3** for California state bills and propositions
- **Congress.gov API v3** for federal bills and acts
- **Google Civic Information API** for representative lookup by ZIP code

### Application Structure

The application is organized into several key directories:

```
clearpolicy/
├── app/                    # Next.js App Router pages and API routes
│   ├── page.tsx           # Homepage (main search interface)
│   ├── api/               # API endpoints
│   │   ├── search/        # Search endpoint
│   │   ├── measure/       # Measure detail endpoint
│   │   ├── prop/          # Proposition endpoint
│   │   └── zip/           # ZIP code lookup endpoint
│   └── measure/           # Measure detail pages
├── components/             # React components
│   ├── BillCard.tsx       # Displays measure summaries
│   ├── LiveMeasureCard.tsx # Detailed measure view
│   ├── DisambiguatorChips.tsx # Ambiguity resolution UI
│   └── ReadingLevelToggle.tsx # Reading level selector
├── lib/                    # Core business logic
│   ├── clients/           # API client wrappers
│   ├── normalize.ts      # Query normalization and disambiguation
│   ├── reading.ts         # Text simplification engine
│   └── citations.ts      # Citation parsing and source tracking
└── prisma/                # Database schema and migrations
```

### Request Flow

When a user searches for something, here's the high-level flow:

1. **User Input**: User types a query (e.g., "Prop 50") in the homepage search form
2. **Frontend Processing**: React component captures the input and calls the search API
3. **API Route**: Next.js API route (`/api/search`) receives the query
4. **Query Normalization**: Query is normalized (e.g., "Proposition 50" → "Prop 50")
5. **Parallel API Calls**: System searches both California (Open States) and federal (Congress.gov) APIs simultaneously
6. **Result Processing**: Results are ranked, deduplicated, and enriched with metadata
7. **Virtual Results**: If no results found, system creates "virtual" results for propositions
8. **Response**: JSON response sent back to frontend with results, chips, and fallback links
9. **UI Rendering**: Frontend displays results using React components

---

## The Search System: How Users Find Information {#search-system}

The search system is the heart of ClearPolicy. It's designed to handle a wide variety of query types and provide intelligent results even when exact matches aren't found.

### Query Types Supported

The search system recognizes and handles several query patterns:

1. **Proposition Numbers**: "Prop 50", "Proposition 17", "prop 47"
2. **Bill Identifiers**: "AB 5", "SB 1383", "H.R. 50", "S. 50"
3. **Topic Searches**: "health", "education", "climate", "crime"
4. **Federal Acts**: "Affordable Care Act", "ACA", "NDAA"
5. **ZIP Code Queries**: "who's my rep for 95014", "representative 95762"

### The Search API Route (`app/api/search/route.ts`)

The search endpoint is a Next.js API route that processes queries and returns structured results. Let's break down how it works:

#### Step 1: Query Validation and Normalization

```typescript
const q = req.nextUrl.searchParams.get("q") ?? "";
const parsed = QuerySchema.safeParse({ q });
if (!parsed.success) return NextResponse.json({ error: "invalid query" }, { status: 400 });

// Normalize "Proposition" to "Prop" for better matching
let normalizedQuery = parsed.data.q.replace(/\bproposition\s+(\d+)/gi, "Prop $1");
```

The system first validates the query using Zod schema validation, then normalizes common variations (e.g., "Proposition" → "Prop") to improve matching.

#### Step 2: Special Query Detection

The system detects special query types before general searching:

**ZIP Code Detection:**
```typescript
const zipMatch = parsed.data.q.match(/(?:who'?s?\s+my\s+rep(?:resentative)?|rep(?:resentative)?)\s+(?:for\s+)?(\d{5})/i);
if (zipMatch) {
  const zip = zipMatch[1];
  return NextResponse.json({ 
    zipCode: zip,
    redirectToZip: true,
    // ... empty results
  });
}
```

If a user asks "who's my rep for 95014", the system extracts the ZIP code and returns a special response that the frontend uses to trigger the ZIP lookup panel.

**Bill Identifier Detection:**
```typescript
const identMatch = normalizedQuery.toLowerCase().match(/\b(ab|sb)\s*(\d{1,5})\b/);
if (identMatch) {
  const ident = `${identMatch[1].toUpperCase()} ${identMatch[2]}`;
  // Search by identifier first for exact matches
}
```

For queries like "AB 5" or "SB 1383", the system first tries to find exact matches by identifier before falling back to text search.

#### Step 3: Parallel API Searches

The system searches both California and federal sources simultaneously for efficiency:

```typescript
const [ca, us] = await Promise.all([
  openstates.searchBills(normalizedQuery, "ca").catch(() => ({ results: [] })),
  congress.searchBills(normalizedQuery).catch(() => ({ data: { bills: [] } })),
]);
```

Using `Promise.all()` ensures both searches happen concurrently, reducing total response time. Each API call is wrapped in error handling that returns empty results instead of throwing errors, enabling graceful degradation.

#### Step 4: Topic-Based Search Strategies

For topic searches (e.g., "health", "education"), the system employs multiple fallback strategies:

1. **Subject-Based Search**: Maps common topics to OpenStates subject terms:
   ```typescript
   const topicMap: Record<string, string> = {
     "healthcare": "Health",
     "education": "Education",
     "environment": "Environment",
     // ...
   };
   ```

2. **Multiple Text Search Strategies**: If subject search fails, tries variations:
   ```typescript
   const searchStrategies = [
     `California ${parsed.data.q}`,
     parsed.data.q.charAt(0).toUpperCase() + parsed.data.q.slice(1),
     parsed.data.q + " policy",
     parsed.data.q + " legislation",
     // ...
   ];
   ```

3. **Filtering and Ranking**: Results are filtered to ensure relevance:
   ```typescript
   const filtered = recentSearch.results.filter((r: any) => {
     const allText = `${title} ${identifier} ${subjects} ${classification} ${latestAction}`;
     return allText.includes(ql) || allText.includes(parsed.data.q.toLowerCase());
   });
   ```

#### Step 5: Result Ranking and Deduplication

Results are scored and ranked based on relevance:

```typescript
const score = (r: any) => {
  let s = 0;
  if (title === ql) s += 100;  // Exact title match
  if (title.includes(ql)) s += 40;  // Title contains query
  // Prop number detection boosts
  const m = ql.match(/prop\s*(\d+)/);
  if (m && /proposition\s*\d+/.test(title)) s += 30;
  // Recency boost
  const updated = Date.parse(r?.updated_at || "");
  if (!isNaN(updated)) s += Math.min(20, /* recency calculation */);
  return s;
};
```

Results are then:
1. **Deduplicated** by title/identifier
2. **Sorted** by score (highest first)
3. **Enriched** with metadata (_direct, _reason, _preview)
4. **Partitioned** into "direct matches" and "related results"

#### Step 6: Virtual Results for Propositions

If a user searches for a proposition number (e.g., "Prop 50") but no results are found in the database, the system creates a "virtual" result:

```typescript
const m = ql.match(/(?:prop|proposition)\s*(\d{1,3})/);
if (m) {
  const n = m[1];
  const virtual = {
    id: `prop-${n}-virtual`,
    identifier: `California Proposition ${n}`,
    title: `California Proposition ${n}`,
    _virtual: "prop",
    propNum: n,
    _direct: true,
    _reason: `Shown because it matches Proposition ${n}.`,
    // ...
  };
  (ca as any).results = [virtual, ...arr];
}
```

This ensures users always get a result for any proposition number, even if it's not in the database. The virtual result links to trusted sources like Ballotpedia and the Legislative Analyst's Office.

#### Step 7: Fallback Links

The system always provides trusted fallback links to official sources:

```typescript
const fallbacks: Array<{ label: string; url: string; hint: string; kind: "overview" | "official" | "analysis" }> = [];

push("Open States (California)", `https://v3.openstates.org/?subject=${encodeURIComponent(parsed.data.q)}`, "State bill records", "official");
push("Congress.gov", `https://www.congress.gov/search?q=${encodeURIComponent(parsed.data.q)}`, "Federal legislation", "official");
push("Ballotpedia", `https://ballotpedia.org/wiki/index.php?search=${encodeURIComponent(parsed.data.q)}`, "Ballot measures overview", "overview");
```

These fallbacks ensure users always have a path to find information, even if the API search returns no results.

---

## Data Flow: From Query to Results {#data-flow}

Understanding the complete data flow helps explain how all the pieces fit together.

### Frontend: User Interaction (`app/page.tsx`)

The homepage is a React client component that manages search state and UI:

```typescript
export default function HomePage() {
  const [q, setQ] = useState("");  // Search query
  const [results, setResults] = useState({ ca: {}, us: {}, fallbacks: [] });
  const [chips, setChips] = useState([]);  // Disambiguation chips
  const [loading, setLoading] = useState(false);
  // ...
}
```

#### Search Form Submission

When a user submits the search form:

```typescript
onSubmit={async (e) => {
  e.preventDefault();
  const input = form.querySelector('input[type="text"]') as HTMLInputElement;
  const query = input?.value?.trim() || q.trim();
  if (query) {
    setQ(query);
    await doSearch(query);
  }
}}
```

The form handler:
1. Prevents default form submission
2. Reads the query directly from the input (to avoid stale state)
3. Updates the `q` state
4. Calls `doSearch()` function

#### The `doSearch()` Function

This function orchestrates the search process:

```typescript
async function doSearch(query: string) {
  setLoading(true);
  try {
    const url = new URL("/api/search", window.location.origin);
    url.searchParams.set("q", trimmedQuery);
    const res = await fetch(url.toString());
    const data = await res.json();
    
    // Handle ZIP code redirect
    if (data.redirectToZip && data.zipCode) {
      // Trigger ZIP panel lookup
      return;
    }
    
    // Normalize results structure
    const caResults = Array.isArray(data.ca?.results) ? data.ca.results : [];
    const usBillsData = Array.isArray(data.us?.bills) ? data.us.bills : [];
    
    // Update state
    setChips(data.chips || []);
    setResults({ ca: { results: caResults }, us: { bills: usBillsData }, fallbacks: data.fallbacks || [] });
    setQ(trimmedQuery);
  } catch (error) {
    // Error handling
  } finally {
    setLoading(false);
  }
}
```

The function:
1. Sets loading state
2. Constructs the API URL with query parameter
3. Fetches from `/api/search` endpoint
4. Handles special cases (like ZIP code queries)
5. Normalizes the response structure (handles different API response formats)
6. Updates React state with results
7. Handles errors gracefully

#### Result Display Logic

The component uses `useMemo` to derive display state:

```typescript
const { caResultsArray, usBillsArray, fallbacksArray, hasCaResults, hasUsResults, hasFallbacks } = useMemo(() => {
  const ca = Array.isArray(results.ca?.results) ? results.ca.results : [];
  const us = Array.isArray(results.us?.bills) ? results.us.bills : Array.isArray(results.us?.data?.bills) ? results.us.data.bills : [];
  const fb = Array.isArray(results.fallbacks) ? results.fallbacks : [];
  return {
    caResultsArray: ca,
    usBillsArray: us,
    fallbacksArray: fb,
    hasCaResults: ca.length > 0,
    hasUsResults: us.length > 0,
    hasFallbacks: fb.length > 0
  };
}, [results]);

const showResults = Boolean(currentQ && (hasCaResults || hasUsResults || hasFallbacks || chips.length > 0));
```

This ensures:
- Results are normalized regardless of API response structure
- Display flags are recalculated when results change
- The "Search Results" section only shows when there's something to display

#### Conditional Rendering

The results section is conditionally rendered:

```typescript
{showResults && (
  <section className="card p-6 animate-fade-in-up" id="search-results-section">
    <h2>Search Results</h2>
    {/* CA results */}
    {hasCaResults ? (
      <ul>
        {caDirect.map((r: any, i: number) => (
          <BillCard key={i} data={r} />
        ))}
      </ul>
    ) : (
      <p>No California results</p>
    )}
    {/* US results */}
    {/* Fallback links */}
  </section>
)}
```

Results are partitioned into:
- **Direct matches**: Results that exactly match the query (shown first with "Top pick" badge)
- **Related results**: Results that are related but not exact matches (shown in "See also" section)

---

## API Integration Layer {#api-integration}

ClearPolicy integrates with three external APIs. Each has a client wrapper that handles authentication, error handling, and response normalization.

### Open States API Client (`lib/clients/openstates.ts`)

Open States provides California state bill and proposition data:

```typescript
const BASE = "https://v3.openstates.org";

export async function os(path: string, params: Record<string, string>) {
  const key = process.env.OPENSTATES_API_KEY;
  if (!key || key === "your_openstates_key") {
    return { results: [] };  // Graceful degradation
  }
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", key);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    return { results: [] };  // Return empty instead of throwing
  }
  return res.json();
}
```

**Key Features:**
- **Graceful Degradation**: Returns empty results if API key is missing or request fails
- **No Cache**: Uses `cache: "no-store"` to ensure fresh data
- **Consistent Interface**: All methods return `{ results: [] }` structure

**Available Methods:**
- `searchBills(q, state)`: Text search for bills
- `searchByIdentifier(identifier, state)`: Exact identifier match (e.g., "AB 5")
- `searchBySubject(subject, state)`: Subject-based search
- `billById(id)`: Get bill by OpenStates ID

### Congress.gov API Client (`lib/clients/congress.ts`)

Congress.gov provides federal bill data:

```typescript
export const congress = {
  async searchBills(query: string) {
    const key = process.env.CONGRESS_API_KEY;
    if (!key || key === "your_api_data_gov_key") {
      return { data: { bills: [] } };  // Graceful degradation
    }
    const url = new URL("https://api.congress.gov/v3/bill");
    url.searchParams.set("api_key", key);
    url.searchParams.set("format", "json");
    url.searchParams.set("query", query);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return { data: { bills: [] } };
    }
    return res.json();
  },
  // ...
};
```

**Response Structure:**
Congress.gov returns `{ data: { bills: [...] } }`, which is why the frontend checks both `data.us?.bills` and `data.us?.data?.bills` to handle different response formats.

### Google Civic Information API Client (`lib/clients/civic.ts`)

Used for ZIP code lookup to find local representatives. The client follows the same graceful degradation pattern.

### Error Handling Philosophy

All API clients follow a "fail gracefully" approach:
- **Missing API Key**: Return empty results, don't crash
- **API Error**: Return empty results, log error
- **Network Error**: Return empty results, don't throw

This ensures the application remains functional even when external APIs are unavailable, though it won't have real data. The UI always shows fallback links to official sources, so users can still find information.

---

## The Reading Level System {#reading-level-system}

One of ClearPolicy's most innovative features is the reading level adjustment system. It allows users to view the same content at 5th, 8th, or 12th grade reading levels.

### The Simplification Engine (`lib/reading.ts`)

The `simplify()` function transforms text based on the target reading level:

```typescript
export function simplify(text: string, level: "5" | "8" | "12") {
  if (!text) return text;
  if (level === "12") return ensurePeriod(text);  // No simplification for 12th grade
  
  // Normalize whitespace and remove parentheticals
  let out = text
    .replace(/\s+/g, " ")
    .replace(/\((.*?)\)/g, "")
    .replace(/\butilize\b/gi, "use")
    .replace(/\bprior to\b/gi, "before")
    .replace(/\bsubsequent\b/gi, "later")
    // ... more replacements
}
```

### Simplification Strategies by Level

#### 12th Grade (Level "12")
- **No simplification**: Text is returned as-is
- Only ensures proper punctuation

#### 8th Grade (Level "8")
- **Word replacements**: Complex words replaced with simpler equivalents
- **Sentence shortening**: Long clauses broken into shorter sentences
- **"Shall" → "will"**: Legal language made more conversational

```typescript
if (level === "8") {
  sentences = sentences
    .map((s) => s.replace(/\bshall\b/gi, "will"))
    .map((s) => shortenClauses(s, 140));  // Break long clauses
}
```

#### 5th Grade (Level "5")
- **Maximum simplification**: All 8th-grade simplifications plus:
- **Sentence limit**: Maximum 2 sentences
- **Word limit**: Maximum 12 words per sentence
- **Analogy addition**: Adds simple analogies when helpful
- **Complex clause removal**: Removes "which", "that", "because" clauses

```typescript
if (level === "5") {
  sentences = sentences
    .map((s) => s.replace(/, which|, that| because/gi, ". "))  // Break complex clauses
    .map((s) => s.replace(/\bshall\b/gi, "will"))
    .map((s) => capWords(s, 12));  // Limit to 12 words
  sentences = sentences.slice(0, 2);  // Maximum 2 sentences
  
  // Add analogy
  const analogy = pickAnalogy(joined);
  out = analogy ? `${joined} ${analogy}` : joined;
}
```

### Word Replacement Dictionary

The system maintains a dictionary of complex-to-simple word replacements:

```typescript
const replacements: Array<[RegExp, string]> = [
  [/\badvertisements\b/gi, "ads"],
  [/\bregulations\b/gi, "rules"],
  [/\bprovisions\b/gi, "rules"],
  [/\blegislation\b/gi, "law"],
  [/\bauthorize\b/gi, "allow"],
  [/\brequire\b/gi, "need"],
  [/\bprohibit\b/gi, "ban"],
  [/\bpenalties\b/gi, "punishments"],
  [/\belectorate\b/gi, "voters"],
  [/\bpursuant to\b/gi, "under"],
  [/\bnotwithstanding\b/gi, "despite"],
  // ...
];
```

### Analogy System

For 5th-grade level, the system adds contextual analogies:

```typescript
function pickAnalogy(text: string): string | null {
  const t = text.toLowerCase();
  if (/budget|tax|revenue/.test(t)) 
    return "It is like a family budget: rules for how money can be used.";
  if (/advertis|disclos/.test(t)) 
    return "Think of a label on a product: this adds labels to ads so people know who paid.";
  if (/theft|crime|penal|sentenc/.test(t)) 
    return "It is like changing school rules about consequences to make them more fair.";
  if (/water|energy|environment/.test(t)) 
    return "This is like house rules to save water and power, but for the state.";
  return null;
}
```

### Integration with Components

The reading level is managed by the `ReadingLevelToggle` component and applied throughout the measure display:

```typescript
// In LiveMeasureCard.tsx
const [level, setLevel] = useState<"5" | "8" | "12">("8");

const summary = useMemo(() => {
  // ... extract content from payload
  return {
    tldr: simplify(tldr, level),
    whatItDoes: simplify(whatItDoes, level),
    whoAffected: simplify(whoAffected, level),
    pros: simplify(pros, level),
    cons: simplify(cons, level),
    // ...
  };
}, [payload, level]);  // Recalculate when level changes
```

When the user changes the reading level, the `useMemo` hook recalculates all simplified text, and React re-renders the component with the new content.

---

## Citation and Source Tracking {#citation-system}

ClearPolicy maintains strict source transparency. Every claim is linked to at least one primary source, and users can view quoted lines from sources.

### Citation Data Structure

Citations are represented as:

```typescript
type Citation = {
  quote: string;           // The quoted text from the source
  sourceName: string;      // Human-readable source name
  url: string;             // Link to the source
  location?: "tldr" | "what" | "who" | "pros" | "cons";  // Which section it supports
};
```

### Source Ratio Calculation (`lib/citations.ts`)

The "Source Meter" shows what percentage of content sections have citations:

```typescript
export function sourceRatioFrom(blocks: string[], citations: Citation[]) {
  const total = blocks.filter(Boolean).length;
  if (!total) return 0;
  
  // Count unique sections with citations
  const locations = new Set(
    (citations || []).map((c) => c.location).filter(Boolean) as string[]
  );
  if (locations.size > 0) {
    return Math.min(1, locations.size / total);
  }
  
  // Fallback: count unique source URLs
  const unique = new Set(citations.map((c) => c.url)).size;
  return Math.min(1, unique / total);
}
```

The ratio is calculated as:
- **Primary method**: Number of sections with citations / Total sections
- **Fallback method**: Number of unique source URLs / Total sections

### Citation Extraction in LiveMeasureCard

When displaying a measure, the system extracts citations from the raw data:

```typescript
const citations: Citation[] = [];

// Extract from impact clause (best source for TL;DR)
if (impactClause) {
  citations.push({
    quote: impactClause,
    sourceName: "Open States — impact clause",
    url: primaryUrl,
    location: "tldr"
  });
}

// Extract from abstract
if (abstract) {
  citations.push({
    quote: pickPolicySentence(abstract),
    sourceName: "Open States — abstract",
    url: primaryUrl,
    location: "tldr"
  });
}

// Extract from latest action
if (latestAction) {
  citations.push({
    quote: pickPolicySentence(latestAction),
    sourceName: "Open States — latest action",
    url: primaryUrl,
    location: "what"
  });
}
```

### Source Badge System

Sources are categorized and displayed with badges:

```typescript
const officialHosts = [
  "openstates.org",
  "congress.gov",
  "leginfo.legislature.ca.gov",
  "senate.ca.gov",
  "assembly.ca.gov",
  "ca.gov",
];

const isOfficial = officialHosts.some((h) => host.endsWith(h));
const badge = isOfficial ? "Official" : 
              host.endsWith("openstates.org") ? "Primary" : 
              "Analysis";
```

- **Official**: Government websites (highest trust)
- **Primary**: OpenStates aggregated data
- **Analysis**: Independent analysis or reporting

### Display in BillCard Component

The `BillCard` component displays citations with a toggle:

```typescript
const [showCitations, setShowCitations] = useState(false);

// In render:
<button onClick={() => setShowCitations((v) => !v)}>
  {showCitations ? "Hide cited lines" : "Show cited lines"}
</button>

{showCitations && (
  <div className="mt-2 space-y-3">
    {data.citations.map((c, i) => (
      <CitedLine 
        key={i} 
        quote={c.quote} 
        url={c.url} 
        sourceName={c.sourceName} 
        location={c.location} 
      />
    ))}
  </div>
)}
```

Each citation shows:
- The quoted text
- Source name with link
- Badge (Official/Primary/Analysis)
- Which section it supports

---

## Database Schema and Data Storage {#database-schema}

ClearPolicy uses Prisma ORM with SQLite for data persistence. The database stores curated measures and user feedback.

### Schema Overview (`prisma/schema.prisma`)

```prisma
model Measure {
  id           String     @id @default(cuid())
  kind         String     // "prop" or "bill"
  jurisdiction String     // "CA" or "US"
  session      String?
  number       String     // e.g., "Prop 47" or "H.R. 4369"
  title        String
  status       String?
  slug         String     @unique  // URL-friendly identifier
  sources      SourceDoc[]
  summaries    Summary[]
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}
```

**Measure Model:**
- Stores basic measure metadata
- Has relationships to `SourceDoc` and `Summary`
- `slug` is used for URL routing (e.g., `/measure/ca-prop-47-2014`)

```prisma
model SourceDoc {
  id        String  @id @default(cuid())
  measureId String
  name      String  // e.g., "Ballotpedia"
  url       String
  docType   String?  // e.g., "overview", "official"
  Measure   Measure @relation(fields: [measureId], references: [id])
}
```

**SourceDoc Model:**
- Links measures to external sources
- Used for citation tracking

```prisma
model Summary {
  id          String   @id @default(cuid())
  measureId   String
  level       String   // "5", "8", or "12"
  tldr        String
  whatItDoes  String
  whoAffected String
  pros        String
  cons        String
  sourceRatio Float
  citations   String   // JSON string of citations
  Measure     Measure  @relation(fields: [measureId], references: [id])
}
```

**Summary Model:**
- Stores pre-generated summaries for each reading level
- One summary per measure per reading level
- `citations` stored as JSON string (could be improved to use Prisma JSON type)

```prisma
model Feedback {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  page        String   // Which page the feedback is from
  measureSlug String? // Optional: which measure
  message     String
  contact     String?  // Optional contact info
}
```

**Feedback Model:**
- Stores user feedback submissions
- Used for improving the application

### Database Seeding

The database is seeded with curated content:

```typescript
// prisma/seed.ts
// Seeds Prop 17 (2020) and Prop 47 (2014)
```

These seeded measures have:
- Pre-written summaries at all reading levels
- Curated citations
- Source documents
- High-quality content for demonstration

### Database vs. Live Data

ClearPolicy uses a hybrid approach:
- **Seeded measures**: High-quality, curated content from the database
- **Live measures**: Real-time data from APIs, processed on-the-fly

When a user searches for a measure:
1. System first checks database (for seeded measures)
2. If not found, fetches from API and processes live
3. Live processing uses heuristics to extract summaries (see `LiveMeasureCard.tsx`)

---

## Frontend Architecture and React Components {#frontend-architecture}

ClearPolicy uses React with Next.js App Router for a component-based architecture.

### Component Hierarchy

```
HomePage (app/page.tsx)
├── TourOverlay
├── HeroGraphic
├── HomeDemo
├── Illustration
├── Search Form
│   ├── Input field
│   ├── Search button
│   └── Suggestions dropdown
├── DisambiguatorChips (conditional)
└── Search Results (conditional)
    ├── BillCard (for CA results)
    ├── BillCard (for US results)
    └── Fallback links

Measure Detail Page (app/measure/[slug]/page.tsx)
└── LiveMeasureCard
    ├── ReadingLevelToggle
    └── BillCard
        ├── SourceMeter
        ├── Sections (TL;DR, What it does, etc.)
        └── Citations (toggleable)
```

### Key Components

#### BillCard (`components/BillCard.tsx`)

Displays measure summaries with all sections:

```typescript
export default function BillCard({ data, level }: { data: SummaryLike; level: "5" | "8" | "12" }) {
  const [showCitations, setShowCitations] = useState(false);
  
  return (
    <article className="card p-5">
      <h2>Summary</h2>
      <SourceMeter ratio={data.sourceRatio} count={data.sourceCount} total={5} />
      
      <section>
        <h3>TL;DR</h3>
        <p>{simple(data.tldr)}</p>
        {/* Source link */}
      </section>
      {/* More sections... */}
      
      <section>
        <button onClick={() => setShowCitations(!showCitations)}>
          {showCitations ? "Hide cited lines" : "Show cited lines"}
        </button>
        {showCitations && (
          <div>
            {data.citations.map((c, i) => (
              <CitedLine key={i} quote={c.quote} url={c.url} sourceName={c.sourceName} />
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
```

**Features:**
- Displays all summary sections
- Shows source links for each section
- Toggleable citations
- Source meter visualization
- Reading level-aware text (adds "In simple words:" prefix for 5th grade)

#### LiveMeasureCard (`components/LiveMeasureCard.tsx`)

Processes raw API data into displayable summaries:

```typescript
export default function LiveMeasureCard({ payload }: { payload: any }) {
  const [level, setLevel] = useState<"5" | "8" | "12">("8");
  
  const summary = useMemo(() => {
    // Extract and process data from payload
    // Apply reading level simplification
    // Build citations
    // Calculate source ratio
    return { tldr, whatItDoes, whoAffected, pros, cons, citations, sourceRatio };
  }, [payload, level]);
  
  return (
    <div>
      <ReadingLevelToggle level={level} onChange={setLevel} />
      <BillCard data={summary} level={level} />
    </div>
  );
}
```

**Key Responsibilities:**
1. **Data Extraction**: Pulls relevant fields from raw API response
2. **Heuristic Processing**: Uses rule-based logic to generate summaries when AI summaries aren't available
3. **Citation Building**: Extracts quotes and builds citation objects
4. **Reading Level Application**: Applies simplification based on selected level

#### DisambiguatorChips (`components/DisambiguatorChips.tsx`)

Helps users choose between ambiguous results:

```typescript
// When user searches "prop 17 retail theft"
// Shows chips for:
// - Prop 17 (2020) - Voting rights
// - Prop 47 (2014) - Retail theft (related to query)
```

Users can click a chip to navigate directly to that measure.

### Styling System

ClearPolicy uses Tailwind CSS with custom utility classes:

**Custom Classes:**
- `glass-card`, `glass-panel`, `glass-input`: Glassmorphism effects
- `liquid-button`: Animated button styles
- `animate-fade-in-up`, `animate-input-pulse`: Animation utilities
- `section-title`: Consistent heading styles
- `focus-ring`: Accessible focus indicators

**Dark Mode:**
- Uses Tailwind's `dark:` variant
- Toggle managed by layout component
- All components support both light and dark themes

---

## State Management and User Interactions {#state-management}

ClearPolicy uses React hooks for state management. There's no global state management library (like Redux); state is managed locally in components.

### Homepage State (`app/page.tsx`)

```typescript
const [q, setQ] = useState("");  // Search query
const [chips, setChips] = useState([]);  // Disambiguation chips
const [loading, setLoading] = useState(false);  // Loading state
const [results, setResults] = useState({ ca: {}, us: {}, fallbacks: [] });  // Search results
const [suggestions, setSuggestions] = useState([]);  // Search suggestions
const [showSuggest, setShowSuggest] = useState(false);  // Show suggestions dropdown
```

### State Update Patterns

**Batched Updates:**
```typescript
// React automatically batches these updates
setChips(data.chips || []);
setResults(newResults);
setQ(trimmedQuery);
```

**Derived State with useMemo:**
```typescript
const { hasCaResults, hasUsResults, hasFallbacks } = useMemo(() => {
  // Recalculate when results change
  return {
    hasCaResults: ca.length > 0,
    hasUsResults: us.length > 0,
    hasFallbacks: fb.length > 0
  };
}, [results]);
```

**Conditional Rendering:**
```typescript
const showResults = Boolean(
  currentQ && (hasCaResults || hasUsResults || hasFallbacks || chips.length > 0)
);

{showResults && (
  <section>Search Results</section>
)}
```

### URL State Synchronization

The homepage syncs with URL query parameters:

```typescript
useEffect(() => {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");
  if (query && query.trim()) {
    setQ(query.trim());
    setTimeout(() => {
      doSearch(query.trim());
    }, 100);
  }
}, []);
```

This allows:
- Direct links to searches: `/?q=prop%2050`
- Browser back/forward navigation
- Shareable search URLs

### Search Suggestions

As users type, the system fetches suggestions:

```typescript
function requestSuggestions(query: string) {
  if (suggestAbort.current) suggestAbort.current.abort();  // Cancel previous request
  if (suggestTimeout.current) window.clearTimeout(suggestTimeout.current);
  
  if (!query.trim()) {
    setSuggestions([]);
    return;
  }
  
  suggestTimeout.current = window.setTimeout(async () => {
    suggestAbort.current = new AbortController();
    const res = await fetch(`/api/search?q=${query}`, {
      signal: suggestAbort.current.signal
    });
    const data = await res.json();
    setSuggestions(data.chips.slice(0, 6));  // Show top 6 suggestions
    setShowSuggest(true);
  }, 220);  // Debounce: wait 220ms after user stops typing
}
```

**Features:**
- **Debouncing**: Waits 220ms after user stops typing before fetching
- **Request cancellation**: Cancels previous request if user types again
- **Limited results**: Shows only top 6 suggestions

---

## The Disambiguation System {#disambiguation-system}

When searches are ambiguous, ClearPolicy helps users choose the right result.

### Disambiguation Logic (`lib/normalize.ts`)

The `disambiguate()` function analyzes queries and suggests relevant measures:

```typescript
export function disambiguate(rawQuery: string) {
  const q = rawQuery.toLowerCase();
  const chips: { label: string; hint: string; slug?: string }[] = [];

  // 1. Match proposition numbers
  const propMatch = q.match(/(?:prop|proposition)\s*(\d{1,3})/);
  if (propMatch) {
    const n = propMatch[1];
    if (n === "17") {
      chips.push({ 
        label: "Prop 17 (2020)", 
        hint: "Voting rights for people on parole", 
        slug: "ca-prop-17-2020" 
      });
    } else if (n === "47") {
      chips.push({ 
        label: "Prop 47 (2014)", 
        hint: "Reduced penalties for theft & drug crimes", 
        slug: "ca-prop-47-2014" 
      });
    }
  }

  // 2. Topic-based matching
  if (/theft|shoplift|steal|crime|robbery/.test(q)) {
    if (!chips.some(c => c.label.includes("47"))) {
      chips.push({ 
        label: "Prop 47 (2014)", 
        hint: "Related to retail theft penalties", 
        slug: "ca-prop-47-2014" 
      });
    }
  }
  
  if (/parole|vote|felon|voting/.test(q)) {
    if (!chips.some(c => c.label.includes("17"))) {
      chips.push({ 
        label: "Prop 17 (2020)", 
        hint: "Parolee voting rights", 
        slug: "ca-prop-17-2020" 
      });
    }
  }

  return chips;
}
```

### Example: "prop 17 retail theft"

When a user searches "prop 17 retail theft":
1. **Prop number match**: Finds "17" → suggests Prop 17 (2020)
2. **Topic match**: Finds "theft" → suggests Prop 47 (2014) (related to theft)
3. **Result**: Shows two chips, helping user choose the right one

### Display in UI

The `DisambiguatorChips` component displays chips:

```typescript
{chips.length > 0 && (
  <div className="mt-4">
    <DisambiguatorChips chips={chips} />
  </div>
)}
```

Users can click a chip to navigate directly to that measure's detail page.

---

## Virtual Results and Fallback Strategies {#virtual-results}

ClearPolicy ensures users always get results, even when APIs return nothing.

### Virtual Proposition Results

If a user searches "Prop 50" but it's not in the database or API:

```typescript
const m = ql.match(/(?:prop|proposition)\s*(\d{1,3})/);
if (m) {
  const n = m[1];
  const virtual = {
    id: `prop-${n}-virtual`,
    identifier: `California Proposition ${n}`,
    title: `California Proposition ${n}`,
    classification: ["ballot"],
    externalUrl: `https://www.google.com/search?q=California+Proposition+${n}+site:ballotpedia.org`,
    _virtual: "prop",
    propNum: n,
    _direct: true,
    _reason: `Shown because it matches Proposition ${n}.`,
    _preview: "Open a trusted overview from Ballotpedia or LAO.",
  };
  (ca as any).results = [virtual, ...arr];
}
```

The virtual result:
- Has a unique ID
- Links to trusted sources (Ballotpedia, LAO)
- Is marked as `_virtual: "prop"` so the frontend knows it's not from the database
- Provides a preview hint

### Virtual Federal Bill Results

For well-known federal acts, the system creates virtual results:

```typescript
if (/affordable care act|\baca\b/.test(ql)) {
  virtBills.push({
    congress: 111,
    type: "hr",
    number: "3590",
    title: "Patient Protection and Affordable Care Act (ACA)",
    latestAction: { text: "Enacted as Public Law 111-148." }
  });
}
```

### Fallback Links

The system always provides fallback links to official sources:

```typescript
const fallbacks = [
  { label: "Open States (California)", url: "...", hint: "State bill records", kind: "official" },
  { label: "Congress.gov", url: "...", hint: "Federal legislation", kind: "official" },
  { label: "Ballotpedia", url: "...", hint: "Ballot measures overview", kind: "overview" },
  { label: "LAO (California)", url: "...", hint: "Legislative Analyst's Office reports", kind: "analysis" },
];
```

These ensure users always have a path to find information.

---

## ZIP Code Lookup and Local Lens {#zip-lookup}

ClearPolicy includes a "Local Lens" feature that helps users find their representatives.

### ZIP Code Detection

The search API detects ZIP code queries:

```typescript
const zipMatch = parsed.data.q.match(/(?:who'?s?\s+my\s+rep(?:resentative)?|rep(?:resentative)?)\s+(?:for\s+)?(\d{5})/i);
if (zipMatch) {
  const zip = zipMatch[1];
  return NextResponse.json({ 
    zipCode: zip,
    redirectToZip: true,
    // ...
  });
}
```

### Frontend Handling

When the frontend receives a ZIP code response:

```typescript
if (data.redirectToZip && data.zipCode) {
  setTimeout(() => {
    const zipInput = document.getElementById("zip-input") as HTMLInputElement;
    if (zipInput) {
      zipInput.value = data.zipCode;
      zipInput.dispatchEvent(new Event("input", { bubbles: true }));
      // Trigger ZIP lookup
      zipInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 100);
  return;
}
```

This:
1. Finds the ZIP input field
2. Populates it with the extracted ZIP code
3. Triggers the lookup
4. Scrolls to the ZIP panel

### ZIP API Route (`app/api/zip/route.ts`)

The ZIP API uses Google Civic Information API:

```typescript
// Fetches representatives for a ZIP code
// Returns array of officials with:
// - Name
// - Office
// - Party
// - URLs (official websites, social media)
// - finderUrl (fallback if no results)
```

### Graceful Degradation

If the ZIP lookup fails or returns no results:
- Shows empty officials array
- Provides `finderUrl` to official finder tool
- Never throws errors

---

## Testing Infrastructure {#testing-infrastructure}

ClearPolicy uses Playwright for end-to-end testing.

### Test Structure

Tests are organized by feature:

```
tests/
├── acceptance.home.spec.ts        # Homepage search and layout
├── acceptance.measure.live.spec.ts # Live measure pages
├── acceptance.measure.sample.spec.ts # Seeded measure pages
├── acceptance.zip.spec.ts         # ZIP code lookup
├── acceptance.style.accessibility.spec.ts # Accessibility checks
└── helpers.ts                     # Test utility functions
```

### Test Example: Homepage Search

```typescript
test('search shows results and live card opens', async ({ page }) => {
  await page.goto('/');
  
  // Dismiss onboarding
  const overlay = page.getByRole('heading', { name: 'Welcome to ClearPolicy' });
  if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByRole('button', { name: /Got it|Close|Skip/i }).click();
  }
  
  // Search
  await page.getByLabel('Search').fill('health');
  await page.getByRole('button', { name: 'Search' }).click();
  
  // Verify results appear
  await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
  
  // Click first result
  const first = page.getByRole('link', { name: /Open summary/ }).first();
  await expect(first).toBeVisible();
  await first.click();
  
  // Verify detail page loads
  await expect(page.getByRole('heading', { level: 2, name: 'Summary' })).toBeVisible();
});
```

### Accessibility Testing

Tests use `@axe-core/playwright` for accessibility:

```typescript
export async function runA11y(page: Page, context: string) {
  const results = await new AxeBuilder({ page })
    .disableRules(['color-contrast'])  // Allow brand colors
    .analyze();
  const critical = results.violations.filter(
    v => ['serious', 'critical'].includes(v.impact || '')
  );
  expect(critical, `${context} has critical a11y violations`).toEqual([]);
}
```

**Requirements:**
- No critical accessibility violations
- Score must be >= 95
- WCAG AA compliance

### Running Tests

```bash
# Install browsers
npx playwright install --with-deps

# Run all acceptance tests
npm run test:accept

# Run specific test
npm run test:accept -- tests/acceptance.home.spec.ts

# Run with UI (interactive)
npm run test:e2e:ui

# Run with headed browser (see what's happening)
npm run test:e2e:headed
```

---

## Conclusion: How It All Fits Together {#conclusion}

ClearPolicy is a sophisticated system that combines multiple technologies and strategies to make government policy accessible. Here's how everything connects:

### The Complete User Journey

1. **User searches "Prop 50"** on the homepage
2. **Frontend** (`app/page.tsx`) captures the query and calls `/api/search`
3. **Search API** (`app/api/search/route.ts`) normalizes the query and searches both CA and US APIs in parallel
4. **API Clients** (`lib/clients/`) fetch data from Open States and Congress.gov
5. **No results found**, so the system creates a **virtual result** for Prop 50
6. **Fallback links** are generated to Ballotpedia and LAO
7. **Response** sent back to frontend with virtual result and fallbacks
8. **Frontend** displays the result using `BillCard` component
9. **User clicks result** → navigates to `/measure/prop/50`
10. **Measure page** fetches data and displays using `LiveMeasureCard`
11. **User toggles reading level** → `simplify()` function processes all text
12. **User clicks "Show cited lines"** → citations are displayed with source links

### Key Design Principles

1. **Graceful Degradation**: System works even when APIs fail or keys are missing
2. **Always Provide Value**: Virtual results and fallback links ensure users never hit a dead end
3. **Source Transparency**: Every claim is linked to official sources
4. **Accessibility First**: WCAG AA compliant, keyboard navigable, screen reader friendly
5. **Progressive Enhancement**: Core functionality works without JavaScript (though enhanced with it)

### Technical Highlights

- **Parallel API Calls**: Searches CA and US simultaneously for speed
- **Intelligent Ranking**: Results scored and ranked by relevance
- **Rule-Based Text Simplification**: Maintains accuracy while improving readability
- **Hybrid Data Model**: Combines curated database content with live API data
- **Virtual Results**: Ensures coverage for any proposition number
- **Comprehensive Fallbacks**: Multiple strategies to find information

### Future Enhancements

Potential improvements:
- **AI-Generated Summaries**: Use LLMs to generate higher-quality summaries (partially implemented)
- **Caching Layer**: Cache API responses to reduce load and improve speed
- **User Accounts**: Save favorite measures, reading preferences
- **Spanish Translation**: Expand accessibility to Spanish speakers
- **Amendment Diff UI**: Show how bills change over time
- **PDF Export**: Allow users to download summaries as PDFs

---

**This technical deep dive has covered the major systems and components of ClearPolicy. The codebase is well-structured, follows modern React patterns, and prioritizes user experience and accessibility. The combination of real-time API integration, intelligent fallback strategies, and reading level adjustment creates a unique tool for civic education.**
