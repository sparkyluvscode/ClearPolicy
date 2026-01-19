"use client";
import { Button, Card } from "@/components/ui";

export default function WhyMissingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40" role="dialog" aria-modal="true">
      <Card className="absolute inset-x-0 top-16 mx-auto w-[min(92%,32rem)]">
        <h2 className="text-lg font-semibold text-[var(--cp-text)]">Why isn’t this full?</h2>
        <p className="mt-2 text-sm text-[var(--cp-muted)]">Some measures don’t have structured text yet. We prioritize official and nonpartisan sources and add full cards continuously.</p>
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={onClose}>Close</Button>
        </div>
      </Card>
    </div>
  );
}
