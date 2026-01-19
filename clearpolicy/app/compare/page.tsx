"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";

// Same proposition data - in real app would come from API/shared data
const propositions = [
    {
        num: "36", year: 2024, title: "Increase Penalties for Theft and Drug Crimes", category: "Criminal Justice", status: "Active",
        tldr: "Increases penalties for certain theft and drug crimes. Creates new category of crime called 'treatment-mandated felony.'",
        pros: ["Deters repeat offenders", "Addresses retail theft concerns", "Provides treatment options for drug offenses"],
        cons: ["May increase prison costs", "Could reverse criminal justice reforms", "Disproportionate impact on low-income communities"]
    },
    {
        num: "35", year: 2024, title: "Permanent Medi-Cal Funding", category: "Healthcare", status: "Active",
        tldr: "Makes permanent the existing tax on managed health care insurance plans to fund Medi-Cal health care services.",
        pros: ["Ensures stable Medi-Cal funding", "Expands healthcare access", "Tax already exists so no new burden"],
        cons: ["Limits legislative flexibility", "Locks in specific spending requirements", "Complex constitutional amendment"]
    },
    {
        num: "47", year: 2014, title: "Criminal Sentences. Misdemeanor Penalties", category: "Criminal Justice", status: "Passed",
        tldr: "Reclassifies certain nonviolent drug and property offenses from felonies to misdemeanors. Redirects savings to schools and rehabilitation.",
        pros: ["Reduces prison overcrowding", "Saves taxpayer money", "Focuses on rehabilitation over incarceration"],
        cons: ["May reduce deterrence for property crimes", "Some argue theft has increased", "Harder to prosecute repeat offenders"]
    },
    {
        num: "17", year: 2020, title: "Voting Rights for People on Parole", category: "Voting Rights", status: "Passed",
        tldr: "Restores voting rights for people on parole for felony convictions. Allows them to vote in state and local elections.",
        pros: ["Promotes civic reintegration", "Aligns with rehabilitation goals", "Expands democratic participation"],
        cons: ["Some believe voting should be earned back", "Administrative complexity", "Concerns about parole incentives"]
    },
    {
        num: "22", year: 2020, title: "App-Based Drivers as Contractors", category: "Labor", status: "Passed",
        tldr: "Exempts app-based transportation and delivery companies from providing employee benefits. Drivers remain independent contractors.",
        pros: ["Preserves flexible work arrangements", "Drivers can set own schedules", "Provides some new benefits for contractors"],
        cons: ["No employee benefits like health insurance", "Reduces worker protections", "Sets precedent for gig economy"]
    },
    {
        num: "32", year: 2024, title: "Raise Minimum Wage to $18", category: "Labor", status: "Active",
        tldr: "Increases state minimum wage to $18 per hour by 2026 for all employers.",
        pros: ["Helps low-wage workers afford living costs", "Reduces income inequality", "Stimulates local economy"],
        cons: ["May increase prices", "Could reduce hiring", "Some small businesses may struggle"]
    },
];

