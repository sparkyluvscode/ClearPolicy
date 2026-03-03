# ClearPolicy vs. ChatGPT: Differentiation & Novel Pipeline

## The Accusation: "Isn't this just a ChatGPT wrapper?"

**Short answer:** It *can* look that way today because the main search flow (`/api/omni`) leans heavily on GPT + Tavily. But ClearPolicy already has unique assets that ChatGPT does not. The opportunity is to **orchestrate** them into a pipeline where the LLM is the *synthesizer of verified data*, not the primary knowledge source.

---

## 1. What ClearPolicy Has That ChatGPT Does NOT

| Asset | ChatGPT | ClearPolicy |
|-------|---------|-------------|
| **Congress.gov API** | No | Yes - federal bills, metadata, latest action |
| **Open States API** | No | Yes - CA (and multi-state) bills, propositions |
| **Google Civic API** | No | Yes - reps by ZIP, office info |
| **Curated known summaries** | No | Yes - human-verified CA props with citations |
| **Tavily real-time web** | No (Bing is separate) | Yes - injected into every policy query |
| **Structured bill/prop IDs** | No | Yes - disambiguation, identifier resolution |
| **Reading-level adaptation** | No | Yes - 5th, 8th, 12th grade |
| **Source traceability** | No | Yes - every claim → source URL |
| **Persona tailoring** | Generic | Student, renter, homeowner, etc. |
| **Debate prep structure** | Freeform | Steel-man perspectives, common ground |

ChatGPT is a general-purpose conversational model. ClearPolicy is a **policy-specific retrieval-augmented system** with government APIs, structured data, and civic UX. The gap: we're not yet *fully* using the gov data in the main pipeline.

---

## 2. Current Pipeline (Where the "Wrapper" Perception Comes From)

```
User Query → Classifier → Known Summary? 
                │              │ Yes → Return curated (no AI)
                │              │ No
                ▼              ▼
           Tavily Search → GPT-4o-mini (with web context) → Structured Answer
```

**Problem:** When there's no known summary, we go straight to Tavily + GPT. We have Congress.gov and OpenStates, but **the omni route never calls them**. So for "AB 1482" or "H.R. 1", we're not fetching the actual bill - we're asking GPT (plus web search) to answer from scratch.

---

## 3. Novel Pipeline: "Gov Data First, AI Second"

### Principle: **The AI summarizes and explains verified data; it does not invent facts.**

```
User Query → Classifier
                │
                ├─ Bill/Prop ID detected? 
                │     → Fetch from Congress.gov / OpenStates
                │     → Extract: title, summary, text snippets, sponsors, status
                │     → Inject as PRIMARY context into prompt
                │
                ├─ ZIP in query? 
                │     → Fetch reps from Civic API
                │     → Inject: "User's reps: [names]. Consider local impact."
                │
                ├─ News/topical?
                │     → Tavily (topic: news)
                │
                └─ General policy?
                      → Tavily (policy domains)
                │
                ▼
           All fetched data → GPT: "Summarize and explain ONLY from these sources. Cite by number."
                ▼
           Structured Answer (sections, sources, reading level)
```

### What changes:

1. **Bill/prop queries** → Congress.gov + OpenStates called **before** GPT. The prompt gets actual bill text/metadata. GPT's job: simplify, structure, explain - not hallucinate.
2. **ZIP always used** when provided → Civic API gives reps; prompt includes "How does this affect [user's district]?"
3. **Tavily remains** for real-time context and news, but it's **layered on top of** gov data when both apply.
4. **Source grounding** → We can compute: "X% of this answer traces to fetched documents" and show it (builds trust).

---

## 4. Concrete Pipeline Configurations

### A. **Structured Bill Path** (High novelty)

- **Trigger:** Query matches bill pattern (AB 5, H.R. 3684, Prop 22, etc.)
- **Steps:**
  1. Resolve identifier → Congress.gov or OpenStates
  2. Fetch bill detail: title, summary, key provisions, sponsors, status, latest action
  3. (Optional) Fetch full text or key sections if available
  4. Tavily: 1–2 supplemental queries (e.g. "AB 1482 California rent control impact")
  5. Prompt: "Here is the official bill data from [source]. Here is additional context from web search. Provide a plain-English summary. Use ONLY information from these sources. Cite each claim."
  6. Apply reading-level simplification
