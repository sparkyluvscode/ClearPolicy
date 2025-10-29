"use client";

type Level = "5" | "8" | "12";

export default function ReadingLevelToggle({ level, onChange }: { level: Level; onChange: (l: Level) => void }) {
  const levels: Level[] = ["5", "8", "12"];
  return (
    <div className="flex items-center gap-2">
      <div role="group" aria-label="Reading level" className="liquid-toggle">
        {levels.map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={level === l}
            onClick={() => onChange(l)}
            className="liquid-toggle-btn focus-ring"
            title={l === "5" ? "Simplest text" : l === "8" ? "Simpler text" : "Full detail"}
          >
            {l === "5" ? "5th" : l === "8" ? "8th" : "12th"}
          </button>
        ))}
      </div>
      <span className="text-xs text-gray-600" aria-hidden="true" title="Change reading level to suit your needs">i</span>
    </div>
  );
}


