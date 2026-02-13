import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: clerkUser.id },
  });

  return (
    <main className="container page-section">
      <h1
        className="mb-8 text-3xl font-bold text-[var(--text-primary)]"
        style={{ fontFamily: "var(--font-heading-display)" }}
      >
        Settings
      </h1>
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
