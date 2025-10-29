"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [dark, setDark] = useState(false);
  // Initialize theme from localStorage or system
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("cp_theme");
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextDark = saved ? saved === 'dark' : prefersDark;
    setDark(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
  }, []);
  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="text-lg font-semibold text-gray-900 dark:text-gray-100 focus-ring rounded px-1" aria-label="ClearPolicy home">
          {process.env.NEXT_PUBLIC_APP_NAME || "ClearPolicy"}
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link href="#about" className="text-gray-700 dark:text-gray-300 hover:underline focus-ring rounded px-1">What is this?</Link>
          <div className="relative group">
            <button className="text-gray-700 dark:text-gray-300 hover:underline focus-ring rounded px-1" aria-haspopup="true" aria-expanded="false">Try a sample</button>
            <div className="absolute mt-2 hidden group-hover:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 min-w-[14rem]">
              <ul className="text-sm">
                <li><Link className="block px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded" href="/measure/ca-prop-17-2020">Proposition 17 (2020)</Link></li>
                <li><Link className="block px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded" href="/measure/ca-prop-47-2014">Proposition 47 (2014)</Link></li>
              </ul>
            </div>
          </div>
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
          onClick={() => {
            const next = !dark; setDark(next);
            document.documentElement.classList.toggle('dark', next);
            localStorage.setItem('cp_theme', next ? 'dark' : 'light');
          }}
        >
          {dark ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}


