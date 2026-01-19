"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, SearchInput } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function Header() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const showSearch = pathname !== "/";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cp_theme");
      if (stored) {
        setDark(stored === "dark");
      } else {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        setDark(!!prefersDark);
      }
    }

    const onScroll = () => setScrolled(window.scrollY > 8);
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!moreRef.current) return;
      if (!moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
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
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-[var(--cp-border)] bg-[var(--cp-bg)]",
          scrolled ? "shadow-sm" : ""
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <button
            type="button"
            className="md:hidden rounded-md border border-[var(--cp-border)] p-2 text-[var(--cp-text)] focus-ring"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
          </button>

          <Link href="/" className="text-sm font-semibold uppercase tracking-wide text-[var(--cp-text)] focus-ring rounded">
            {process.env.NEXT_PUBLIC_APP_NAME || "ClearPolicy"}
          </Link>

          <form
            className={cn("hidden flex-1 md:block", showSearch ? "" : "md:hidden")}
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (!q.trim()) return;
              const url = new URL("/", window.location.origin);
              url.searchParams.set("q", q);
              router.push(url.toString());
            }}
          >
            <label className="sr-only" htmlFor="global-search">
              Search measures
            </label>
            <div className="mx-auto max-w-xl">
              <SearchInput
                id="global-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search a bill, proposition, or topic..."
                aria-label="Search measures"
              />
            </div>
          </form>

          <Button
            variant="ghost"
            size="sm"
            aria-pressed={dark}
            aria-label={dark ? "Light mode" : "Dark mode"}
            onClick={(e) => {
              e.preventDefault();
              try {
                const next = !dark;
                setDark(next);
                if (typeof document !== "undefined" && document.documentElement) {
                  document.documentElement.classList.toggle("dark", next);
                }
                if (typeof window !== "undefined" && window.localStorage) {
                  localStorage.setItem("cp_theme", next ? "dark" : "light");
                }
              } catch (error) {
                console.error("Error toggling theme:", error);
              }
            }}
            className="ml-auto px-2 md:hidden"
          >
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 4v2m0 12v2m8-8h-2M6 12H4m12.95 5.95-1.41-1.41M7.46 7.46 6.05 6.05m0 11.9 1.41-1.41m9.49-9.49 1.41-1.41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
          </Button>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <div className="relative" ref={moreRef}>
              <Button variant="ghost" size="sm" onClick={() => setMoreOpen((v) => !v)}>
                More
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </Button>
              {moreOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface)] p-2 text-sm shadow-soft">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block rounded-md px-3 py-2 text-[var(--cp-text)] hover:bg-[var(--cp-surface-2)]"
                      onClick={() => setMoreOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/contact" className="hidden lg:block">
              <Button variant="secondary" size="sm">Feedback</Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={dark}
              aria-label={dark ? "Light mode" : "Dark mode"}
              onClick={(e) => {
                e.preventDefault();
                try {
                  const next = !dark;
                  setDark(next);
                  if (typeof document !== "undefined" && document.documentElement) {
                    document.documentElement.classList.toggle("dark", next);
                  }
                  if (typeof window !== "undefined" && window.localStorage) {
                    localStorage.setItem("cp_theme", next ? "dark" : "light");
                  }
                } catch (error) {
                  console.error("Error toggling theme:", error);
                }
              }}
              className="px-2"
            >
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 4v2m0 12v2m8-8h-2M6 12H4m12.95 5.95-1.41-1.41M7.46 7.46 6.05 6.05m0 11.9 1.41-1.41m9.49-9.49 1.41-1.41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
          <aside className="fixed left-0 top-0 z-50 h-full w-72 bg-[var(--cp-surface)] shadow-lg">
            <div className="flex h-full flex-col border-r border-[var(--cp-border)]">
              <div className="flex items-center justify-between border-b border-[var(--cp-border)] p-4">
                <span className="text-sm font-semibold uppercase tracking-wide text-[var(--cp-text)]">
                  {process.env.NEXT_PUBLIC_APP_NAME || "ClearPolicy"}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md border border-[var(--cp-border)] p-2 text-[var(--cp-text)] focus-ring"
                  aria-label="Close menu"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
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
                  <SearchInput
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search measures..."
                    aria-label="Search measures"
                  />
                </form>
              </div>
              <nav className="flex-1 px-2">
                <ul className="space-y-1">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-md px-3 py-2 text-sm text-[var(--cp-text)] hover:bg-[var(--cp-surface-2)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="border-t border-[var(--cp-border)] p-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.preventDefault();
                      try {
                        const next = !dark;
                        setDark(next);
                        if (typeof document !== "undefined" && document.documentElement) {
                          document.documentElement.classList.toggle("dark", next);
                        }
                        if (typeof window !== "undefined" && window.localStorage) {
                          localStorage.setItem("cp_theme", next ? "dark" : "light");
                        }
                      } catch (error) {
                        console.error("Error toggling theme:", error);
                      }
                    }}
                    aria-label={dark ? "Light mode" : "Dark mode"}
                  >
                    {dark ? "Light mode" : "Dark mode"}
                  </Button>
                  <Link href="/contact" className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full">Feedback</Button>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
