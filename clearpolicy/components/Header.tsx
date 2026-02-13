"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const hasClerkKey =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0 &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("YOUR_");

export default function Header() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cp_theme");
      if (stored) setDark(stored === "dark");
      else setDark(!!window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    }
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("cp_theme", next ? "dark" : "light");
  }

  const navLinks = [
    { href: "/browse", label: "Browse" },
    { href: "/compare", label: "Compare" },
    { href: "/about", label: "About" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <>
      <header className={cn("cp-site-header sticky top-0 z-50 transition-all duration-300", scrolled ? "py-2" : "py-3")}>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-12">
          <nav
            className={cn(
              "glass-nav flex items-center gap-4 rounded-2xl px-5 py-3 transition-all duration-300",
              scrolled && "glass-nav--scrolled rounded-xl"
            )}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 focus-ring rounded-lg px-1">
              <img src="/clearpolicy-logo.png" alt="ClearPolicy" className="w-8 h-8 flex-shrink-0 object-contain" />
              <span className="font-heading text-lg font-bold tracking-tight text-[var(--cp-text)] hidden sm:inline">
                ClearPolicy
              </span>
            </Link>

            {/* Search — desktop */}
            <form
              className="hidden md:flex flex-1 max-w-md mx-auto"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                if (!q.trim()) return;
                router.push(`/search?q=${encodeURIComponent(q.trim())}`);
              }}
            >
              <div className="relative w-full group">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cp-tertiary)] group-focus-within:text-[var(--cp-accent)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search any policy or bill..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[var(--cp-surface-2)] border-2 border-transparent text-[var(--cp-text)] placeholder:text-[var(--cp-tertiary)] focus:outline-none focus:border-[var(--cp-accent)] focus:bg-[var(--cp-surface)] transition-all"
                />
              </div>
            </form>

            {/* Nav links — desktop */}
            <div className="hidden md:flex items-center gap-1 ml-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-[var(--cp-muted)] hover:text-[var(--cp-text)] hover:bg-[var(--cp-hover)] transition-all focus-ring"
                >
                  {link.label}
                </Link>
              ))}
              {hasClerkKey && (
                <>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button
                        type="button"
                        className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--cp-text)] bg-[var(--cp-accent)] text-white hover:brightness-110 transition-all focus-ring ml-1"
                      >
                        Sign in
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        type="button"
                        className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--cp-text)] border border-[var(--cp-border)] hover:bg-[var(--cp-surface)] transition-all focus-ring ml-1"
                      >
                        Sign up
                      </button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <div className="ml-1">
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </SignedIn>
                </>
              )}
              <button
                onClick={toggleDark}
                className="rounded-lg p-2.5 text-[var(--cp-muted)] hover:text-[var(--cp-text)] hover:bg-[var(--cp-hover)] transition-all ml-1"
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07 7.07-1.41-1.41M7.34 7.34 5.93 5.93m12.14 0-1.41 1.41M7.34 16.66l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Mobile controls */}
            <div className="flex items-center gap-1 ml-auto md:hidden">
              <button onClick={toggleDark} className="rounded-lg p-2 text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors" aria-label={dark ? "Light mode" : "Dark mode"}>
                {dark ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07 7.07-1.41-1.41M7.34 7.34 5.93 5.93m12.14 0-1.41 1.41M7.34 16.66l-1.41 1.41" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-lg p-2 text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-colors focus-ring"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {mobileMenuOpen ? (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>) : (<><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>)}
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-fade-in" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
          <aside className="fixed right-0 top-0 z-50 h-full w-72 bg-[var(--cp-bg)] shadow-elevated animate-slide-in border-l border-[var(--cp-border)]">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between p-5 border-b border-[var(--cp-border)]">
                <span className="font-heading text-lg font-semibold text-[var(--cp-text)]">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-1.5 text-[var(--cp-muted)] hover:text-[var(--cp-text)] hover:bg-[var(--cp-surface-2)] transition-colors" aria-label="Close menu">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <div className="p-4">
                <form role="search" onSubmit={(e) => { e.preventDefault(); if (!q.trim()) return; router.push(`/search?q=${encodeURIComponent(q.trim())}`); setMobileMenuOpen(false); }}>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cp-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search policies..." className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-[var(--cp-surface-2)] border-2 border-[var(--cp-border)] text-[var(--cp-text)] placeholder:text-[var(--cp-tertiary)] focus:outline-none focus:border-[var(--cp-accent)] transition-all" />
                  </div>
                </form>
              </div>
              <nav className="flex-1 px-3">
                <ul className="space-y-0.5">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-4 py-3 text-[15px] font-medium text-[var(--cp-text)] hover:bg-[var(--cp-hover)] transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  {hasClerkKey && (
                    <li className="pt-2 border-t border-[var(--cp-border)]">
                      <SignedOut>
                        <SignInButton mode="modal">
                          <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block w-full text-left rounded-lg px-4 py-3 text-[15px] font-medium text-[var(--cp-accent)] hover:bg-[var(--cp-hover)] transition-colors"
                          >
                            Sign in
                          </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                          <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block w-full text-left rounded-lg px-4 py-3 text-[15px] font-medium text-[var(--cp-text)] hover:bg-[var(--cp-hover)] transition-colors"
                          >
                            Sign up
                          </button>
                        </SignUpButton>
                      </SignedOut>
                      <SignedIn>
                        <div className="flex items-center gap-2 px-4 py-3">
                          <UserButton afterSignOutUrl="/" />
                          <span className="text-sm text-[var(--cp-muted)]">Account</span>
                        </div>
                      </SignedIn>
                    </li>
                  )}
                </ul>
              </nav>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
