"use client";
import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="fixed bottom-4 right-4 z-40 hidden sm:inline-flex"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        Need help?
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" role="dialog" aria-modal="true">
          <Card className="absolute inset-x-0 bottom-20 mx-auto w-[min(92%,28rem)]">
            <h2 className="text-lg font-semibold text-[var(--cp-text)]">Quick tips</h2>
            <ul className="mt-2 list-disc list-inside text-sm text-[var(--cp-muted)]">
              <li>Search a law or “prop 17 retail theft”. Try H.R. 50 for federal.</li>
              <li>Open a card, switch the reading level, and expand cited lines.</li>
              <li>Use Local lens to see your state senator and assemblymember.</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={() => setOpen(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}


