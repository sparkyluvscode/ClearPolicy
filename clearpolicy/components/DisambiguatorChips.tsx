"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

type Chip = { label: string; hint: string; slug?: string };

export default function DisambiguatorChips({ chips }: { chips: Chip[] }) {
  const router = useRouter();
  return (
    <div>
      <div className="section-title mb-2">Did you mean?</div>
      <div className="flex flex-wrap gap-2" aria-label="Disambiguation suggestions">
        {chips.map((c, idx) => (
          <Button
            key={idx}
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={() => {
              if (c.slug) router.push(`/measure/${c.slug}`);
            }}
            aria-label={`${c.label} — ${c.hint}`}
          >
            <span className="font-medium">{c.label}</span>
            <span className="ml-1 text-[var(--cp-muted)]">— {c.hint}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}


