import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;

  // If it's a non-file URL (postgres, mysql, etc.), use it directly
  if (envUrl && !envUrl.startsWith("file:")) {
    return envUrl;
  }

  // For SQLite: compute the absolute path to prisma/dev.db at runtime
  const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");

  if (!fs.existsSync(dbPath)) {
    // Try one more common location relative to the project
    const altPath = path.resolve(__dirname, "..", "prisma", "dev.db");
    if (fs.existsSync(altPath)) {
      return `file:${altPath}`;
    }
    console.error(
      `[db] SQLite file not found at ${dbPath} or ${altPath}. ` +
        `Falling back to DATABASE_URL="${envUrl}".`
    );
    return envUrl || `file:${dbPath}`;
  }

  return `file:${dbPath}`;
}

function createPrismaClient() {
  const url = resolveDatabaseUrl();
  return new PrismaClient({
    log: ["error", "warn"],
    datasourceUrl: url,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Wraps a Prisma call with retry logic for transient SQLite errors
 * (SQLITE_CANTOPEN, SQLITE_BUSY, SQLITE_LOCKED).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 200,
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const isTransient =
        message.includes("Error code 14") ||
        message.includes("SQLITE_CANTOPEN") ||
        message.includes("SQLITE_BUSY") ||
        message.includes("SQLITE_LOCKED") ||
        message.includes("Unable to open the database");

      if (isTransient && attempt < retries) {
        console.warn(
          `[db] Transient error on attempt ${attempt}/${retries}, retrying in ${delayMs}ms:`,
          message,
        );
        await new Promise((r) => setTimeout(r, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error("withRetry: exhausted retries");
}
