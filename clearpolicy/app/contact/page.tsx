import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="font-heading text-3xl font-bold text-[var(--cp-text)] tracking-tight mb-4">
        Contact
      </h1>
      <p className="text-[var(--cp-muted)] leading-relaxed mb-8">
        Have questions, feedback, or suggestions? We&apos;d love to hear from you.
      </p>

      <div className="space-y-6">
        <div className="rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-6">
          <h2 className="text-lg font-semibold text-[var(--cp-text)] mb-2">
            Email
          </h2>
          <p className="text-sm text-[var(--cp-muted)]">
            Reach us at{" "}
            <a
              href="mailto:hello@clearpolicy.org"
              className="text-[var(--cp-accent)] hover:underline"
            >
              hello@clearpolicy.org
            </a>
          </p>
        </div>

        <div className="rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-6">
          <h2 className="text-lg font-semibold text-[var(--cp-text)] mb-2">
            Report an Issue
          </h2>
          <p className="text-sm text-[var(--cp-muted)]">
            Found inaccurate information or a bug?{" "}
            <a
              href="https://github.com/pranilraichura/OpenPolicy/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--cp-accent)] hover:underline"
            >
              Open an issue on GitHub
            </a>{" "}
            or email us directly.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-6">
          <h2 className="text-lg font-semibold text-[var(--cp-text)] mb-2">
            About ClearPolicy
          </h2>
          <p className="text-sm text-[var(--cp-muted)]">
            ClearPolicy is a non-partisan civic education tool built by students.{" "}
            <Link href="/about" className="text-[var(--cp-accent)] hover:underline">
              Learn more about our mission
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
