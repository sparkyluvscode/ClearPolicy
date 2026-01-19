"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button, Card } from "@/components/ui";

export default function TourOverlay() {
  const pathname = usePathname();
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("cp_tour_seen");
  });
  const [step, setStep] = useState<1 | 2>(1);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("cp_tour_seen");
    if (!seen) setShow(true);
  }, []);
  if (!show) return null;
  if (pathname?.startsWith("/measure")) return null;
  if (pathname?.startsWith("/dev/evidence-test")) return null;
  if (typeof window !== "undefined" && window.innerWidth < 640) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/40">
      <Card className="absolute inset-x-0 top-10 mx-auto w-[min(90%,28rem)]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
        {step === 1 && (
          <>
            <h2 id="tour-title" className="text-lg font-semibold text-[var(--cp-text)]">Welcome to ClearPolicy</h2>
            <p className="mt-2 text-sm text-[var(--cp-muted)]">
              Type any bill or proposition in the search bar. Use the suggestions to jump to a measure.
            </p>
            <div className="mt-4 flex justify-between">
              <Button variant="secondary" size="sm" onClick={() => { localStorage.setItem("cp_tour_seen", "1"); setShow(false); }}>Skip</Button>
              <Button size="sm" onClick={() => setStep(2)}>Next</Button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-[var(--cp-text)]">Verify and adjust</h2>
            <p className="mt-2 text-sm text-[var(--cp-muted)]">
              Open a measure to see the TL;DR, What, Who, Pros, and Cons. Toggle reading level and expand cited lines to verify.
            </p>
            <div className="mt-4 flex justify-between">
              <Button variant="secondary" size="sm" onClick={() => setStep(1)}>Back</Button>
              <Button size="sm" onClick={() => { localStorage.setItem("cp_tour_seen", "1"); setShow(false); }}>Done</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}


