"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

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
            {/* Hero */}
            <section className="card p-6 md:p-8 animate-fade-in-up">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-100 dark:text-gray-900">
                    Compare Propositions
                </h1>
                <p className="mt-2 text-gray-300 dark:text-gray-700">
                    View side-by-side comparisons of ballot measures
                </p>
            </section>

            {/* Slot selectors */}
            <section className="card p-4 md:p-6 animate-fade-in-up">
                <div className="flex flex-wrap items-center gap-3">
                    {selectedProps.map((num, index) => (
                        <div key={index} className="relative">
                            <button
                                onClick={() => setShowSelector(showSelector === index ? null : index)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800/50 dark:bg-white/50 hover:bg-gray-700/50 dark:hover:bg-white/70 transition-colors"
                            >
                                <span className="text-accent font-semibold">
                                    {num ? `Prop ${num}` : "Select..."}
                                </span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {selectedProps.length > 2 && (
                                <button
                                    onClick={() => removeSlot(index)}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600"
                                    aria-label="Remove"
                                >
                                    ×
                                </button>
                            )}

                            {/* Dropdown */}
                            {showSelector === index && (
                                <div className="absolute top-full mt-2 left-0 z-20 w-64 glass-popover p-2 max-h-64 overflow-y-auto">
                                    {propositions.map(p => (
                                        <button
                                            key={p.num}
                                            onClick={() => handleSelectProp(index, p.num)}
                                            disabled={selectedProps.includes(p.num) && selectedProps[index] !== p.num}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedProps.includes(p.num) && selectedProps[index] !== p.num
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'hover:bg-white/10'
                                                } ${selectedProps[index] === p.num ? 'bg-accent/20' : ''}`}
                                        >
                                            <span className="font-medium text-gray-100 dark:text-gray-900">Prop {p.num}</span>
                                            <span className="ml-2 text-xs text-gray-400 dark:text-gray-600">({p.year})</span>
                                            <div className="text-xs text-gray-400 dark:text-gray-600 line-clamp-1 mt-0.5">
                                                {p.title}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {selectedProps.length < 3 && (
                        <button
                            onClick={addSlot}
                            className="px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-600 dark:border-gray-400 text-gray-400 hover:border-accent hover:text-accent transition-colors"
                        >
                            + Add
                        </button>
                    )}
                </div>
            </section>

            {/* Comparison Table - Desktop */}
            <section className="hidden md:block card p-6 animate-fade-in-up overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4 text-gray-400 dark:text-gray-600 font-medium w-32">Aspect</th>
                            {selectedData.map((prop: any) => (
                                <th key={prop.num} className="text-left py-3 px-4">
                                    <Link href={`/measure/prop/${prop.num}`} className="hover:text-accent transition-colors">
                                        <span className="text-xl font-bold text-accent">Prop {prop.num}</span>
                                        <span className="ml-2 text-xs text-gray-400">({prop.year})</span>
                                    </Link>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-white/5">
                            <td className="py-4 px-4 text-sm text-gray-400 dark:text-gray-600 font-medium">Title</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4 text-sm text-gray-100 dark:text-gray-900">
                                    {prop.title}
                                </td>
                            ))}
                        </tr>
                        <tr className="border-b border-white/5">
                            <td className="py-4 px-4 text-sm text-gray-400 dark:text-gray-600 font-medium">Category</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4">
                                    <span className="text-xs px-2 py-1 bg-gray-800/50 dark:bg-white/50 rounded-md text-gray-300 dark:text-gray-700">
                                        {prop.category}
                                    </span>
                                </td>
                            ))}
                        </tr>
                        <tr className="border-b border-white/5">
                            <td className="py-4 px-4 text-sm text-gray-400 dark:text-gray-600 font-medium">Status</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4">
                                    <span className={`text-xs px-2 py-1 rounded-full ${prop.status === 'Active'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : prop.status === 'Passed'
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {prop.status}
                                    </span>
                                </td>
                            ))}
                        </tr>
                        <tr className="border-b border-white/5">
                            <td className="py-4 px-4 text-sm text-gray-400 dark:text-gray-600 font-medium align-top">TL;DR</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4 text-sm text-gray-100 dark:text-gray-900">
                                    {prop.tldr}
                                </td>
                            ))}
                        </tr>
                        <tr className="border-b border-white/5">
                            <td className="py-4 px-4 text-sm text-gray-400 dark:text-gray-600 font-medium align-top">Pros</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4">
                                    <ul className="text-sm text-emerald-400 space-y-1">
                                        {prop.pros.map((pro: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="mt-1">✓</span>
                                                <span className="text-gray-100 dark:text-gray-900">{pro}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="py-4 px-4 text-sm text-gray-400 dark:text-gray-600 font-medium align-top">Cons</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4">
                                    <ul className="text-sm text-red-400 space-y-1">
                                        {prop.cons.map((con: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="mt-1">✗</span>
                                                <span className="text-gray-100 dark:text-gray-900">{con}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Comparison Cards - Mobile */}
            <section className="md:hidden space-y-4">
                {selectedData.map((prop: any) => (
                    <article key={prop.num} className="card p-5 animate-fade-in-up">
                        <Link href={`/measure/prop/${prop.num}`} className="block hover:text-accent transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-accent">Prop {prop.num}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${prop.status === 'Active'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                    {prop.status}
                                </span>
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-gray-100 dark:text-gray-900">
                                {prop.title}
                            </h3>
                        </Link>

                        <div className="mt-4 space-y-3">
                            <div>
                                <span className="section-title">TL;DR</span>
                                <p className="mt-1 text-sm text-gray-100 dark:text-gray-900">{prop.tldr}</p>
                            </div>

                            <div>
                                <span className="section-title text-emerald-400">Pros</span>
                                <ul className="mt-1 text-sm text-gray-100 dark:text-gray-900 space-y-1">
                                    {prop.pros.map((pro: string, i: number) => (
                                        <li key={i}>✓ {pro}</li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <span className="section-title text-red-400">Cons</span>
                                <ul className="mt-1 text-sm text-gray-100 dark:text-gray-900 space-y-1">
                                    {prop.cons.map((con: string, i: number) => (
                                        <li key={i}>✗ {con}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </article>
                ))}
            </section>

            {/* Call to action */}
            <section className="card p-6 text-center animate-fade-in-up">
                <h3 className="text-lg font-medium text-gray-100 dark:text-gray-900">
                    Want to explore more measures?
                </h3>
                <p className="mt-1 text-sm text-gray-400 dark:text-gray-600">
                    Browse all available propositions or search for specific topics
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                    <Link href="/browse" className="liquid-button px-5 py-2.5 text-sm">
                        Browse All
                    </Link>
                    <Link href="/" className="px-5 py-2.5 text-sm rounded-xl border border-white/20 text-gray-200 dark:text-gray-800 hover:bg-white/5 transition-colors">
                        Search
                    </Link>
                </div>
            </section>
        </div>
    );
}
