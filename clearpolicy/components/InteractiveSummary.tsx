"use client";
import { useMemo, useState } from "react";
import ReadingLevelToggle from "@/components/ReadingLevelToggle";
import BillCard from "@/components/BillCard";

type Summary = {
  level: "5" | "8" | "12" | string;
  tldr: string;
  whatItDoes: string;
  whoAffected: string;
  pros: string;
  cons: string;
  sourceRatio: number;
  citations: { quote: string; sourceName: string; url: string; location?: string }[];
};

export default function InteractiveSummary({ summaries }: { summaries: Summary[] }) {
  const [level, setLevel] = useState<"5" | "8" | "12">("12");
  const data = useMemo(() => {
    return (summaries.find((s) => s.level === level) || summaries[0]) as Summary;
  }, [summaries, level]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-end">
        <ReadingLevelToggle level={level} onChange={setLevel} />
      </div>
      <div className="mt-4">
        <BillCard data={data as any} level={level} />
      </div>
    </div>
  );
}


