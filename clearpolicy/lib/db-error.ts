/**
 * Normalize database errors for API responses.
 * SQLite "Unable to open the database file" (e.g. on serverless) should
 * return a user-friendly message instead of the raw Prisma error.
 */

const DB_UNAVAILABLE_PATTERNS = [
  /unable to open the database file/i,
  /Error code 14/i,
  /SQLITE_CANTOPEN/i,
  /database (file )?is (locked|read-only)/i,
  /no such file or directory.*\.db/i,
  /Invalid.*prisma\.\w+\.(findUnique|findMany).*invocation/i,
];

const FRIENDLY_MESSAGE =
  "Database is temporarily unavailable. History and chat may not work until it's connected. You can still analyze new documents.";

export function isDatabaseUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return DB_UNAVAILABLE_PATTERNS.some((p) => p.test(message));
}

export function getFriendlyDatabaseErrorMessage(error: unknown): string {
  return isDatabaseUnavailableError(error) ? FRIENDLY_MESSAGE : (error instanceof Error ? error.message : String(error));
}