export default function ComparePage() {
    const [selectedProps, setSelectedProps] = useState<string[]>(["47", "36"]);
    const [showSelector, setShowSelector] = useState<number | null>(null);

    const selectedData = useMemo(() => {
        return selectedProps.map(num => propositions.find(p => p.num === num)).filter(Boolean);
    }, [selectedProps]);

    const handleSelectProp = (index: number, num: string) => {
        const newSelection = [...selectedProps];
        newSelection[index] = num;
        setSelectedProps(newSelection);
        setShowSelector(null);
    };

    const addSlot = () => {
        if (selectedProps.length < 3) {
            setSelectedProps([...selectedProps, ""]);
        }
    };

    const removeSlot = (index: number) => {
        if (selectedProps.length > 2) {
            setSelectedProps(selectedProps.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="space-y-6">
            <Card className="space-y-2">
                <h1 className="page-title">
                    Compare Propositions
                </h1>
                <p className="page-subtitle">
                    View side-by-side comparisons of ballot measures.
                </p>
            </Card>

            {/* Slot selectors */}
            <Card className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    {selectedProps.map((num, index) => (
                        <div key={index} className="relative">
                            <Button
                                variant="secondary"
                                onClick={() => setShowSelector(showSelector === index ? null : index)}
                                className="w-44 justify-between"
                            >
                                <span className="text-accent font-semibold">
                                    {num ? `Prop ${num}` : "Select..."}
                                </span>
                                <svg className="w-4 h-4 text-[var(--cp-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </Button>

                            {selectedProps.length > 2 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 text-rose-500 hover:bg-rose-500/10"
                                    onClick={() => removeSlot(index)}
                                    aria-label="Remove"
                                >
                                    ×
                                </Button>
                            )}

                            {/* Dropdown */}
                            {showSelector === index && (
                                <div className="absolute top-full mt-2 left-0 z-20 w-64 rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface)] p-2 shadow-soft max-h-64 overflow-y-auto">
                                    {propositions.map(p => (
                                        <button
                                            key={p.num}
                                            onClick={() => handleSelectProp(index, p.num)}
                                            disabled={selectedProps.includes(p.num) && selectedProps[index] !== p.num}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedProps.includes(p.num) && selectedProps[index] !== p.num
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'hover:bg-[var(--cp-surface-2)]'
                                                } ${selectedProps[index] === p.num ? 'bg-[var(--cp-surface-2)]' : ''}`}
                                        >
                                            <span className="font-medium text-[var(--cp-text)]">Prop {p.num}</span>
                                            <span className="ml-2 text-xs text-[var(--cp-muted)]">({p.year})</span>
                                            <div className="text-xs text-[var(--cp-muted)] line-clamp-1 mt-0.5">
                                                {p.title}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {selectedProps.length < 3 && (
                        <Button
                            variant="ghost"
                            onClick={addSlot}
                            className="border-2 border-dashed border-[var(--cp-border)] text-[var(--cp-muted)] hover:text-[var(--cp-text)]"
                        >
                            + Add
                        </Button>
                    )}
                </div>
            </Card>

            {/* Comparison Table - Desktop */}
            <Card className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--cp-border)]">
                            <th className="text-left py-3 px-4 text-[var(--cp-muted)] font-medium w-32">Aspect</th>
                            {selectedData.map((prop: any) => (
                                <th key={prop.num} className="text-left py-3 px-4">
                                    <Link href={`/measure/prop/${prop.num}`} className="hover:text-accent transition-colors">
                                        <span className="text-xl font-bold text-accent">Prop {prop.num}</span>
                                        <span className="ml-2 text-xs text-[var(--cp-muted)]">({prop.year})</span>
                                    </Link>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-[var(--cp-border)]">
                            <td className="py-4 px-4 text-sm text-[var(--cp-muted)] font-medium">Title</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4 text-sm text-[var(--cp-text)]">
                                    {prop.title}
                                </td>
                            ))}
                        </tr>
                        <tr className="border-b border-[var(--cp-border)]">
                            <td className="py-4 px-4 text-sm text-[var(--cp-muted)] font-medium">Category</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4">
                                    <span className="text-xs px-2 py-1 bg-[var(--cp-surface-2)] rounded-md text-[var(--cp-muted)]">
                                        {prop.category}
                                    </span>
                                </td>
                            ))}
                        </tr>
                        <tr className="border-b border-[var(--cp-border)]">
                            <td className="py-4 px-4 text-sm text-[var(--cp-muted)] font-medium">Status</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4">
                                    <Badge variant={prop.status === "Active" ? "supported" : prop.status === "Passed" ? "official" : "analysis"}>
                                        {prop.status}
                                    </Badge>
                                </td>
                            ))}
                        </tr>
                        <tr className="border-b border-[var(--cp-border)]">
                            <td className="py-4 px-4 text-sm text-[var(--cp-muted)] font-medium align-top">TL;DR</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4 text-sm text-[var(--cp-text)]">
                                    {prop.tldr}
                                </td>
                            ))}
                        </tr>
                        <tr className="border-b border-[var(--cp-border)]">
                            <td className="py-4 px-4 text-sm text-[var(--cp-muted)] font-medium align-top">Pros</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4">
                                    <ul className="text-sm space-y-1">
                                        {prop.pros.map((pro: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="mt-1 text-emerald-500">✓</span>
                                                <span className="text-[var(--cp-text)]">{pro}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="py-4 px-4 text-sm text-[var(--cp-muted)] font-medium align-top">Cons</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4">
                                    <ul className="text-sm space-y-1">
                                        {prop.cons.map((con: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="mt-1 text-rose-500">✗</span>
                                                <span className="text-[var(--cp-text)]">{con}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </Card>

            {/* Comparison Cards - Mobile */}
            <section className="md:hidden space-y-4">
                {selectedData.map((prop: any) => (
                    <Card key={prop.num} className="space-y-3">
                        <Link href={`/measure/prop/${prop.num}`} className="block hover:text-accent transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-accent">Prop {prop.num}</span>
                                <Badge variant={prop.status === "Active" ? "supported" : "official"}>
                                    {prop.status}
                                </Badge>
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-[var(--cp-text)]">
                                {prop.title}
                            </h3>
                        </Link>

                        <div className="mt-4 space-y-3">
                            <div>
                                <span className="section-title">TL;DR</span>
                                <p className="mt-1 text-sm text-[var(--cp-text)]">{prop.tldr}</p>
                            </div>

                            <div>
                                <span className="section-title text-emerald-600">Pros</span>
                                <ul className="mt-1 text-sm text-[var(--cp-text)] space-y-1">
                                    {prop.pros.map((pro: string, i: number) => (
                                        <li key={i}>✓ {pro}</li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <span className="section-title text-rose-500">Cons</span>
                                <ul className="mt-1 text-sm text-[var(--cp-text)] space-y-1">
                                    {prop.cons.map((con: string, i: number) => (
                                        <li key={i}>✗ {con}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Card>
                ))}
            </section>

            <Card className="text-center">
                <h3 className="text-lg font-medium text-[var(--cp-text)]">
                    Want to explore more measures?
                </h3>
                <p className="mt-1 text-sm text-[var(--cp-muted)]">
                    Browse all available propositions or search for specific topics
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                    <Link href="/browse">
                        <Button>Browse All</Button>
                    </Link>
                    <Link href="/">
                        <Button variant="secondary">Search</Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
