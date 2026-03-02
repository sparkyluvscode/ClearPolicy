import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

const hasClerkKey =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0 &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("YOUR_");

export default function SignInPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string };
}) {
  const afterUrl = searchParams?.redirect_url || "/";

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-[var(--cp-bg)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl font-bold text-[var(--cp-text)]">
            ClearPolicy
          </h1>
          <p className="text-sm text-[var(--cp-muted)] mt-1">
            Sign in to save conversations and access your history
          </p>
        </div>
        {hasClerkKey ? (
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-lg rounded-2xl border border-[var(--cp-border)]",
              },
              variables: {
                colorPrimary: "#4A7BBA",
                colorBackground: "#FAF9F6",
                colorText: "#1A1A1A",
                colorInputBackground: "#FDFCF7",
                borderRadius: "12px",
              },
            }}
            signUpUrl="/sign-up"
            afterSignInUrl={afterUrl}
          />
        ) : (
          <div className="rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-6 text-center text-sm text-[var(--cp-muted)] space-y-3">
            <p>Sign-in is not configured for this environment.</p>
            <p className="text-xs">If you added Clerk keys in Vercel, trigger a new deployment so the app can use them.</p>
            <Link href="/" className="mt-4 inline-block font-medium text-[var(--cp-accent)] hover:underline">
              Return home
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
