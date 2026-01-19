export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--cp-border)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.4fr,0.6fr,0.6fr]">
        <div className="space-y-2">
          <div className="text-sm font-semibold uppercase tracking-wide text-[var(--cp-text)]">ClearPolicy</div>
          <p className="max-w-sm text-sm text-[var(--cp-muted)]">
            Non-partisan civic education with plain-English summaries and traceable sources.
          </p>
          <div className="text-xs text-[var(--cp-muted)]">© {new Date().getFullYear()} ClearPolicy</div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--cp-muted)]">Product</div>
          <a href="/browse" className="block muted-link focus-ring rounded">Browse</a>
          <a href="/compare" className="block muted-link focus-ring rounded">Compare</a>
          <a href="/impact" className="block muted-link focus-ring rounded">Impact</a>
        </div>
        <div className="space-y-2 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--cp-muted)]">Company</div>
          <a href="/about" className="block muted-link focus-ring rounded">About</a>
          <a href="/contact" className="block muted-link focus-ring rounded">Contact</a>
          <a href="/privacy" className="block muted-link focus-ring rounded">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
