# ClearPolicy Project Handoff Brief
## Comprehensive Guide for New Developer

================================================================================
                            CLEARPOLICY PROJECT BRIEF
================================================================================

This document provides a complete overview of the ClearPolicy project, its 
current state, known issues, testing requirements, and actionable next steps 
for a developer taking over this work.

================================================================================
                            TABLE OF CONTENTS
================================================================================

1. What is ClearPolicy?
2. Project Architecture & Tech Stack
3. Current Project State
4. Critical Issues & Debugging Status
5. File Structure & Key Components
6. API Integration Details
7. Testing Requirements
8. Setup Instructions
9. Action Items & Next Steps
10. Troubleshooting Guide

================================================================================
                        1. WHAT IS CLEARPOLICY?
================================================================================

ClearPolicy is a non-partisan civic education web application designed to 
help students, first-time voters, and citizens understand complex government 
policy quickly. The app provides plain-English summaries of ballot measures, 
bills, and propositions with line-referenced citations and adjustable reading 
levels.

MISSION:
--------
To make government policy accessible to everyone by providing neutral, 
factual, and easily understandable summaries of legislation at multiple 
reading levels (5th, 8th, and 12th grade).

KEY FEATURES:
-------------
1. **Search Functionality**: Search for any proposition, bill, or act by 
   number, name, or topic (e.g., "Prop 50", "Affordable Care Act", "health")

