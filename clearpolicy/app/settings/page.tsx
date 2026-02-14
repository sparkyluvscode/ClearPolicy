import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const dynamic = "force-dynamic";

function clerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const sk = process.env.CLERK_SECRET_KEY;
  return (
    typeof pk === "string" && pk.length > 0 && !pk.startsWith("YOUR_") &&
    typeof sk === "string" && sk.length > 0 && !sk.startsWith("YOUR_")
  );
}

export default async function SettingsPage() {
  let clerkUser;
  try {
    clerkUser = await currentUser();
  } catch (e) {
    console.error("[settings] Clerk currentUser failed:", e);
    redirect(clerkConfigured() ? "/sign-in" : "/");
  }
  if (!clerkUser) redirect(clerkConfigured() ? "/sign-in" : "/");

  let user = null;
  try {
    user = await prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id },
    });
  } catch (e) {
    console.error("[settings] Prisma/DB failed:", e);
  }

  return (
    <main className="container page-section">
      <h1
        className="mb-8 text-3xl font-bold text-[var(--text-primary)]"
        style={{ fontFamily: "var(--font-heading-display)" }}
      >
        Settings
      </h1>
      {user === null && (
        <div className="mb-6 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface-2)] p-4 text-sm text-[var(--cp-muted)]">
          Settings are temporarily unavailable (database connection issue). You can still sign out.{" "}
          <Link href="/" className="underline focus-ring rounded">
            Return home
          </Link>
        </div>
      )}
      <SettingsForm
        clerkUser={{
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
          fullName: clerkUser.fullName ?? undefined,
          imageUrl: clerkUser.imageUrl,
        }}
        dbUser={user ?? undefined}
      />
    </main>
  );
}
