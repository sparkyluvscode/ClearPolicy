"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("cp_theme") : null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextDark = stored ? stored === "dark" : prefersDark;
    setDark(nextDark);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle('dark', nextDark);
    }
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`glass-nav sticky top-0 z-50 ${scrolled ? "shadow-glass-lg" : ""}`}>
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-1.5 focus-ring rounded px-1" aria-label="ClearPolicy home">
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gray-800/90 to-gray-900/95 dark:from-gray-700/90 dark:to-gray-900/95"></div>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-white/0 via-white/10 to-white/30 opacity-60"></div>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-transparent via-white/5 to-white/20"></div>
            <span className="relative px-2.5 py-1 text-base font-semibold text-white tracking-tight">Clear</span>
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Policy</span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm ml-1">
          <Link href="/about" className="text-gray-800 dark:text-gray-200 hover:underline focus-ring rounded px-1">About</Link>
          <Link href="/impact" className="text-gray-800 dark:text-gray-200 hover:underline focus-ring rounded px-1">Impact</Link>
          <Link href="/contact" className="text-gray-800 dark:text-gray-200 hover:underline focus-ring rounded px-1">Contact</Link>
        </nav>
        <form
          className="ml-auto flex-1 max-w-xl"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (!q.trim()) return;
            const url = new URL("/", window.location.origin);
            url.searchParams.set("q", q);
            router.push(url.toString());
          }}
        >
          <label className="sr-only" htmlFor="global-search">Search measures</label>
          <input
            id="global-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a bill or proposition (e.g., prop 17 retail theft)"
            className="glass-input w-full px-3 py-2 text-sm"
          />
        </form>
        <button
          type="button"
          className="liquid-button px-3 py-2 text-sm"
          aria-pressed={dark}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={() => {
            const next = !dark; setDark(next);
            document.documentElement.classList.toggle('dark', next);
            try { localStorage.setItem("cp_theme", next ? "dark" : "light"); } catch {}
          }}
        >
          {dark ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}


