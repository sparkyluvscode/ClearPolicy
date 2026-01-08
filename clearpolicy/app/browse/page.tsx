"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

// Proposition data - would typically come from API
const propositions = [
    { num: "36", year: 2024, title: "Increase Penalties for Theft and Drug Crimes", category: "Criminal Justice", status: "Active", summary: "Increases penalties for certain theft and drug crimes. Creates new category of crime, 'treatment-mandated felony.'" },
    { num: "35", year: 2024, title: "Permanent Medi-Cal Funding", category: "Healthcare", status: "Active", summary: "Makes permanent the existing tax on managed health care insurance plans to fund Medi-Cal health care services." },
    { num: "34", year: 2024, title: "Restrict Spending by Health Care Providers", category: "Healthcare", status: "Active", summary: "Requires certain health care providers to spend 98% of revenues on patient care." },
    { num: "33", year: 2024, title: "Expand Local Rent Control", category: "Housing", status: "Active", summary: "Allows local governments to expand rent control on residential properties." },
    { num: "32", year: 2024, title: "Raise Minimum Wage to $18", category: "Labor", status: "Active", summary: "Increases state minimum wage to $18 per hour by 2026." },
    { num: "47", year: 2014, title: "Criminal Sentences. Misdemeanor Penalties", category: "Criminal Justice", status: "Passed", summary: "Reclassifies certain nonviolent drug and property offenses from felonies to misdemeanors." },
    { num: "17", year: 2020, title: "Voting Rights for People on Parole", category: "Voting Rights", status: "Passed", summary: "Restores voting rights for people on parole for felony convictions." },
    { num: "22", year: 2020, title: "App-Based Drivers as Contractors", category: "Labor", status: "Passed", summary: "Exempts app-based transportation and delivery companies from providing employee benefits." },
    { num: "19", year: 2020, title: "Property Tax Transfers", category: "Taxes", status: "Passed", summary: "Allows homeowners 55+ to transfer property tax base when moving." },
    { num: "13", year: 2020, title: "Stem Cell Research Bonds", category: "Healthcare", status: "Passed", summary: "Authorizes $5.5 billion in bonds for stem cell research." },
];

const categories = ["All", "Criminal Justice", "Healthcare", "Housing", "Labor", "Voting Rights", "Taxes"];
const statuses = ["All", "Active", "Passed", "Rejected"];

export default function BrowsePage() {
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProps = useMemo(() => {
        return propositions.filter(prop => {
            const matchesCategory = categoryFilter === "All" || prop.category === categoryFilter;
            const matchesStatus = statusFilter === "All" || prop.status === statusFilter;
            const matchesSearch = !searchQuery ||
                prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prop.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prop.num.includes(searchQuery);
            return matchesCategory && matchesStatus && matchesSearch;
        });
    }, [categoryFilter, statusFilter, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Hero */}
            <section className="card p-6 md:p-8 animate-fade-in-up">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-100 dark:text-gray-900">
                    Browse Propositions
                </h1>
                <p className="mt-2 text-gray-300 dark:text-gray-700">
                    Explore California ballot measures with clear, unbiased summaries
                </p>
            </section>

            {/* Search and Filters */}
            <section className="card p-4 md:p-6 animate-fade-in-up">
                {/* Search */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search propositions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="glass-input w-full px-4 py-3 text-base"
                    />
                </div>

                {/* Filter tabs */}
                <div className="space-y-3">
                    {/* Status filter */}
                    <div>
                        <span className="section-title block mb-2">Status</span>
                        <div className="flex flex-wrap gap-2">
                            {statuses.map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${statusFilter === status
                                            ? 'bg-accent text-white shadow-glow-accent'
                                            : 'bg-gray-800/50 dark:bg-white/50 text-gray-200 dark:text-gray-800 hover:bg-gray-700/50 dark:hover:bg-white/70'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category filter */}
                    <div>
                        <span className="section-title block mb-2">Category</span>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${categoryFilter === cat
                                            ? 'bg-accent text-white'
                                            : 'bg-gray-800/30 dark:bg-white/30 text-gray-300 dark:text-gray-700 hover:bg-gray-700/50 dark:hover:bg-white/50'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results count */}
                <div className="mt-4 text-sm text-gray-400 dark:text-gray-600">
                    Showing {filteredProps.length} proposition{filteredProps.length !== 1 ? 's' : ''}
                </div>
            </section>

            {/* Propositions Grid */}
            <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProps.map(prop => (
                    <Link
                        key={`${prop.num}-${prop.year}`}
                        href={`/measure/prop/${prop.num}`}
                        className="card p-5 hover:shadow-glass-lg transition-all duration-300 group"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-accent">
                                    Prop {prop.num}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-600">
                                    ({prop.year})
                                </span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${prop.status === 'Active'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : prop.status === 'Passed'
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-red-500/20 text-red-400'
                                }`}>
                                {prop.status}
                            </span>
                        </div>

                        <h3 className="mt-2 text-sm font-medium text-gray-100 dark:text-gray-900 line-clamp-2 group-hover:text-accent transition-colors">
                            {prop.title}
                        </h3>

                        <p className="mt-2 text-xs text-gray-400 dark:text-gray-600 line-clamp-3">
                            {prop.summary}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs px-2 py-1 bg-gray-800/50 dark:bg-white/50 rounded-md text-gray-300 dark:text-gray-700">
                                {prop.category}
                            </span>
                            <span className="text-xs text-accent group-hover:underline">
                                Read more →
                            </span>
                        </div>
                    </Link>
                ))}
            </section>

            {/* Empty state */}
            {filteredProps.length === 0 && (
                <section className="card p-8 text-center animate-fade-in-up">
                    <div className="text-4xl mb-3">🔍</div>
                    <h3 className="text-lg font-medium text-gray-100 dark:text-gray-900">
                        No propositions found
                    </h3>
                    <p className="mt-1 text-sm text-gray-400 dark:text-gray-600">
                        Try adjusting your filters or search query
                    </p>
                    <button
                        onClick={() => {
                            setCategoryFilter("All");
                            setStatusFilter("All");
                            setSearchQuery("");
                        }}
                        className="mt-4 liquid-button px-4 py-2 text-sm"
                    >
                        Clear filters
                    </button>
                </section>
            )}
        </div>
    );
}
