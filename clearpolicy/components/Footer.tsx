import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="cp-site-footer mt-20 pb-10">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-12">
        {/* Divider */}
        <div className="h-px w-full bg-[var(--cp-border)] mb-12" />

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          {/* Brand */}
          <div className="space-y-4 max-w-xs">
            <div className="flex items-center gap-2">
              <Image src="/clearpolicy-logo.png" alt="ClearPolicy" width={28} height={28} className="object-contain" />
              <span className="font-heading text-lg font-bold tracking-tight text-[var(--cp-text)]">
                ClearPolicy
              </span>
            </div>
            <p className="text-sm text-[var(--cp-muted)] leading-relaxed">
              Non-partisan civic education with plain-English summaries and traceable sources. Built by students who wanted to understand policy.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16 text-sm">
            <div className="space-y-3">
              <p className="section-label">Product</p>
              <Link href="/browse" className="block text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors">Browse</Link>
              <Link href="/compare" className="block text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors">Compare</Link>
            </div>
            <div className="space-y-3">
              <p className="section-label">Resources</p>
              <Link href="/about" className="block text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors">About</Link>
              <Link href="/privacy" className="block text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors">Privacy</Link>
              <Link href="/contact" className="block text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors">Contact</Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-[var(--cp-tertiary)]">
          <span>&copy; {new Date().getFullYear()} ClearPolicy &middot; Powered by <span className="font-semibold text-[var(--cp-accent)]">Omni-Search</span></span>
          <span>Made for informed citizens</span>
        </div>
      </div>
    </footer>
  );
}
