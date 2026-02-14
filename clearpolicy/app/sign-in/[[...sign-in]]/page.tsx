import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

const hasClerkKey =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0 &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("YOUR_");

export default function SignInPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading-display)" }}>
            ClearPolicy
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Sign in to save conversations and access your history
          </p>
        </div>
        {hasClerkKey ? (
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-lg rounded-2xl border border-[var(--border-light)]",
              },
              variables: {
                colorPrimary: "var(--accent-blue)",
                colorBackground: "var(--bg-card)",
                colorText: "var(--text-primary)",
                colorInputBackground: "var(--bg-secondary)",
                borderRadius: "12px",
              },
            }}
            signUpUrl="/sign-up"
            afterSignInUrl="/"
          />
        ) : (
          <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 text-center text-sm text-[var(--text-secondary)] space-y-3">
            <p>Sign-in is not configured for this environment.</p>
            <p className="text-xs">If you added Clerk keys in Vercel, trigger a new deployment so the app can use them.</p>
            <Link href="/" className="mt-4 inline-block font-medium text-[var(--accent-blue)] hover:underline">
              Return home
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
