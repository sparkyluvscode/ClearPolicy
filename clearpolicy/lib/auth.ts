import { auth as clerkAuth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Get current Clerk user (for server components).
 */
export async function getCurrentUser() {
  return clerkAuth();
}

/**
 * Require auth: redirect to sign-in if not logged in.
 * Use in server routes/pages that must be protected.
 */
export async function requireAuth() {
  const { userId } = await clerkAuth();
  if (!userId) redirect("/sign-in");
  return userId;
}
