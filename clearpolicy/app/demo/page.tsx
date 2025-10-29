import HomeDemo from "@/components/HomeDemo";
import Illustration from "@/components/Illustration";

export default function DemoPage() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="card p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Demo</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Watch how ClearPolicy summarizes a measure and shows sources.</p>
      </header>
      <HomeDemo />
      <Illustration label="App in action" />
      <section className="card p-6">
        <h2 className="section-title">Try it yourself</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Go back to the home page search and try a sample like <span className="font-medium text-gray-800 dark:text-gray-200">prop 17</span> or <span className="font-medium text-gray-800 dark:text-gray-200">H.R. 50</span>.</p>
      </section>
    </div>
  );
}


