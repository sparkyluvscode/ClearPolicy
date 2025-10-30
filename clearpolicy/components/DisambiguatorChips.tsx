"use client";
import { useRouter } from "next/navigation";

type Chip = { label: string; hint: string; slug?: string };

export default function DisambiguatorChips({ chips }: { chips: Chip[] }) {
  const router = useRouter();
  return (
    <div>
      <div className="section-title mb-2">Did you mean?</div>
      <div className="flex flex-wrap gap-3" aria-label="Disambiguation suggestions">
      {chips.map((c, idx) => (
        <button
          key={idx}
            className="rounded-full glass-input px-4 py-2 text-sm hover:shadow-glow-accent focus-ring transition-all"
          onClick={() => {
            if (c.slug) router.push(`/measure/${c.slug}`);
          }}
          aria-label={`${c.label} — ${c.hint}`}
        >
          <span className="font-medium text-gray-900 dark:text-gray-100">{c.label}</span>
          <span className="ml-1 text-gray-600 dark:text-gray-300">— {c.hint}</span>
        </button>
      ))}
      </div>
    </div>
  );
}


