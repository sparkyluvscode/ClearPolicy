"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge, Button, Card, Input } from "@/components/ui";
import { propositions, federalBills, CATEGORIES as categories, STATUSES as statuses } from "@/lib/propositions-data";

export default function BrowsePage() {
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [levelFilter, setLevelFilter] = useState<"All" | "Federal" | "California">("All");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProps = useMemo(() => {
        if (levelFilter === "Federal") return [];
        return propositions.filter(prop => {
            const matchesCategory = categoryFilter === "All" || prop.category === categoryFilter;
            const matchesStatus = statusFilter === "All" || prop.status === statusFilter;
            const matchesSearch = !searchQuery ||
                prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prop.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prop.num.includes(searchQuery);
            return matchesCategory && matchesStatus && matchesSearch;
        });
    }, [categoryFilter, statusFilter, searchQuery, levelFilter]);

    const filteredFederal = useMemo(() => {
        if (levelFilter === "California") return [];
        return federalBills.filter(bill => {
            const matchesCategory = categoryFilter === "All" || bill.category === categoryFilter;
            const matchesSearch = !searchQuery ||
                bill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                bill.summary.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [levelFilter, searchQuery, categoryFilter]);

    const showCalifornia = levelFilter === "All" || levelFilter === "California";
    const showFederal = levelFilter === "All" || levelFilter === "Federal";

    return (
        <div className="space-y-10 animate-fade-in" style={{ paddingTop: "var(--space-xl)", paddingBottom: "var(--space-3xl)" }}>
            {/* Header */}
            <div className="space-y-3">
                <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-[var(--cp-text)]">
                    Browse Legislation
                </h1>
                <p className="text-lg text-[var(--cp-muted)] leading-relaxed">
                    Explore federal bills and California ballot measures with clear, unbiased summaries.
                </p>
            </div>

            {/* Filters */}
            <div className="glass-card rounded-2xl p-5 md:p-6 space-y-5">
                {/* Search */}
                <div className="relative group">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cp-tertiary)] group-focus-within:text-[var(--cp-accent)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search legislation..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[var(--cp-surface-2)] border border-transparent text-[var(--cp-text)] placeholder:text-[var(--cp-muted)] focus:outline-none focus:border-[var(--cp-accent)]/25 transition-all"
                    />
                </div>

                {/* Filter rows */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2">
                        <span className="section-label">Level</span>
                        <div className="flex gap-1">
                            {(["All", "Federal", "California"] as const).map(level => (
                                <button
                                    key={level}
                                    onClick={() => setLevelFilter(level)}
                                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                                        levelFilter === level
                                            ? "bg-[var(--cp-accent-soft)] text-[var(--cp-accent)] font-medium"
                                            : "text-[var(--cp-muted)] hover:text-[var(--cp-text)] hover:bg-[var(--cp-surface-2)]"
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="section-label">Status</span>
                        <div className="flex gap-1">
                            {statuses.map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                                        statusFilter === status
                                            ? "bg-[var(--cp-accent-soft)] text-[var(--cp-accent)] font-medium"
                                            : "text-[var(--cp-muted)] hover:text-[var(--cp-text)] hover:bg-[var(--cp-surface-2)]"
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Category chips */}
                <div className="flex flex-wrap gap-1.5">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                categoryFilter === cat
                                    ? "border-[var(--cp-accent)]/25 bg-[var(--cp-accent-soft)] text-[var(--cp-accent)] font-medium"
                                    : "border-[var(--cp-border)] text-[var(--cp-muted)] hover:text-[var(--cp-text)] hover:border-[var(--cp-accent)]/15"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Count */}
                <p className="text-xs text-[var(--cp-muted)]">
                    {levelFilter === "All" && (
                        <>{filteredFederal.length} federal bill{filteredFederal.length !== 1 ? "s" : ""} &middot; {filteredProps.length} California proposition{filteredProps.length !== 1 ? "s" : ""}</>
                    )}
                    {levelFilter === "Federal" && <>{filteredFederal.length} federal bill{filteredFederal.length !== 1 ? "s" : ""}</>}
                    {levelFilter === "California" && <>{filteredProps.length} proposition{filteredProps.length !== 1 ? "s" : ""}</>}
                </p>
            </div>

            {/* Federal bills */}
            {showFederal && filteredFederal.length > 0 && (
                <section className="space-y-4">
                    <p className="section-label">Federal &mdash; Congress.gov</p>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 stagger">
                        {filteredFederal.map(bill => (
                            <Link key={bill.id} href={bill.href} className="block group focus-ring rounded-xl">
                                <div className="glass-card rounded-xl p-5 h-full transition-all surface-lift animate-fade-up">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--cp-accent-soft)] text-[var(--cp-accent)]">Federal</span>
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-green-50 text-green-600 dark:bg-green-900/15 dark:text-green-400">{bill.status}</span>
                                    </div>
                                    <h3 className="text-sm font-medium text-[var(--cp-text)] line-clamp-2 leading-snug mb-2">
                                        {bill.title}
                                    </h3>
                                    <p className="text-xs text-[var(--cp-muted)] line-clamp-3 leading-relaxed">
                                        {bill.summary}
                                    </p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-[10px] font-medium text-[var(--cp-muted)] px-2 py-0.5 rounded-md bg-[var(--cp-surface-2)]">{bill.category}</span>
                                        <span className="text-xs text-[var(--cp-accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                                            View &rarr;
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    {/* Bridge to Omni-Search */}
                    <Link href="/search?q=major federal legislation" className="block group">
                        <div className="rounded-xl border border-dashed border-[var(--cp-border)] p-5 text-center transition-all hover:border-[var(--cp-accent)]/25 hover:bg-[var(--cp-accent-soft)]">
                            <p className="text-sm font-medium text-[var(--cp-accent)]">
                                Search for any federal bill or policy topic
                            </p>
                            <p className="text-xs text-[var(--cp-muted)] mt-1">
                                Our AI engine can analyze any bill, law, or policy question.
                            </p>
                        </div>
                    </Link>
                </section>
            )}

            {/* California propositions */}
            {showCalifornia && (
            <section className="space-y-4">
                <p className="section-label">California Ballot Measures</p>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 stagger">
                {filteredProps.map(prop => (
                    <Link
                        key={`${prop.num}-${prop.year}`}
                        href={`/measure/prop/${prop.num}?year=${prop.year}`}
                        className="block group focus-ring rounded-xl"
                    >
                        <div className="glass-card rounded-xl p-5 h-full transition-all surface-lift animate-fade-up">
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-semibold text-[var(--cp-accent)]">
                                        {prop.num}
                                    </span>
                                    <span className="text-[11px] text-[var(--cp-muted)]">
                                        {prop.year}
                                    </span>
                                </div>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                                    prop.status === "Passed" ? "bg-green-50 text-green-600 dark:bg-green-900/15 dark:text-green-400"
                                    : prop.status === "Active" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/15 dark:text-blue-400"
                                    : "bg-red-50 text-red-500 dark:bg-red-900/15 dark:text-red-400"
                                }`}>
                                    {prop.status}
                                </span>
                            </div>
                            <h3 className="text-sm font-medium text-[var(--cp-text)] line-clamp-2 leading-snug mb-2">
                                {prop.title}
                            </h3>
                            <p className="text-xs text-[var(--cp-muted)] line-clamp-3 leading-relaxed">
                                {prop.summary}
                            </p>
                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-[10px] font-medium text-[var(--cp-muted)] px-2 py-0.5 rounded-md bg-[var(--cp-surface-2)]">{prop.category}</span>
                                <span className="text-xs text-[var(--cp-accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                                    View &rarr;
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
                </div>
            </section>
            )}

            {/* Empty state */}
            {filteredProps.length === 0 && filteredFederal.length === 0 && (
                <div className="glass-card rounded-2xl p-10 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[var(--cp-surface-2)] flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-[var(--cp-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-medium text-[var(--cp-text)] mb-1">
                        No legislation found
                    </h3>
                    <p className="text-sm text-[var(--cp-muted)] mb-5">
                        Try adjusting your filters or search query.
                    </p>
                    <button
                        onClick={() => {
                            setCategoryFilter("All");
                            setStatusFilter("All");
                            setLevelFilter("All");
                            setSearchQuery("");
                        }}
                        className="text-sm font-medium text-[var(--cp-accent)] hover:underline"
                    >
                        Clear all filters
                    </button>
                </div>
            )}
        </div>
    );
}
