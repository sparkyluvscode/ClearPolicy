"use client";
import FeatureGrid from "@/components/FeatureGrid";
import Link from "next/link";

export default function AboutPage() {
  const quickLinks = [
    { label: "Proposition 17 (2020)", slug: "ca-prop-17-2020" },
    { label: "Proposition 47 (2014)", slug: "ca-prop-47-2014" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="card p-6">
        <h1 className="text-2xl font-semibold text-gray-100 dark:text-gray-900">About ClearPolicy</h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-600">Plain‑English policy summaries with sources, built for students, parents, and voters.</p>
      </header>
      <FeatureGrid />
      <section className="card p-6">
        <h2 className="section-title">How it works</h2>
        <ol className="mt-3 grid gap-4 md:grid-cols-3 text-sm">
          <li className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="font-medium">1. Type a law or ZIP</div>
            <div className="mt-1 text-gray-400 dark:text-gray-600">Search any bill, proposition, or your ZIP for local officials.</div>
          </li>
          <li className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="font-medium">2. See a plain‑English summary</div>
            <div className="mt-1 text-gray-400 dark:text-gray-600">Sections include TL;DR, What, Who, Pros, Cons with citations.</div>
          </li>
          <li className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="font-medium">3. Verify and choose</div>
            <div className="mt-1 text-gray-400 dark:text-gray-600">Show cited lines, adjust reading level, and explore official sources.</div>
          </li>
        </ol>
      </section>

      <section className="card p-6">
        <h2 className="section-title">Sample measures</h2>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-600">Explore fully‑featured demo cards with reading levels, citations, and sources.</p>
        <div className="mt-3 overflow-x-auto no-scrollbar">
          <ul className="flex gap-3 min-w-full pr-2">
            {quickLinks.map((l) => (
              <li key={l.slug} className="min-w-[16rem]">
                <Link href={`/measure/${l.slug}`} className="glass-panel p-4 block lift focus-ring rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-100 dark:text-gray-900">{l.label}</div>
                    <span className="badge">Demo</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 dark:text-gray-600">Tap to open an example measure card.</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}