2. **Disambiguation System**: When searches are ambiguous (e.g., "prop 17 
   retail theft"), the app shows "chips" to help users choose between 
   similar measures (Prop 17 vs Prop 47)

3. **Reading Level Toggle**: Adjusts text complexity to 5th, 8th, or 12th 
   grade reading levels while maintaining factual accuracy

4. **Source Meter**: Visual indicator showing what percentage of content is 
   sourced from primary documents

5. **Line-Referenced Citations**: Expandable quotes with direct links to 
   official sources (Ballotpedia, Legislative Analyst's Office, etc.)

6. **Local Lens**: ZIP code lookup to find local representatives using 
   Google Civic Information API

7. **Non-Partisan Design**: Pros and cons are clearly labeled with sources; 
   no political advocacy or bias

TARGET AUDIENCE:
----------------
- High school civics students
- First-time voters
- Citizens researching ballot measures
- Anyone who finds legal language difficult to understand

TECHNICAL APPROACH:
------------------
- Next.js 14 (App Router) for server-side rendering and API routes
- TypeScript for type safety
- Tailwind CSS for styling
- Prisma ORM with SQLite database
- Integration with three government APIs:
  * Congress.gov API v3 (federal bills)
  * Open States API v3 (state bills, primarily California)
  * Google Civic Information API (representative lookup)

================================================================================
                   2. PROJECT ARCHITECTURE & TECH STACK
================================================================================

FRONTEND:
---------
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom utility classes
- **State Management**: React hooks (useState, useEffect, useMemo)
- **Components**: React functional components with TypeScript

Key styling classes used:
- `glass-card`, `glass-panel`, `glass-input`: Glassmorphism effects
- `liquid-button`: Animated button styles
- `animate-fade-in-up`, `animate-input-pulse`: Animation utilities
- `section-title`: Consistent heading styles

BACKEND:
--------
- **API Routes**: Next.js serverless functions in `/app/api/`
- **Database**: Prisma ORM with SQLite (file: `dev.db`)
- **Validation**: Zod schemas for API input validation
- **Error Handling**: Graceful degradation when APIs are unavailable

API INTEGRATIONS:
----------------
1. **Open States API** (`lib/clients/openstates.ts`)
   - Searches California state bills and propositions
   - Methods: `searchBills()`, `searchByIdentifier()`, `searchBySubject()`
   - Returns: Array of bill objects with metadata

2. **Congress.gov API** (`lib/clients/congress.ts`)
   - Searches federal bills and acts
   - Method: `searchBills()`
   - Returns: Object with `data.bills` array

3. **Google Civic Information API** (`lib/clients/civic.ts`)
   - Looks up representatives by ZIP code
   - Method: `getRepresentatives()`
   - Returns: Array of official objects

DATA FLOW:
----------
1. User enters search query on homepage (`app/page.tsx`)
2. Query sent to `/api/search` route (`app/api/search/route.ts`)
3. Search route:
   - Normalizes query (e.g., "Proposition 50" → "Prop 50")
   - Calls disambiguation function (`lib/normalize.ts`)
   - Searches both CA (Open States) and US (Congress) APIs in parallel
   - Ranks and deduplicates results
   - Creates "virtual" results for propositions not in database
   - Returns JSON with `ca`, `us`, `chips`, and `fallbacks` arrays
4. Frontend receives results and displays them using:
   - `BillCard.tsx` for CA bills
   - `LiveMeasureCard.tsx` for detailed measure views
   - `DisambiguatorChips.tsx` for ambiguous queries

================================================================================
                       3. CURRENT PROJECT STATE
================================================================================

WHAT'S WORKING:
---------------
✅ **API Endpoints**: All API routes return valid JSON responses
   - `/api/search?q=prop%2050` returns results correctly
   - `/api/zip?zip=95014` returns representatives
   - `/api/measure` and `/api/prop/[num]` work correctly

✅ **Backend Search Logic**: The search API handles:
   - Proposition numbers (creates virtual results if not in DB)
   - Bill identifiers (AB 5, SB 1383, etc.)
   - Topic searches (health, education, etc.)
   - Federal bills (H.R. 50, etc.)
   - ZIP code queries ("who's my rep for 95014")

✅ **Graceful Degradation**: App works without API keys:
   - Returns empty arrays instead of errors
   - Shows fallback links to official sources
   - No crashes when APIs are unavailable

✅ **Core Features** (when working):
   - Dark mode toggle
   - Reading level toggle (5th/8th/12th grade)
   - "Show cited lines" button
   - Measure detail pages
   - About, Contact, Privacy pages

✅ **Database**: Prisma schema and migrations are set up correctly
   - Seeded with Prop 17 (2020) and Prop 47 (2014)
   - Feedback table for user submissions

WHAT'S NOT WORKING:
-------------------
❌ **CRITICAL: Search Results Not Displaying on Homepage**
   - **Symptom**: User types query (e.g., "Prop 50") and clicks Search, but 
     no results appear on the page
   - **API Status**: The `/api/search` endpoint returns correct data (verified 
     via curl)
   - **Root Cause**: Frontend state management issue - `showResults` condition 
     not evaluating to `true` even when API returns data
   - **Location**: `app/page.tsx` - the search results section is conditionally 
     rendered based on `showResults` variable
   - **Impact**: Core functionality broken - users cannot see search results

❌ **Playwright Tests Failing**:
   - `tests/acceptance.home.spec.ts` fails because "Search Results" heading 
     never appears
   - Test expects to see results after searching for "health"
   - This is directly related to the search results display issue above

POTENTIAL ISSUES (Need Verification):
-------------------------------------
⚠️ **UI Appearance**: User reported website "looks horrible" - needs visual 
   verification once functional issues are fixed

⚠️ **Next.js Dev Server**: Sometimes shows 404 errors during compilation - 
   may need cache clearing (`rm -rf .next`)

================================================================================
                  4. CRITICAL ISSUES & DEBUGGING STATUS
================================================================================

PRIMARY ISSUE: SEARCH RESULTS NOT DISPLAYING
--------------------------------------------

**Problem Description:**
When a user searches for anything (e.g., "Prop 50", "health", "affordable 
care act"), the API correctly returns results, but the UI does not display 
them. The search results section that should appear below the search form 
never renders.

**Evidence:**
1. API returns data: `curl 'http://localhost:3000/api/search?q=prop%2050'` 
   shows valid JSON with results
2. Browser console shows API calls succeeding and data being received
3. React state (`results`, `q`, `chips`) appears to update correctly
4. But `showResults` variable remains `false`, preventing rendering

**Code Location:**
- File: `app/page.tsx`
- Key variables:
  - `q`: Search query string (state)
  - `results`: Object containing `ca`, `us`, `fallbacks` (state)
  - `chips`: Array of disambiguation chips (state)
  - `showResults`: Boolean calculated from `useMemo` that determines if 
     results section should render

**Current Implementation:**
```typescript
const showResults = Boolean(
  currentQ && (hasCaResults || hasUsResults || hasFallbacks || chips.length > 0)
);
```

**Debugging Attempts Made:**
1. ✅ Added extensive console logging to track state updates
2. ✅ Normalized API response structure handling
3. ✅ Changed form submission to read input value directly
4. ✅ Added `useEffect` to log state changes
5. ✅ Ensured `setQ` and `setResults` are called together
6. ✅ Added `useMemo` to recalculate derived state

**What Needs Investigation:**
1. Why `showResults` evaluates to `false` when conditions should be `true`
2. Whether React state updates are batching incorrectly
3. If there's a timing issue with state updates and re-renders
4. Whether the conditional rendering logic itself has a bug

**Testing Commands:**
```bash
# Test API directly (should return results)
curl 'http://localhost:3000/api/search?q=prop%2050' | python3 -c "import sys, json; d=json.load(sys.stdin); print('CA:', len(d.get('ca', {}).get('results', []))); print('US:', len(d.get('us', {}).get('bills', [])))"

# Test in browser
# 1. Open http://localhost:3000
# 2. Open browser DevTools console
# 3. Type "Prop 50" in search box
# 4. Click Search button
# 5. Check console logs for state updates
# 6. Verify if "Search Results" heading appears
```

SECONDARY ISSUES:
-----------------

**Playwright Test Failures:**
- File: `tests/acceptance.home.spec.ts`
- Failure: Test times out waiting for "Search Results" heading
- Root cause: Same as primary issue (results not displaying)
- Fix: Will be resolved when primary issue is fixed

**Next.js Build Cache:**
- Sometimes causes 404 errors on pages
- Solution: `rm -rf .next && npm run dev`
- Not a code issue, just a dev server quirk

================================================================================
                   5. FILE STRUCTURE & KEY COMPONENTS
================================================================================

PROJECT ROOT: `/Users/pranilraichura/OpenPolicy/clearpolicy/`

CORE FILES:
-----------

**Frontend Pages:**
- `app/page.tsx` - Homepage with search functionality (CRITICAL - has the bug)
- `app/layout.tsx` - Root layout with header/footer
- `app/about/page.tsx` - About page
- `app/contact/page.tsx` - Contact page
- `app/impact/page.tsx` - Impact page
- `app/privacy/page.tsx` - Privacy policy
- `app/measure/[slug]/page.tsx` - Dynamic route for measure detail pages
- `app/measure/live/page.tsx` - Live measure view
- `app/measure/prop/[num]/page.tsx` - Proposition detail pages

**API Routes:**
- `app/api/search/route.ts` - Search endpoint (WORKING - returns correct data)
- `app/api/measure/route.ts` - Get measure by ID
- `app/api/prop/[num]/route.ts` - Get proposition by number
- `app/api/zip/route.ts` - ZIP code lookup (WORKING)
- `app/api/feedback/route.ts` - User feedback submission

**Components:**
- `components/BillCard.tsx` - Displays bill/proposition cards in search results
- `components/LiveMeasureCard.tsx` - Detailed measure view with reading levels
- `components/DisambiguatorChips.tsx` - Shows chips for ambiguous queries
- `components/ReadingLevelToggle.tsx` - Reading level selector (5th/8th/12th)
- `components/CitedLine.tsx` - Individual citation with source link
- `components/SourceMeter.tsx` - Visual percentage indicator
- `components/ZipPanel.tsx` - ZIP code input and results display
- `components/Header.tsx` - Navigation header
- `components/Footer.tsx` - Site footer
- `components/TourOverlay.tsx` - Welcome tour overlay (has "Got it", "Skip" buttons)

**Library Functions:**
- `lib/normalize.ts` - Disambiguation logic, query normalization
- `lib/reading.ts` - Text simplification for reading levels
- `lib/citations.ts` - Citation parsing and source ratio calculation
- `lib/clients/openstates.ts` - Open States API client
- `lib/clients/congress.ts` - Congress.gov API client
- `lib/clients/civic.ts` - Google Civic API client
- `lib/utils.ts` - Utility functions

**Database:**
- `prisma/schema.prisma` - Database schema (Measure, SourceDoc, Summary, Feedback)
- `prisma/seed.ts` - Seeds database with Prop 17 and Prop 47
- `prisma/migrations/` - Database migration files

**Tests:**
- `tests/acceptance.home.spec.ts` - Homepage search and layout tests (FAILING)
- `tests/acceptance.measure.live.spec.ts` - Live measure page tests
- `tests/acceptance.measure.sample.spec.ts` - Sample measure tests
- `tests/acceptance.zip.spec.ts` - ZIP lookup tests
- `tests/acceptance.style.accessibility.spec.ts` - Accessibility tests
- `tests/helpers.ts` - Test utility functions

**Configuration:**
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `playwright.config.ts` - Playwright test configuration
- `next.config.js` - Next.js configuration (if exists)

**Documentation:**
- `README.md` - Setup instructions and overview
- `API_KEY_SETUP.md` - How to get API keys
- `SEARCH_RESULTS_ISSUE.md` - Detailed bug report
- `FINAL_STATUS.md` - Status of fixes
- Various other markdown files with notes and reports

KEY COMPONENT: app/page.tsx
----------------------------
This is the most critical file to understand. It contains:

1. **State Management:**
   - `q`: Current search query
   - `results`: Search results from API
   - `chips`: Disambiguation chips
   - `loading`: Loading state
   - `suggestions`: Search suggestions
   - `showSuggest`: Whether to show suggestions dropdown

2. **Key Functions:**
   - `doSearch(query)`: Fetches from `/api/search` and updates state
   - `requestSuggestions(query)`: Fetches search suggestions
   - `useEffect`: Handles initial query from URL params

3. **Rendering Logic:**
   - Conditionally renders "Search Results" section based on `showResults`
   - `showResults` is calculated from `useMemo` hook
   - Displays `BillCard` components for CA and US results
   - Shows `DisambiguatorChips` when chips exist
   - Shows fallback links when no results

4. **The Bug:**
   - `showResults` should be `true` when there are results, but it's `false`
   - This prevents the entire results section from rendering
   - Need to debug why the condition isn't evaluating correctly

================================================================================
                     6. API INTEGRATION DETAILS
================================================================================

SEARCH API: /api/search
------------------------
**Endpoint:** `GET /api/search?q=<query>`

**Query Examples:**
- `?q=prop%2050` - California proposition
- `?q=affordable%20care%20act` - Federal act
- `?q=health` - Topic search
- `?q=AB%205` - California bill identifier
- `?q=who's%20my%20rep%20for%2095014` - ZIP code query (redirects to /api/zip)

**Response Structure:**
```json
{
  "ca": {
    "results": [
      {
        "id": "...",
        "identifier": "Prop 50",
        "title": "...",
        "_direct": true,
        "_preview": "..."
      }
    ]
  },
  "us": {
    "bills": [...],
    "data": { "bills": [...] }
  },
  "chips": [
    { "label": "Prop 17 (2020)", "hint": "...", "slug": "..." }
  ],
  "fallbacks": [
    { "label": "...", "url": "...", "hint": "...", "kind": "official" }
  ]
}
```

**Special Features:**
- Normalizes "Proposition" to "Prop"
- Creates virtual results for propositions not in database
- Searches both CA and US in parallel
- Handles bill identifiers (AB 5, SB 1383)
- Topic-based searches with fallback strategies
- ZIP code detection and redirection

**Error Handling:**
- Returns empty arrays if APIs fail
- Never throws errors (graceful degradation)
- Always returns valid JSON

ZIP CODE API: /api/zip
-----------------------
**Endpoint:** `GET /api/zip?zip=<5-digit-zip>`

**Response:**
```json
{
  "officials": [
    {
      "name": "...",
      "party": "...",
      "urls": [...],
      "office": "..."
    }
  ],
  "finderUrl": "https://..."
}
```

**Error Handling:**
- Returns empty `officials` array if no results
- Provides `finderUrl` as fallback
- Never throws errors

MEASURE API: /api/measure
--------------------------
**Endpoint:** `GET /api/measure?source=<os|db>&id=<id>`

**Returns:** Full measure data with summaries, sources, citations

PROPOSITION API: /api/prop/[num]
---------------------------------
**Endpoint:** `GET /api/prop/50`

**Returns:** Proposition data, creates virtual result if not in database

API KEYS REQUIRED:
------------------
1. **CONGRESS_API_KEY**: From https://api.data.gov/signup/
2. **OPENSTATES_API_KEY**: From https://openstates.org/api/keys/
3. **GOOGLE_CIVIC_API_KEY**: From Google Cloud Console

**Note:** App works without keys (returns empty results), but won't have 
real data. See `API_KEY_SETUP.md` for detailed instructions.

================================================================================
                       7. TESTING REQUIREMENTS
================================================================================

TEST SUITE OVERVIEW:
--------------------
The project uses Playwright for end-to-end testing. All acceptance tests are 
marked with `@acceptance` tag.

RUNNING TESTS:
--------------
```bash
# Install Playwright browsers (first time only)
npx playwright install --with-deps

# Start dev server (in one terminal)
npm run dev

# Run all acceptance tests (in another terminal)
npm run test:accept

# Run specific test file
npm run test:accept -- tests/acceptance.home.spec.ts

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run with headed browser (see what's happening)
npm run test:e2e:headed
```

CURRENT TEST STATUS:
--------------------
❌ **FAILING**: `tests/acceptance.home.spec.ts`
   - Test: "search shows results and live card opens"
   - Failure: Timeout waiting for "Search Results" heading
   - Root cause: Search results not displaying (same as primary bug)

✅ **PASSING** (presumably, need to verify):
   - `tests/acceptance.measure.live.spec.ts`
   - `tests/acceptance.measure.sample.spec.ts`
   - `tests/acceptance.zip.spec.ts`
   - `tests/acceptance.style.accessibility.spec.ts`

TEST DETAILS: acceptance.home.spec.ts
--------------------------------------
**What it tests:**
1. Homepage loads correctly
2. Onboarding overlay can be dismissed
3. "Find a bill or proposition" heading is visible
4. Search functionality works (types "health", clicks Search)
5. "Search Results" heading appears after search
6. First result link is visible and clickable
7. Accessibility (a11y) checks pass
8. Mobile viewport layout works

**Current failure point:**
- Step 5: "Search Results" heading never appears
- This causes timeout and test failure

**How to debug:**
1. Run test with `--headed` flag to see browser
2. Add `await page.pause()` in test to inspect state
3. Check browser console for errors
4. Verify API is returning data (use Network tab)

ACCESSIBILITY TESTING:
----------------------
Tests use `@axe-core/playwright` to check for:
- WCAG AA compliance
- No critical violations
- Score must be >= 95

**Helper function:** `tests/helpers.ts` contains `runA11y()` function

MANUAL TESTING CHECKLIST:
--------------------------
After fixing the search results bug, manually verify:

1. **Homepage Search:**
   - [ ] Type "Prop 50" → Results appear
   - [ ] Type "health" → Results appear
   - [ ] Type "affordable care act" → Results appear
   - [ ] Click a result → Opens detail page
   - [ ] Disambiguation chips appear for ambiguous queries

2. **Measure Detail Page:**
   - [ ] TL;DR section visible
   - [ ] Reading level toggle works (5th/8th/12th)
   - [ ] Text changes when toggling reading level
   - [ ] "Show cited lines" button works
   - [ ] Citations appear when toggled
   - [ ] Source Meter shows percentage
   - [ ] All source links work

3. **ZIP Code Lookup:**
   - [ ] Enter valid ZIP (e.g., 95014) → Shows representatives
   - [ ] Enter invalid ZIP → Shows fallback message
   - [ ] Links to representative pages work

4. **Navigation:**
   - [ ] Header links work (About, Impact, Contact)
   - [ ] Footer links work
   - [ ] Dark mode toggle works
   - [ ] Mobile menu works (if applicable)

5. **UI/UX:**
   - [ ] Page looks good (not "horrible")
   - [ ] Responsive on mobile
   - [ ] No console errors
   - [ ] Fast load times

================================================================================
                       8. SETUP INSTRUCTIONS
================================================================================

PREREQUISITES:
--------------
- Node.js 18+ installed
- npm or yarn package manager
- Git (to clone repository if needed)

INITIAL SETUP:
--------------

1. **Install Dependencies:**
   ```bash
   cd /Users/pranilraichura/OpenPolicy/clearpolicy
   npm install
   ```

2. **Set Up Environment Variables:**
   Create `.env` file in project root:
   ```env
   CONGRESS_API_KEY=your_api_data_gov_key
   OPENSTATES_API_KEY=your_openstates_key
   GOOGLE_CIVIC_API_KEY=your_google_civic_key
   NEXT_PUBLIC_APP_NAME=ClearPolicy
   DATABASE_URL="file:./dev.db"
   ```
   
   **Note:** App works without API keys, but won't have real data. See 
   `API_KEY_SETUP.md` for how to get keys.

3. **Set Up Database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
   
   This creates the SQLite database and seeds it with Prop 17 and Prop 47.

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   
   Server runs on http://localhost:3000

5. **Verify Setup:**
   - Open http://localhost:3000 in browser
   - Should see homepage with search form
   - No console errors (check DevTools)

TROUBLESHOOTING SETUP:
----------------------

**Issue: "Cannot find module" errors**
- Solution: `rm -rf .next node_modules && npm install`
- Then restart dev server

**Issue: Database errors**
- Solution: `rm -rf prisma/dev.db && npx prisma migrate dev && npx prisma db seed`

**Issue: Port 3000 already in use**
- Solution: Kill process using port or change port in `package.json` scripts

**Issue: API calls failing**
- Check `.env` file exists and has correct variable names
- Verify API keys are valid (if using real keys)
- App should still work without keys (returns empty results)

DEVELOPMENT WORKFLOW:
---------------------
1. Make code changes
2. Save file (Next.js hot-reloads automatically)
3. Test in browser at http://localhost:3000
4. Check browser console for errors
5. Run tests: `npm run test:accept`
6. Fix any issues
7. Repeat

BUILD FOR PRODUCTION:
---------------------
```bash
npm run build
npm start
```

This creates optimized production build. For deployment to Vercel, see 
`README.md` deployment section.

================================================================================
                    9. ACTION ITEMS & NEXT STEPS
================================================================================

PRIORITY 1: FIX SEARCH RESULTS DISPLAY BUG
-------------------------------------------
**Status:** CRITICAL - Blocks core functionality

**Task:** Debug why `showResults` is `false` when it should be `true` in 
`app/page.tsx`

**Steps:**
1. Open `app/page.tsx` and locate the `showResults` calculation
2. Add more detailed console logging to track:
   - When `doSearch()` is called
   - What data is received from API
   - What values `hasCaResults`, `hasUsResults`, `hasFallbacks` have
   - What `currentQ` value is
   - Final `showResults` value
3. Test in browser:
   - Open http://localhost:3000
   - Open DevTools console
   - Type "Prop 50" and click Search
   - Observe console logs
4. Check if React state is updating correctly:
   - Verify `setResults()` is actually updating state
   - Check if `useMemo` dependencies are correct
   - Ensure state updates aren't being batched incorrectly
5. Potential fixes to try:
   - Force re-render after state update
   - Simplify `showResults` calculation
   - Check if conditional rendering JSX has issues
   - Verify `BillCard` and results components aren't causing errors

**Success Criteria:**
- User can search for "Prop 50" and see results
- "Search Results" heading appears
- Results cards are visible and clickable
- Playwright test `acceptance.home.spec.ts` passes

PRIORITY 2: VERIFY AND FIX PLAYWRIGHT TESTS
--------------------------------------------
**Status:** BLOCKED by Priority 1

**Task:** Once search results display works, ensure all tests pass

**Steps:**
1. Run full test suite: `npm run test:accept`
2. Fix any failing tests
3. Verify accessibility tests pass (score >= 95)
4. Test on mobile viewport
5. Document any test issues found

PRIORITY 3: UI/UX VERIFICATION
-------------------------------
**Status:** After functional fixes

**Task:** Verify website doesn't "look horrible" and matches design intent

**Steps:**
1. Review homepage appearance
2. Check all pages for visual consistency
3. Verify responsive design on mobile/tablet/desktop
4. Check color contrast and readability
5. Ensure animations and transitions work smoothly
6. Fix any visual bugs

PRIORITY 4: COMPREHENSIVE FUNCTIONAL TESTING
---------------------------------------------
**Status:** After Priority 1-3

**Task:** Test all features end-to-end

**Checklist:**
- [ ] Search works for all query types (prop, bill, topic, federal)
- [ ] Disambiguation chips appear and work
- [ ] Reading level toggle works on all measure pages
- [ ] Citations toggle works
- [ ] Source Meter displays correctly
- [ ] ZIP code lookup works
- [ ] All navigation links work
- [ ] Dark mode toggle works
- [ ] Mobile responsive design works
- [ ] No console errors
- [ ] Fast page load times

PRIORITY 5: CODE CLEANUP AND DOCUMENTATION
-------------------------------------------
**Status:** Final polish

**Task:** Clean up debug code and update documentation

**Steps:**
1. Remove excessive `console.log` statements (keep essential ones)
2. Update `README.md` if needed
3. Document any new fixes in relevant markdown files
4. Ensure code follows project style
5. Add comments for complex logic

TESTING STRATEGY:
-----------------
After each fix:
1. Test manually in browser
2. Run relevant Playwright test
3. Check browser console for errors
4. Verify API still returns correct data
5. Test edge cases (empty query, special characters, etc.)

ITERATION APPROACH:
-------------------
1. Make small, focused changes
2. Test immediately
3. If it doesn't work, revert and try different approach
4. Use browser DevTools extensively
5. Check React DevTools if available
6. Use Playwright's `--headed` mode to see what's happening

================================================================================
                      10. TROUBLESHOOTING GUIDE
================================================================================

COMMON ISSUES AND SOLUTIONS:
-----------------------------

**Issue: Search returns no results**
- Check: Is API returning data? Test with `curl 'http://localhost:3000/api/search?q=prop%2050'`
- If API works but UI doesn't show results → This is the main bug to fix
- If API returns empty → Check API keys in `.env` (or app is working in degraded mode)

**Issue: "Cannot find module" errors**
- Solution: `rm -rf .next && npm run dev`
- This clears Next.js build cache

**Issue: Database errors**
- Solution: `rm -rf prisma/dev.db && npx prisma migrate dev && npx prisma db seed`
- This recreates the database

**Issue: Port 3000 already in use**
- Solution: Find and kill process: `lsof -ti:3000 | xargs kill -9`
- Or change port in `package.json`

**Issue: Playwright tests fail to start**
- Solution: `npx playwright install --with-deps`
- Ensures browsers are installed

**Issue: TypeScript errors**
- Solution: `npm run build` to see all errors
- Fix type issues or add `@ts-ignore` if necessary (not recommended)

**Issue: Styling looks broken**
- Check: Is Tailwind CSS compiling? Look for `globals.css` imports
- Solution: Restart dev server
- Check: Are custom classes defined in `tailwind.config.ts`?

**Issue: API calls timing out**
- Check: Are API keys valid?
- Check: Is internet connection working?
- App should still work (returns empty results gracefully)

DEBUGGING TIPS:
---------------

1. **Use Browser DevTools:**
   - Console tab: Check for JavaScript errors
   - Network tab: Verify API calls are made and responses are correct
   - React DevTools: Inspect component state and props

2. **Use Console Logging:**
   - Add `console.log()` statements to track execution flow
   - Log state values before and after updates
   - Log API responses

3. **Use Playwright Debug Mode:**
   - Run tests with `--headed` to see browser
   - Use `await page.pause()` to pause execution
   - Use `page.screenshot()` to capture state

4. **Test API Directly:**
   - Use `curl` to test API endpoints
   - Verify response structure matches what frontend expects

5. **Check React State:**
   - Use React DevTools to inspect component state
   - Verify state updates are happening
   - Check if re-renders are occurring

6. **Isolate the Problem:**
   - Test API separately from UI
   - Test individual components in isolation
   - Simplify the problem (e.g., hardcode data instead of API call)

USEFUL COMMANDS:
----------------
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild database
rm -rf prisma/dev.db && npx prisma migrate dev && npx prisma db seed

# Test API directly
curl 'http://localhost:3000/api/search?q=prop%2050' | python3 -m json.tool

# Run specific test
npm run test:accept -- tests/acceptance.home.spec.ts --timeout=60000

# Check what's using port 3000
lsof -ti:3000

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Install Playwright browsers
npx playwright install --with-deps
```

GETTING HELP:
-------------
- Check existing markdown files in project root for more context
- Review `SEARCH_RESULTS_ISSUE.md` for detailed bug analysis
- Review `FINAL_STATUS.md` for what's been tried
- Check browser console for error messages
- Use React DevTools to inspect component state

================================================================================
                              FINAL NOTES
================================================================================

This project is close to being fully functional. The main blocker is the 
search results display bug. Once that's fixed, the app should work as 
intended.

KEY TAKEAWAYS:
--------------
1. The backend (API) is working correctly
2. The frontend state management has a bug preventing results from displaying
3. All other features appear to be working
4. The codebase is well-structured and maintainable
5. Testing infrastructure is in place

SUCCESS LOOKS LIKE:
-------------------
- User searches for "Prop 50" → Results appear immediately
- User can click a result → Detail page loads
- Reading level toggle works → Text changes
- Citations work → Quotes appear with links
- ZIP lookup works → Representatives appear
- All Playwright tests pass
- Website looks professional and polished

GOOD LUCK!
----------
Take your time, test thoroughly, and don't hesitate to add logging to 
understand what's happening. The bug is likely a simple state management 
issue that will become clear once you trace through the code execution.

================================================================================
                            END OF BRIEF
================================================================================

