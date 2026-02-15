"use client";
import { useMemo, useState } from "react";
import ReadingLevelToggle from "@/components/ReadingLevelToggle";
import BillCard from "@/components/BillCard";
import { Card, ToggleButton } from "@/components/ui";
import { simplify } from "@/lib/reading";
import type { SummaryLike } from "@/lib/summary-types";

type Summary = SummaryLike & { level: "5" | "8" | "12" | string };

/** Derive a summary at `targetLevel` from `base` using text simplification. */
function deriveSummary(base: Summary, targetLevel: "5" | "8" | "12"): Summary {
  const s = (val: string | string[] | null | undefined): string => {
    const raw = Array.isArray(val) ? val.join(" ") : String(val || "");
    return simplify(raw, targetLevel);
  };
  const sList = (val: string | string[] | null | undefined): string => {
    if (Array.isArray(val)) return val.map((v) => simplify(v, targetLevel)).join("; ");
    return simplify(String(val || ""), targetLevel);
  };
  return {
    ...base,
    level: targetLevel,
    tldr: s(base.tldr),
    whatItDoes: s(base.whatItDoes),
    whoAffected: s(base.whoAffected),
    pros: sList(base.pros),
    cons: sList(base.cons),
  };
}

export default function InteractiveSummary({ summaries }: { summaries: Summary[] }) {
  const [level, setLevel] = useState<"5" | "8" | "12">("12");
  const [evidenceMode, setEvidenceMode] = useState(false);
  const data = useMemo(() => {
    const exact = summaries.find((s) => s.level === level);
    if (exact) return exact as Summary;
    // If the exact level isn't available, derive it from the highest-level summary
    const base = (summaries.find((s) => s.level === "12") || summaries[0]) as Summary;
    if (!base) return base;
    return deriveSummary(base, level);
  }, [summaries, level]);

  return (
    <div className="w-full">
      <Card variant="subtle" className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--cp-muted)]">Reading level</div>
        <div className="flex flex-wrap items-center gap-2">
          <ReadingLevelToggle level={level} onChange={setLevel} />
          <ToggleButton
            pressed={evidenceMode}
            onPressedChange={setEvidenceMode}
            label="Evidence Mode (beta)"
            data-testid="evidence-toggle"
          />
        </div>
      </Card>
      <div className="mt-4">
        <BillCard data={data as any} level={level} evidenceMode={evidenceMode} />
      </div>
    </div>
  );
}