- **Output:** Answer grounded in **verified** gov data + real-time analysis.

### B. **Topic Search Path** (Medium novelty)

- **Trigger:** "healthcare reform", "climate policy 2026"
- **Steps:**
  1. Congress.gov search + OpenStates search (by subject/keyword)
  2. Return top 3–5 matching bills with metadata
  3. Tavily: "healthcare reform 2026" (news + policy)
  4. Prompt: "Here are relevant bills from official sources [list]. Here is current news/analysis. Synthesize a brief overview. Prioritize the bills; use web for context."
- **Output:** User sees which **real bills** exist, plus synthesized overview.

### C. **Local Lens Path** (High novelty)

- **Trigger:** Query + ZIP code
- **Steps:**
  1. Civic API → user's reps
  2. (If bill-specific) Fetch bill + vote records for those reps (Congress.gov has member votes)
  3. Tavily: "[bill name] [user's state/city] local impact"
  4. Prompt: "User's representatives: [names]. How have they voted or positioned on this? What does this mean for their district?"
- **Output:** "Your rep, [Name], voted Yes. Here's what this means for your area."

### D. **Debate Prep Path** (Medium novelty)

- **Trigger:** "arguments for and against universal healthcare"
- **Steps:**
  1. Tavily with policy domains: CRS, Brookings, Heritage, Cato, etc.
  2. Fetch any directly relevant bills (e.g. Medicare for All)
  3. Prompt: "Here are source excerpts. Present steel-man perspectives. Label each perspective with its source. Do not add arguments not present in the sources."
- **Output:** Perspectives with traceable think-tank / gov sources.

### E. **Known Summary Enhancement** (Already partially there)

- **Trigger:** Prop 22, Prop 17, etc. (curated in known-summaries)
- **Steps:**
  1. Return human-curated summary (fast path)
  2. AI used only for: follow-ups, reading-level adaptation, or "explain this like I'm 10"
- **Output:** Human-verified content; AI assists, doesn't replace.

---

## 5. Implementation Priorities

| Priority | Pipeline | Effort | Impact | Novel? |
|----------|----------|--------|--------|--------|
| **P0** | Structured Bill Path | Medium | Very high | Yes |
| **P1** | Wire Congress + OpenStates into omni | Medium | High | Yes |
| **P2** | Local Lens (ZIP + rep votes) | Medium | High | Yes |
| **P3** | Topic Search Path | Low | Medium | Yes |
| **P4** | Source grounding score in UI | Low | Trust | Yes |

**P0/P1** is the biggest win: when someone asks "What is AB 1482?", we fetch the real bill, inject it, and GPT explains it. That is **unambiguously** not a wrapper - we're turning government data into accessible summaries.

---

## 6. One-Liner Elevator Pitch

> **"ClearPolicy doesn't guess - it fetches. We pull real bills from Congress.gov and state legislatures, layer on real-time news, and use AI only to translate that into plain English you can trust. Every claim traces to a source."**

---

## 7. Technical Gaps to Close

1. **Omni route** does not call `congress.searchBills()` or `openstates.searchBills()`. Add a pre-GPT step that fetches structured bill data when the classifier detects a bill/prop.
2. **Bill detail injection** - We need a function that takes bill metadata + text snippets and formats them for the prompt (like we do with Tavily).
3. **ZIP integration** - The omni route receives `zip` but doesn't call the Civic API. Add that and inject rep names into the prompt.
4. **Unified context builder** - A module that assembles: gov data + Tavily results + (optional) Civic data → single context block for the policy engine.

---

## 8. Is It Possible With What We Have?

**Yes.** We already have:

- Congress.gov client (`lib/clients/congress.ts`)
- OpenStates client (`lib/clients/openstates.ts`)
- Civic client (via `/api/zip` or similar)
- Tavily (`lib/web-search.ts`)
- Known summaries (`lib/known-summaries.ts`)
- Omni classifier (extracts bill IDs, ZIP, intent)
- Policy engine (accepts context, produces structured answers)

The missing piece is **orchestration**: calling these in the right order and injecting results into the policy engine. The pipeline described above is implementable with the current stack.
