"use client";
import { useMemo, useState } from "react";
import ReadingLevelToggle from "@/components/ReadingLevelToggle";
import BillCard from "@/components/BillCard";
import { Card, ToggleButton } from "@/components/ui";
import type { SummaryLike } from "@/lib/summary-types";

type Summary = SummaryLike & { level: "5" | "8" | "12" | string };

export default function InteractiveSummary({ summaries }: { summaries: Summary[] }) {
  const [level, setLevel] = useState<"5" | "8" | "12">("12");
  const [evidenceMode, setEvidenceMode] = useState(false);
  const data = useMemo(() => {
    return (summaries.find((s) => s.level === level) || summaries[0]) as Summary;
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


