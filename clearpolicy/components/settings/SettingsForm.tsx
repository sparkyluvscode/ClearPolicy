"use client";

import { useState } from "react";

type ClerkUser = {
  id: string;
  email: string;
  fullName?: string;
  imageUrl?: string;
};

type DbUser = {
  id: string;
  zipCode: string | null;
  preferredViewAs: string | null;
  theme: string | null;
};

const VIEW_AS_OPTIONS = [
  "everyone",
  "student",
  "homeowner",
  "small_biz",
  "renter",
  "immigrant",
  "parent",
];

export function SettingsForm({
  clerkUser,
  dbUser,
}: {
  clerkUser: ClerkUser;
  dbUser?: DbUser;
}) {
  const [zipCode, setZipCode] = useState(dbUser?.zipCode ?? "");
  const [preferredViewAs, setPreferredViewAs] = useState(
    dbUser?.preferredViewAs ?? "everyone"
  );
  const [theme, setTheme] = useState(dbUser?.theme ?? "light");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zipCode: zipCode.trim() || null,
          preferredViewAs,
          theme,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setMessage("Saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/settings/export");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export failed");
      setMessage("Export ready (stub).");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      <section className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
          Profile
        </h2>
        <div className="flex items-center gap-4">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--cp-accent)]/20 text-sm font-semibold text-[var(--cp-accent)]"
            aria-hidden
          >
            {clerkUser.fullName?.trim()
              ? clerkUser.fullName.trim().slice(0, 2).toUpperCase()
              : clerkUser.email?.slice(0, 2).toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">
              {clerkUser.fullName || "User"}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {clerkUser.email}
            </p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            Preferences
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="zipCode"
                className="mb-1 block text-sm font-medium text-[var(--text-secondary)]"
              >
                Default ZIP code
              </label>
              <input
                id="zipCode"
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="e.g. 95746"
                className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-4 py-2.5 text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20"
              />
            </div>
            <div>
              <label
                htmlFor="viewAs"
                className="mb-1 block text-sm font-medium text-[var(--text-secondary)]"
              >
                Default &quot;View as&quot; persona
              </label>
              <select
                id="viewAs"
                value={preferredViewAs}
                onChange={(e) => setPreferredViewAs(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-4 py-2.5 text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20"
              >
                {VIEW_AS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="theme"
                className="mb-1 block text-sm font-medium text-[var(--text-secondary)]"
              >
                Theme
              </label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-4 py-2.5 text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--accent-blue)] px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/50"
            >
              {saving ? "Saving..." : "Save preferences"}
            </button>
            {message && (
              <span className="text-sm text-[var(--text-secondary)]">
                {message}
              </span>
            )}
          </div>
        </section>
      </form>

      <section className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
          Data & account
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/30 disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "Export my data"}
          </button>
          <button
            type="button"
            onClick={async () => {
              const res = await fetch("/api/settings/delete-account", { method: "POST" });
              const data = await res.json();
              setMessage(data.message ?? (res.ok ? "Request received." : data.error));
            }}
            className="rounded-lg border border-[var(--accent-coral)]/40 bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--accent-coral)] transition-colors hover:bg-[var(--accent-coral)]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-coral)]/30"
          >
            Delete my account
          </button>
        </div>
        <p className="mt-3 text-xs text-[var(--text-secondary)]">
          Export returns your data as JSON (stub). Delete account is a placeholder
          for future implementation.
        </p>
      </section>
    </div>
  );
}
