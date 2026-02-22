"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { propositions } from "@/lib/propositions-data";
import type { AnswerSection } from "@/lib/omni-types";

interface CompareResult {
    title: string;
    sections: AnswerSection[];
    loading: boolean;
    error: string | null;
}

export default function ComparePage() {
    const [selectedProps, setSelectedProps] = useState<string[]>(["1", "36"]);
    const [showSelector, setShowSelector] = useState<number | null>(null);
    const [topicA, setTopicA] = useState("");
    const [topicB, setTopicB] = useState("");
    const [compareResults, setCompareResults] = useState<[CompareResult | null, CompareResult | null]>([null, null]);
    const [comparing, setComparing] = useState(false);

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

    async function runCompare() {
        if (!topicA.trim() || !topicB.trim()) return;
        setComparing(true);
        setCompareResults([
            { title: "", sections: [], loading: true, error: null },
            { title: "", sections: [], loading: true, error: null },
        ]);

        const fetchTopic = async (query: string, idx: 0 | 1) => {
            try {
                const res = await fetch("/api/omni", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query, persona: "general" }),
                });
                const json = await res.json();
                if (!json.success || !json.data) throw new Error(json.error || "Failed");
                setCompareResults(prev => {
                    const next = [...prev] as [CompareResult | null, CompareResult | null];
                    next[idx] = { title: json.data.title, sections: json.data.sections, loading: false, error: null };
                    return next;
                });
            } catch (e) {
                setCompareResults(prev => {
                    const next = [...prev] as [CompareResult | null, CompareResult | null];
                    next[idx] = { title: query, sections: [], loading: false, error: e instanceof Error ? e.message : "Failed" };
                    return next;
                });
            }
        };

        await Promise.all([fetchTopic(topicA.trim(), 0), fetchTopic(topicB.trim(), 1)]);
        setComparing(false);
    }

    return (
        <div className="space-y-10 animate-fade-in" style={{ paddingTop: "var(--space-xl)", paddingBottom: "var(--space-3xl)" }}>
            <div className="space-y-3">
                <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-[var(--cp-text)]">
                    Compare
                </h1>
                <p className="text-lg text-[var(--cp-muted)] leading-relaxed">
                    Compare any two policies, topics, or ballot measures side by side.
                </p>
            </div>

            {/* Compare Anything */}
            <Card className="space-y-4">
                <h2 className="font-heading text-lg font-bold text-[var(--cp-text)]">Compare anything</h2>
                <p className="text-sm text-[var(--cp-muted)]">Enter any two policies or topics to get an AI-powered side-by-side analysis.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                        type="text"
                        value={topicA}
                        onChange={e => setTopicA(e.target.value)}
                        placeholder="e.g. Universal healthcare"
                        className="w-full px-4 py-3 rounded-xl glass-input text-sm text-[var(--cp-text)] placeholder:text-[var(--cp-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--cp-accent)]/15"
                    />
                    <input
                        type="text"
                        value={topicB}
                        onChange={e => setTopicB(e.target.value)}
                        placeholder="e.g. Private insurance system"
                        className="w-full px-4 py-3 rounded-xl glass-input text-sm text-[var(--cp-text)] placeholder:text-[var(--cp-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--cp-accent)]/15"
                    />
                </div>
                <Button
                    onClick={runCompare}
                    disabled={!topicA.trim() || !topicB.trim() || comparing}
                    className="w-full sm:w-auto"
                >
                    {comparing ? "Comparing..." : "Compare"}
                </Button>

                {(compareResults[0] || compareResults[1]) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {compareResults.map((result, i) => (
                            <div key={i} className="rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-4">
                                {result?.loading ? (
                                    <div className="space-y-3 animate-pulse">
                                        <div className="h-5 w-2/3 rounded bg-[var(--cp-surface-2)]" />
                                        <div className="h-3 w-full rounded bg-[var(--cp-surface-2)]" />
                                        <div className="h-3 w-full rounded bg-[var(--cp-surface-2)]" />
                                        <div className="h-3 w-1/2 rounded bg-[var(--cp-surface-2)]" />
                                    </div>
                                ) : result?.error ? (
                                    <p className="text-sm text-red-500">{result.error}</p>
                                ) : result ? (
                                    <>
                                        <h3 className="font-heading text-base font-bold text-[var(--cp-text)] mb-3">{result.title}</h3>
                                        <div className="space-y-3">
                                            {result.sections.map((s, si) => (
                                                <div key={si}>
                                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--cp-muted)] mb-1">{s.heading}</p>
                                                    <p className="text-sm text-[var(--cp-text)] leading-relaxed whitespace-pre-line">{s.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Divider */}
            <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-[var(--cp-border)]" />
                <span className="text-xs font-medium text-[var(--cp-muted)] uppercase tracking-widest">Or compare propositions</span>
                <div className="flex-1 border-t border-[var(--cp-border)]" />
            </div>

            {/* Slot selectors */}
            <Card className="space-y-3 relative z-30">
                <div className="flex flex-wrap items-center gap-3">
                    {selectedProps.map((num, index) => (
                        <div key={index} className="relative">
                            <Button
                                variant="secondary"
                                onClick={() => setShowSelector(showSelector === index ? null : index)}
                                className="w-44 justify-between"
                            >
                                <span className="text-[var(--cp-accent)] font-semibold">
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
                                <div className="absolute top-full mt-2 left-0 z-50 w-64 rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-doc)] p-2 shadow-soft max-h-64 overflow-y-auto">
                                    {propositions.map(p => (
                                        <button
                                            key={`${p.num}-${p.year}`}
                                            onClick={() => handleSelectProp(index, p.num)}
                                            disabled={selectedProps.includes(p.num) && selectedProps[index] !== p.num}
                                            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${selectedProps.includes(p.num) && selectedProps[index] !== p.num
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
            <Card className="hidden md:block overflow-x-auto relative z-10">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--cp-border)]">
                            <th className="text-left py-3 px-4 text-[var(--cp-muted)] font-medium w-32">Aspect</th>
                            {selectedData.map((prop: any) => (
                                <th key={prop.num} className="text-left py-3 px-4">
                                    <Link href={`/measure/prop/${prop.num}?year=${prop.year}`} className="hover:text-[var(--cp-accent)] transition-colors">
                                        <span className="text-xl font-bold text-[var(--cp-accent)]">Prop {prop.num}</span>
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
                                    {prop.tldr || prop.summary}
                                </td>
                            ))}
                        </tr>
                        <tr className="border-b border-[var(--cp-border)]">
                            <td className="py-4 px-4 text-sm text-[var(--cp-muted)] font-medium align-top">Pros</td>
                            {selectedData.map((prop: any) => (
                                <td key={prop.num} className="py-4 px-4">
                                    <ul className="text-sm space-y-1">
                                        {(prop.pros || []).map((pro: string, i: number) => (
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
                                        {(prop.cons || []).map((con: string, i: number) => (
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
                        <Link href={`/measure/prop/${prop.num}?year=${prop.year}`} className="block hover:text-[var(--cp-accent)] transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-[var(--cp-accent)]">Prop {prop.num}</span>
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
                                <p className="mt-1 text-sm text-[var(--cp-text)]">{prop.tldr || prop.summary}</p>
                            </div>

                            <div>
                                <span className="section-title text-emerald-600">Pros</span>
                                <ul className="mt-1 text-sm text-[var(--cp-text)] space-y-1">
                                    {(prop.pros || []).map((pro: string, i: number) => (
                                        <li key={i}>✓ {pro}</li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <span className="section-title text-rose-500">Cons</span>
                                <ul className="mt-1 text-sm text-[var(--cp-text)] space-y-1">
                                    {(prop.cons || []).map((con: string, i: number) => (
                                        <li key={i}>✗ {con}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Card>
                ))}
            </section>

            <div className="glass-card rounded-2xl p-8 text-center">
                <h3 className="font-heading text-lg font-bold text-[var(--cp-text)] mb-1">
                    Want to explore more?
                </h3>
                <p className="text-sm text-[var(--cp-muted)] mb-5">
                    Browse all propositions or search any policy topic.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/browse" className="text-sm font-medium text-[var(--cp-accent)] hover:underline">
                        Browse All
                    </Link>
                    <span className="text-[var(--cp-muted)]">&middot;</span>
                    <Link href="/" className="text-sm font-medium text-[var(--cp-accent)] hover:underline">
                        Search
                    </Link>
                </div>
            </div>
        </div>
    );
}
