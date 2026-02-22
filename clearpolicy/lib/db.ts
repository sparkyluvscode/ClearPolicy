import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: ["error", "warn"],
    datasourceUrl: process.env.DATABASE_URL,
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
  delayMs = 200
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err);
      const isTransient =
        message.includes("Error code 14") ||
        message.includes("SQLITE_CANTOPEN") ||
        message.includes("SQLITE_BUSY") ||
        message.includes("SQLITE_LOCKED") ||
        message.includes("Unable to open the database");

      if (isTransient && attempt < retries) {
        console.warn(
          `[db] Transient error on attempt ${attempt}/${retries}, retrying in ${delayMs}ms:`,
          message
        );
        await new Promise((r) => setTimeout(r, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error("withRetry: exhausted retries");
}
