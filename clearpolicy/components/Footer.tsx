export default function Footer() {
  return (
    <footer className="mt-10 border-t border-gray-200 dark:border-gray-800 py-8">
      <div className="mx-auto max-w-6xl px-4 text-sm text-gray-600 dark:text-gray-400 grid gap-4 md:grid-cols-3">
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">ClearPolicy</div>
          <div className="mt-1">Clarity on every ballot.</div>
        </div>
        <nav className="space-y-1">
          <a href="#about" className="hover:underline">About</a>
          <div><a href="mailto:team@clearpolicy.app" className="hover:underline">Contact</a></div>
          <div><a href="#privacy" className="hover:underline">Privacy</a></div>
        </nav>
        <div className="text-xs">Sources include Open States and Congress.gov. Neutral, sourced, accessible.</div>
      </div>
    </footer>
  );
}


