import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

const hasClerkKey =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0 &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("YOUR_");

export default function SignUpPage({
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
            Get Started with ClearPolicy
          </h1>
          <p className="text-sm text-[var(--cp-muted)] mt-1">
            Create a free account to search and explore policies
          </p>
        </div>
        {hasClerkKey ? (
          <SignUp
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
            signInUrl="/sign-in"
            afterSignUpUrl={afterUrl}
          />
        ) : (
          <div className="rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-6 text-center text-sm text-[var(--cp-muted)]">
            Sign-up is not configured for this environment.
            <Link href="/" className="mt-4 block font-medium text-[var(--cp-accent)] hover:underline">
              Return home
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
