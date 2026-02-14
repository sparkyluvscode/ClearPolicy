import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

const hasClerkKey =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0 &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("YOUR_");

export default function SignUpPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading-display)" }}>
            ClearPolicy
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Create an account to save your policy research
          </p>
        </div>
        {hasClerkKey ? (
          <SignUp
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
            signInUrl="/sign-in"
            afterSignUpUrl="/"
          />
        ) : (
          <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 text-center text-sm text-[var(--text-secondary)]">
            Sign-up is not configured for this environment.
            <Link href="/" className="mt-4 block font-medium text-[var(--accent-blue)] hover:underline">
              Return home
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
