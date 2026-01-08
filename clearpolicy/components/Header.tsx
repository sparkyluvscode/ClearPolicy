"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Just read the current state, don't modify it
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cp_theme");
      if (stored) {
        setDark(stored === "dark");
      } else {
        // Check system preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDark(!prefersDark); // Inverted logic: dark mode is when prefersDark is false
      }
    }

    const onScroll = () => setScrolled(window.scrollY > 8);
    if (typeof window !== "undefined") {
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener('scroll', onScroll);
    }
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "/about", label: "About" },
    { href: "/browse", label: "Browse" },
    { href: "/compare", label: "Compare" },
    { href: "/impact", label: "Impact" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <header className={`glass-nav sticky top-0 z-50 ${scrolled ? "shadow-glass-lg" : ""}`}>
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          {/* Mobile hamburger button */}
          <button
            type="button"
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 focus:outline-none focus-ring rounded"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <span className={`block w-5 h-0.5 bg-gray-100 dark:bg-gray-900 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-100 dark:bg-gray-900 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-100 dark:bg-gray-900 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>

          <Link href="/" className="text-lg font-semibold text-gray-100 dark:text-gray-900 focus-ring rounded px-1" aria-label="ClearPolicy home">
            {process.env.NEXT_PUBLIC_APP_NAME || "ClearPolicy"}
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-4 text-sm ml-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-gray-200 dark:text-gray-800 hover:text-accent hover:underline focus-ring rounded px-1 transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          <form
            className="ml-auto flex-1 max-w-xl hidden sm:block"
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
              placeholder="Search a bill or proposition..."
              className="glass-input w-full px-3 py-2 text-sm"
            />
          </form>

          <button
            type="button"
            className="liquid-button px-3 py-2 text-sm hidden sm:inline-flex"
            aria-pressed={dark}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={(e) => {
              e.preventDefault();
              try {
                const next = !dark;
                setDark(next);
                if (typeof document !== "undefined" && document.documentElement) {
                  document.documentElement.classList.toggle('dark', next);
                }
                if (typeof window !== "undefined" && window.localStorage) {
                  localStorage.setItem("cp_theme", next ? "dark" : "light");
                }
              } catch (error) {
                console.error("Error toggling theme:", error);
              }
            }}
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile menu drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 max-w-[80vw] z-50 md:hidden transform transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Mobile navigation"
      >
        <div className="h-full glass-surface rounded-none border-r border-white/10 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <span className="text-lg font-semibold text-gray-100 dark:text-gray-900">
              {process.env.NEXT_PUBLIC_APP_NAME || "ClearPolicy"}
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 focus-ring"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5 text-gray-100 dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile search */}
          <div className="p-4 border-b border-white/10">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                if (!q.trim()) return;
                const url = new URL("/", window.location.origin);
                url.searchParams.set("q", q);
                router.push(url.toString());
                setMobileMenuOpen(false);
              }}
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search measures..."
                className="glass-input w-full px-3 py-2 text-sm"
              />
            </form>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 py-4">
            <ul className="space-y-1 px-2">
              <li>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-100 dark:text-gray-900 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home
                </Link>
              </li>
              {navLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-100 dark:text-gray-900 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    {link.label === "Browse" && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    )}
                    {link.label === "Compare" && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    )}
                    {link.label === "About" && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {link.label === "Impact" && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    )}
                    {link.label === "Contact" && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer with theme toggle */}
          <div className="p-4 border-t border-white/10">
            <button
              type="button"
              className="w-full liquid-button px-4 py-2.5 text-sm font-medium justify-center"
              aria-pressed={dark}
              onClick={() => {
                const next = !dark;
                setDark(next);
                if (typeof document !== "undefined" && document.documentElement) {
                  document.documentElement.classList.toggle('dark', next);
                }
                if (typeof window !== "undefined" && window.localStorage) {
                  localStorage.setItem("cp_theme", next ? "dark" : "light");
                }
              }}
            >
              {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
