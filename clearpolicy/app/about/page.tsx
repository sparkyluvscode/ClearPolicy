import FeatureGrid from "@/components/FeatureGrid";
import Illustration from "@/components/Illustration";

export default function AboutPage() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="card p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">About ClearPolicy</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Plain‑English policy summaries with sources, built for students, parents, and voters.</p>
      </header>
      <Illustration label="How it looks" />
      <FeatureGrid />
      <section className="card p-6">
        <h2 className="section-title">How it works</h2>
        <ol className="mt-3 grid gap-4 md:grid-cols-3 text-sm">
          <li className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="font-medium">1. Type a law or ZIP</div>
            <div className="mt-1 text-gray-600 dark:text-gray-400">Search any bill, proposition, or your ZIP for local officials.</div>
          </li>
          <li className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="font-medium">2. See a plain‑English summary</div>
            <div className="mt-1 text-gray-600 dark:text-gray-400">Sections include TL;DR, What, Who, Pros, Cons with citations.</div>
          </li>
          <li className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="font-medium">3. Verify and choose</div>
            <div className="mt-1 text-gray-600 dark:text-gray-400">Show cited lines, adjust reading level, and explore official sources.</div>
          </li>
        </ol>
      </section>
    </div>
  );
}


