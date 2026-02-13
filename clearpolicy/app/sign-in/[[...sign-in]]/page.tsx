import { SignIn } from "@clerk/nextjs";

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
      </div>
    </main>
  );
}
