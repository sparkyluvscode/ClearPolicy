export default function Footer() {
  return (
    <footer className="mt-8">
      <div className="mx-auto max-w-6xl rounded-2xl p-[1px] bg-gradient-to-t from-white/70 to-white/10 dark:from-slate-900/40 dark:to-transparent">
        <div className="glass-floating rounded-2xl px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gray-800/90 to-gray-900/95 dark:from-gray-700/90 dark:to-gray-900/95"></div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-white/0 via-white/10 to-white/30 opacity-60"></div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-transparent via-white/5 to-white/20"></div>
              <span className="relative px-3 py-1.5 text-sm font-semibold text-white tracking-tight">Clear</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Policy</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="/contact" className="text-accent hover:underline focus-ring rounded">Contact</a>
            <a href="/about" className="text-accent hover:underline focus-ring rounded">About</a>
            <a href="/privacy" className="text-accent hover:underline focus-ring rounded">Privacy</a>
          </div>
        </div>
        <div className="mt-2 text-center text-sm italic text-accent/90">Making policy as clear as glass.</div>
        <div className="mt-3 flex items-center justify-center gap-6 opacity-80">
          {/* placeholder trust badges */}
          <span aria-label="Press badge" className="h-6 w-20 rounded bg-gray-900/10 dark:bg-white/10" />
          <span aria-label="Partner badge" className="h-6 w-20 rounded bg-gray-900/10 dark:bg-white/10" />
          <span aria-label="School/club badge" className="h-6 w-20 rounded bg-gray-900/10 dark:bg-white/10" />
        </div>
        <div className="mt-3 text-xs text-gray-500">Made in California</div>
        </div>
      </div>
    </footer>
  );
}
