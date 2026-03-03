import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

const hasClerkKey =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0 &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("YOUR_");

const pageAppearance = {
  ...clerkAppearance,
  variables: {
    ...clerkAppearance.variables,
    colorBackground: "transparent",
  },
  elements: {
    ...clerkAppearance.elements,
    rootBox: "w-full",
    card: "shadow-none bg-transparent border-none p-0 w-full",
    header: "hidden",
    footer: "justify-center",
  },
};

export default function SignInPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string };
}) {
  const afterUrl = searchParams?.redirect_url || "/";

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[var(--cp-bg)] overflow-y-auto">
      {/* Atmospheric glows */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 1200px 800px at 25% -10%, var(--cp-glow-1), transparent 55%), radial-gradient(ellipse 900px 600px at 85% 10%, var(--cp-glow-2), transparent 50%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto px-5 py-12">
        {/* Back link */}
        <div className="text-center mb-8 animate-fade-up">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors mb-8 text-sm no-underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to ClearPolicy
          </Link>

          <h1 className="font-heading text-3xl font-bold text-[var(--cp-text)] tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-[var(--cp-muted)] leading-relaxed max-w-xs mx-auto">
            Sign in to access your research and saved history.
          </p>
        </div>

        {/* Glass card with Clerk form */}
        {hasClerkKey ? (
          <div
            className="glass-card rounded-2xl p-6 sm:p-8 animate-fade-up"
            style={{ animationDelay: "80ms" }}
          >
            <SignIn
              appearance={pageAppearance}
              signUpUrl="/sign-up"
              afterSignInUrl={afterUrl}
            />
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center animate-fade-up">
            <p className="text-sm text-[var(--cp-muted)] mb-2">
              Sign-in is not configured for this environment.
            </p>
            <p className="text-xs text-[var(--cp-tertiary)] mb-4">
              If you added Clerk keys in Vercel, trigger a new deployment so the app can use them.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--cp-accent)] hover:underline"
            >
              Return home
            </Link>
          </div>
        )}

        {/* Sign-up link */}
        <p
          className="text-center text-sm text-[var(--cp-muted)] mt-6 animate-fade-up"
          style={{ animationDelay: "160ms" }}
        >
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-[var(--cp-accent)] hover:underline">
            Get started free
          </Link>
        </p>

        {/* Trust indicators */}
        <div
          className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-[var(--cp-tertiary)] animate-fade-up"
          style={{ animationDelay: "240ms" }}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[var(--cp-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Every claim cited
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[var(--cp-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            Non-partisan
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[var(--cp-coral)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Local context
          </span>
        </div>
      </div>
    </div>
  );
}
