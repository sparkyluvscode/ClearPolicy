"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge, Button, Card, Input } from "@/components/ui";

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
            <Card className="space-y-2">
                <h1 className="page-title">
                    Browse Propositions
                </h1>
                <p className="page-subtitle">
                    Explore California ballot measures with clear, unbiased summaries.
                </p>
            </Card>

            <Card className="space-y-4">
                <Input
                    type="text"
                    placeholder="Search propositions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="space-y-3">
                    <div>
                        <span className="section-title block mb-2">Status</span>
                        <div className="flex flex-wrap gap-2">
                            {statuses.map(status => (
                                <Button
                                    key={status}
                                    variant={statusFilter === status ? "primary" : "secondary"}
                                    size="sm"
                                    onClick={() => setStatusFilter(status)}
                                >
                                    {status}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <span className="section-title block mb-2">Category</span>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <Button
                                    key={cat}
                                    variant={categoryFilter === cat ? "primary" : "secondary"}
                                    size="sm"
                                    onClick={() => setCategoryFilter(cat)}
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-sm text-[var(--cp-muted)]">
                    Showing {filteredProps.length} proposition{filteredProps.length !== 1 ? 's' : ''}
                </div>
            </Card>

            <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProps.map(prop => (
                    <Link
                        key={`${prop.num}-${prop.year}`}
                        href={`/measure/prop/${prop.num}`}
                        className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface)] p-5 transition hover:bg-[var(--cp-surface-2)] focus-ring"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-accent">
                                    Prop {prop.num}
                                </span>
                                <span className="text-xs text-[var(--cp-muted)]">
                                    ({prop.year})
                                </span>
                            </div>
                            <Badge variant={prop.status === "Active" ? "supported" : prop.status === "Passed" ? "official" : "analysis"}>
                                {prop.status}
                            </Badge>
                        </div>

                        <h3 className="mt-2 text-sm font-medium text-[var(--cp-text)] line-clamp-2">
                            {prop.title}
                        </h3>

                        <p className="mt-2 text-xs text-[var(--cp-muted)] line-clamp-3">
                            {prop.summary}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface-2)] px-2 py-1 text-[var(--cp-muted)]">
                                {prop.category}
                            </span>
                            <span className="text-xs text-accent">
                                Read more →
                            </span>
                        </div>
                    </Link>
                ))}
            </section>

            {filteredProps.length === 0 && (
                <Card className="p-8 text-center">
                    <div className="text-3xl mb-3">🔍</div>
                    <h3 className="text-lg font-medium text-[var(--cp-text)]">
                        No propositions found
                    </h3>
                    <p className="mt-1 text-sm text-[var(--cp-muted)]">
                        Try adjusting your filters or search query.
                    </p>
                    <Button
                        className="mt-4"
                        onClick={() => {
                            setCategoryFilter("All");
                            setStatusFilter("All");
                            setSearchQuery("");
                        }}
                    >
                        Clear filters
                    </Button>
                </Card>
            )}
        </div>
    );
}
