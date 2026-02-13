import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_ADMIN_IDS = (process.env.CLERK_ADMIN_USER_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export default async function AdminAnalyticsPage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/sign-in");
  if (ALLOWED_ADMIN_IDS.length > 0 && !ALLOWED_ADMIN_IDS.includes(clerkUserId)) {
    redirect("/");
  }

  const [
    totalUsers,
    activeUsersLast30,
    totalConversations,
    conversationsWithCount,
    topPolicies,
    topZips,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        conversations: {
          some: {
            updatedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    }),
    prisma.conversation.count(),
    prisma.conversation.aggregate({
      _sum: { messageCount: true },
      _avg: { messageCount: true },
      _count: true,
    }),
    prisma.conversation.groupBy({
      by: ["policyName"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.conversation.groupBy({
      by: ["zipCode"],
      where: { zipCode: { not: null } },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),
  ]);

  const avgQuestions =
    conversationsWithCount._count > 0 && conversationsWithCount._avg.messageCount
      ? Math.round(conversationsWithCount._avg.messageCount / 2)
      : 0;

  return (
    <main className="container page-section">
      <h1
        className="mb-8 text-3xl font-bold text-[var(--text-primary)]"
        style={{ fontFamily: "var(--font-heading-display)" }}
      >
        Admin · Analytics
      </h1>

      <section className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Total users
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {totalUsers}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Active users (last 30 days)
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {activeUsersLast30}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Total conversations
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {totalConversations}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Avg questions per conversation
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {avgQuestions}
          </p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            Top 10 policies by conversation count
          </h2>
          <ul className="space-y-2">
            {topPolicies.map((row) => (
              <li
                key={row.policyName}
                className="flex justify-between text-sm text-[var(--text-primary)]"
              >
                <span className="truncate pr-2">{row.policyName}</span>
                <span className="font-medium">{row._count.id}</span>
              </li>
            ))}
            {topPolicies.length === 0 && (
              <li className="text-sm text-[var(--text-secondary)]">
                No data yet.
              </li>
            )}
          </ul>
        </section>
        <section className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            Top 10 ZIPs by user count
          </h2>
          <ul className="space-y-2">
            {topZips.map((row) => (
              <li
                key={row.zipCode ?? "unknown"}
                className="flex justify-between text-sm text-[var(--text-primary)]"
              >
                <span>{row.zipCode ?? "—"}</span>
                <span className="font-medium">{row._count.userId}</span>
              </li>
            ))}
            {topZips.length === 0 && (
              <li className="text-sm text-[var(--text-secondary)]">
                No data yet.
              </li>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
