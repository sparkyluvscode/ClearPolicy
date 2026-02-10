# Database Setup

ClearPolicy uses **SQLite** by default (via Prisma). This works for local development. The UN Docs features (history, chat) use the `UnDocumentAnalysis` table.

## Local development

In `clearpolicy/.env`:

```env
DATABASE_URL="file:./dev.db"
```

Then run:

```bash
cd clearpolicy && npx prisma migrate dev
```

The database file will be created at `clearpolicy/prisma/dev.db`.

## Production (e.g. Vercel)

SQLite with a file path **does not work** on serverless (Vercel, etc.) because the filesystem is read-only and ephemeral. You will see errors like:

- "Unable to open the database file"
- "Error code 14"

**Options:**

1. **Turso** (SQLite-compatible, serverless): https://turso.tech  
   - Create a DB, get the URL and auth token, then:
   - `DATABASE_URL="libsql://your-db.turso.io?authToken=..."`

2. **Neon** or **Vercel Postgres** (PostgreSQL):  
   - Change `provider` in `prisma/schema.prisma` to `"postgresql"` and set `DATABASE_URL` to the Postgres connection string.  
   - You will need to add a migration for Postgres (schema is compatible for the UN tables).

3. **Keep SQLite and accept limited UN features in production**  
   - History and document chat will show: *"Database is temporarily unavailable. You can still analyze new documents."*  
   - New analyses still run (AI works); they just won’t be cached or listed in history.

## If you see "Database is temporarily unavailable"

- **Locally:** Ensure `prisma/dev.db` exists and `DATABASE_URL="file:./dev.db"` in `.env`. Run `npx prisma migrate dev` if needed.
- **In production:** Set `DATABASE_URL` to a hosted database (Turso, Neon, or Vercel Postgres) as above.
