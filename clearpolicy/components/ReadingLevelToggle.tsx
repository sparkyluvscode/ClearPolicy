"use client";

import { SegmentedControl } from "@/components/ui";

type Level = "5" | "8" | "12";

export default function ReadingLevelToggle({ level, onChange }: { level: Level; onChange: (l: Level) => void }) {
  return (
    <div data-testid="reading-level">
      <SegmentedControl
        value={level}
        onChange={(value) => onChange(value as Level)}
        ariaLabel="Reading level"
        options={[
          { value: "5", label: "5th", title: "Simplest text" },
          { value: "8", label: "8th", title: "Simpler text" },
          { value: "12", label: "12th", title: "Full detail" },
        ]}
      />
    </div>
  );
}


