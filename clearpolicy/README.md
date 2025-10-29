## End-to-end acceptance tests

- Install browsers: `npx playwright install --with-deps`
- Run dev server: `npm run dev`
- In another shell run tests: `npm run test:accept`

The test suite validates:
- Live and sample measure cards content utility, reading level diffs, citations, and source meter
- ZIP panel happy/invalid paths
- Accessibility via axe (score must be >=95 and no critical violations)
- Mobile viewport responsiveness

# ClearPolicy (CAC MVP)

Non-partisan civic education web app to help students and first-time voters understand complex policy quickly with line-referenced citations and a reading-level toggle.

## Features
- Disambiguation chips for ambiguous queries (e.g., "prop 17 retail theft")
- Bill/Prop Card with TL;DR, What it does, Who is affected, Pros, Cons
- Reading-level slider (5th / 8th / 12th) with visible changes
- Source Meter showing percent of covered paragraphs
- Local lens: ZIP → representatives (Google Civic) with graceful fallback
- Seeded CA propositions: Prop 17 (2020) and Prop 47 (2014)

## Non‑partisan pledge
We do not persuade. We present facts and clearly label pros/cons with sources. Every claim is traceable to at least one primary source link.

## Tech stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (file: dev.db)
- APIs: Congress.gov v3, Open States v3, Google Civic Information
- Utilities: Zod for validation, diff-match-patch (optional)

## Setup

1. Install dependencies
```bash
npm i
```

2. Environment variables
Create `.env` with:
```
CONGRESS_API_KEY=your_api_data_gov_key
OPENSTATES_API_KEY=your_openstates_key
GOOGLE_CIVIC_API_KEY=your_google_civic_key
NEXT_PUBLIC_APP_NAME=ClearPolicy
DATABASE_URL="file:./dev.db"
```

3. Prisma: generate, migrate, and seed
```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

4. Run dev server
```bash
npm run dev
```

Visit http://localhost:3000

## API keys (How to get real data)

### 1. Congress.gov API (Federal Bills)
1. Go to https://api.data.gov/signup/
2. Fill out the form with your email
3. Wait for email approval (usually 1-24 hours)
4. Copy your API key
5. Replace `your_api_data_gov_key` in `.env` with your real key

### 2. Open States API (State Bills)
1. Visit https://openstates.org/accounts/signup/
2. Create a free account
3. Go to https://openstates.org/api/keys/
4. Generate a new API key
5. Replace `your_openstates_key` in `.env` with your real key

### 3. Google Civic Information API
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project (or use existing)
3. Enable the "Civic Information API"
4. Create credentials → API Key
5. Replace `your_google_civic_key` in `.env` with your real key

After adding real keys, restart the dev server to see live data instead of sample data.

## Deployment (Vercel)
- Import this repo
- Add env vars: CONGRESS_API_KEY, OPENSTATES_API_KEY, GOOGLE_CIVIC_API_KEY, NEXT_PUBLIC_APP_NAME, DATABASE_URL
- Set build command (default) and run

## Known limitations & stretch goals
- Live API search may be rate-limited or unavailable; UI falls back to seeded content
- Amendment diff UI is not implemented (stretch)
- Spanish headings and PDF export are stretch items

## Content policy
- Facts vs arguments: pros/cons are labeled and sourced
- Every section must have at least one primary source link
- Last updated: 2025-10-27

## Troubleshooting
- CORS or API failures: ensure env keys are set; banner shows when missing
- Rate limits: try again later; seeded content remains available
- Civic API gaps: returns empty officials array without erroring

## Testing checklist
- Home: type "prop 17 retail theft" → two chips appear
- Measure page: TL;DR, sections, Source Meter, citations toggle with at least two quotes
- Reading level: toggle 5 ↔ 12 and observe shorter sentences
- ZIP panel: enter 95014 → officials or polite fallback
- Lighthouse: no critical accessibility or console errors


