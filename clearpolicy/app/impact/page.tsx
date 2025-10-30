import Testimonials from "@/components/Testimonials";

export default function ImpactPage() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="card p-6">
        <h1 className="text-2xl font-semibold text-gray-100 dark:text-gray-900">Impact</h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-600">Stories from people using ClearPolicy to understand measures faster.</p>
      </header>
      <Testimonials />
    </div>
  );
}


