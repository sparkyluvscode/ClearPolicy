# My Research / Saved Searches Test Report

**Test Date:** February 23, 2026  
**Focus:** Verify that saved searches appear in My Research (/history) after fix

---

## Test Setup

A Playwright E2E test has been created at `tests/acceptance.my-research.spec.ts` to verify:

1. Open http://localhost:3000
2. Sign in (Clerk)
3. Search for "Fifth Amendment"
4. Wait for results
5. Go to My Research (/history)
6. Confirm the search appears in the list
7. Capture screenshot

---

## How to Run the Test

### Prerequisites
- Dev server running: `npm run dev`
- Clerk configured with real keys (see `API_KEY_SETUP.md`)

### Option A: One-time auth setup + automated test

1. **Save your session** (run once, sign in when browser opens):
   ```bash
   npm run test:my-research:setup
   ```
   - A browser will open at `/sign-in`
   - Sign in with your email/password or OAuth
   - Click **Resume** in the Playwright Inspector
   - This saves your session to `.auth/user.json`

2. **Run the automated test** (uses saved session):
   ```bash
   npm run test:my-research
   ```
   - Runs search → My Research flow without manual steps
   - Screenshot saved to `test-results/my-research-history.png`

### Option B: Fully manual

```bash
npx playwright test tests/acceptance.my-research.spec.ts --headed --project=chromium
```
- Test will pause at sign-in; sign in, then click Resume
- Continues with search → history flow
- Screenshot at `test-results/my-research-history.png`

---

## Expected Result

**Fix verified when:**
- After searching while signed in, navigating to `/history` shows the search in the list
- Screenshot shows your search (e.g., "Fifth Amendment") under "Today" or "This week"

**Fix NOT working when:**
- My Research shows "No research yet" after a completed search
- Screenshot shows empty state

---

## Technical Flow

1. **Search page** (`/search`) saves via:
   - Omni API returns `conversationId` when user is signed in
   - Fallback: `POST /api/conversations/save-search` when `conversationId` is null but user is signed in (`credentials: "include"`)

2. **History page** (`/history`) loads via:
   - `GET /api/conversations` (requires auth)
   - Renders conversations grouped by date (Today, Yesterday, This week, Older)

3. **Potential issues:**
   - Auth cookie not sent with Omni/save-search request
   - Save-search fallback not triggering (e.g., timing, `cards` not ready)

---

## Screenshot Location

After a successful run:
```
clearpolicy/test-results/my-research-history.png
```
