"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import BillCard from "@/components/BillCard";
import ReadingLevelToggle from "@/components/ReadingLevelToggle";
import { Card, ToggleButton } from "@/components/ui";
import type { Citation } from "@/lib/citations";
import type { SummaryLike } from "@/lib/summary-types";

type Scenario = "default" | "empty-citations" | "no-tldr" | "giant-quote" | "weird-format" | "one-sentence" | "comma-and";

const scenarios: { id: Scenario; label: string }[] = [
  { id: "default", label: "Default (matched evidence)" },
  { id: "empty-citations", label: "Empty citations" },
  { id: "no-tldr", label: "No TLDR" },
  { id: "giant-quote", label: "Giant quote" },
  { id: "weird-format", label: "Weird TLDR formatting" },
  { id: "one-sentence", label: "Single sentence" },
  { id: "comma-and", label: "Comma + and" },
];

function buildCitations(type: Scenario | "one-sentence" | "comma-and"): Citation[] {
  const base: Citation[] = [
    {
      quote: "The measure reclassifies some nonviolent theft offenses and sets the threshold at $950.",
      sourceName: "LAO",
      url: "https://www.lao.ca.gov/",
      location: "tldr",
    },
  ];
  if (type === "empty-citations") return [];
  if (type === "giant-quote") {
    const longText = "This is a very long quote about the policy changes. ".repeat(80);
    return [
      {
        quote: longText,
        sourceName: "Official Guide",
        url: "https://voterguide.sos.ca.gov/",
        location: "tldr",
      },
    ];
  }
  return base;
}

function buildTldr(type: Scenario | "one-sentence" | "comma-and"): string {
  if (type === "no-tldr") return "";
  if (type === "one-sentence") {
    return "Creates a new grant program to support local wildfire resilience planning.";
  }
  if (type === "comma-and") {
    return "Requires reports on emissions, and funds monitoring in rural areas, and updates enforcement timelines.";
  }
  if (type === "weird-format") {
    return [
      "• Reclassifies certain offenses; reduces penalties.",
      " - Sets a $950 threshold for some theft crimes.",
      "Enacts resentencing provisions; improves clarity!  ",
    ].join("\n");
  }
  return "Reclassifies certain nonviolent theft offenses as misdemeanors when the value is $950 or less; includes resentencing provisions.";
}

export default function EvidenceTestClient() {
  const searchParams = useSearchParams();
  const [level, setLevel] = useState<"5" | "8" | "12">("12");
  const [evidenceMode, setEvidenceMode] = useState(false);

  const scenario = (searchParams?.get("case") as Scenario) || "default";
  const selected = scenarios.find((s) => s.id === scenario) ? scenario : "default";

  const data = useMemo<SummaryLike>(() => {
    const citations = buildCitations(selected);
    return {
      tldr: buildTldr(selected),
      whatItDoes: "Adjusts penalties and funding thresholds for specific offenses.",
      whoAffected: "People charged with covered offenses and local agencies.",
      pros: "Focuses resources on serious crime and saves incarceration costs.",
      cons: "Could reduce deterrence or require administrative updates.",
      sourceRatio: citations.length ? 1 : 0,
      citations,
      sourceCount: citations.length ? 1 : 0,
    };
  }, [selected]);

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[var(--cp-text)]">Evidence Mode Test</h1>
            <p className="mt-1 text-sm text-[var(--cp-muted)]">
              Scenario: {scenarios.find((s) => s.id === selected)?.label}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ReadingLevelToggle level={level} onChange={setLevel} />
            <ToggleButton
              pressed={evidenceMode}
              onPressedChange={setEvidenceMode}
              label="Evidence Mode (beta)"
              data-testid="evidence-toggle"
            />
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-2 text-xs">
          {scenarios.map((s) => (
            <a
              key={s.id}
              href={`/dev/evidence-test?case=${s.id}`}
              className={`rounded-full border px-3 py-1 focus-ring ${
                s.id === selected
                  ? "bg-[var(--cp-text)] text-white border-[var(--cp-text)]"
                  : "border-[var(--cp-border)] text-[var(--cp-text)]"
              }`}
            >
              {s.label}
            </a>
          ))}
        </div>
      </Card>
      <BillCard data={data as any} level={level} evidenceMode={evidenceMode} />
    </div>
  );
}
