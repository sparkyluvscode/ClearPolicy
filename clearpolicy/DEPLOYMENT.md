# Deploying ClearPolicy to Vercel

## 1. Set Root Directory

This app lives in the **`clearpolicy`** subdirectory of the repo. In Vercel:

1. Project **Settings** → **General** → **Root Directory**
2. Set to **`clearpolicy`** (or leave blank only if the repo root is the app).
3. Save.

If Root Directory is wrong, `npm install` / `prisma generate` may run in the wrong place, **and the middleware will not be found** (leading to "Cannot find the middleware module" or MIDDLEWARE_INVOCATION_FAILED). The app root must be `clearpolicy` so that `middleware.ts` is at the Next.js project root.

## 2. Environment Variables

In Vercel **Settings** → **Environment Variables**, set (at least for Production):

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes (for DB features) | Use a **hosted database** in production. SQLite with `file:./dev.db` does not work on Vercel (read-only filesystem). Use [Vercel Postgres](https://vercel.com/storage/postgres), [Turso](https://turso.tech), or another hosted DB and set the connection URL here. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes (for auth) | From [Clerk Dashboard](https://dashboard.clerk.com) → API Keys. The build will succeed without it, but sign-in/sign-up will not work until you add it. |
| `CLERK_SECRET_KEY` | Yes (for auth) | From Clerk Dashboard → API Keys. **Required for auth and for middleware.** If either Clerk key is missing or a placeholder, the middleware skips Clerk and the app still loads; set both for full auth and route protection. |
| `OPENAI_API_KEY` | Yes (for search answers) | From OpenAI. |
| `CONGRESS_API_KEY` | Optional | For live federal bill data. |
| `OPENSTATES_API_KEY` | Optional | For state bill data. |
| `GOOGLE_CIVIC_API_KEY` | Optional | For ZIP lookups. |

If `DATABASE_URL` is missing, Prisma will fail when any API route that uses the DB is called. For a minimal deploy you can point it at a placeholder Postgres URL or add a small SQLite-compatible URL if your provider supports it; otherwise use a real hosted DB.

## 3. Build

- **Build Command:** `npm run build` (default).
- **Output Directory:** `.next` (default for Next.js).
- **Install Command:** `npm install` (default).

After saving Root Directory and env vars, trigger a new deployment (e.g. **Redeploy** from the Deployments tab).
