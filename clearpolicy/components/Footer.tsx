export default function Footer() {
  return (
    <footer className="mt-8">
      <div className="glass-floating mx-auto max-w-6xl rounded-2xl px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-sm text-gray-700 dark:text-gray-300">© {new Date().getFullYear()} ClearPolicy</div>
          <div className="flex items-center gap-4 text-sm">
            <a href="#" className="text-accent hover:underline focus-ring rounded">Contact</a>
            <a href="#" className="text-accent hover:underline focus-ring rounded">FAQ</a>
            <a href="#" className="text-accent hover:underline focus-ring rounded">Privacy</a>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">Made in California</div>
      </div>
    </footer>
  );
}
