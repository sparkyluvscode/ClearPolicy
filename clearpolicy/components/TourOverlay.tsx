"use client";
import { useEffect, useState } from "react";

export default function TourOverlay() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("cp_tour_seen");
    if (!seen) setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:backdrop-blur-lg">
      <div className="absolute inset-x-0 top-10 mx-auto w-[min(90%,28rem)] glass-modal p-5 animate-fade-in-up" role="dialog" aria-modal="true" aria-labelledby="tour-title">
        {step === 1 && (
          <>
            <h2 id="tour-title" className="text-lg font-semibold text-gray-900">Welcome to ClearPolicy</h2>
            <p className="mt-2 text-sm text-gray-700">
              Type any bill or proposition in the search bar. Use the suggestions to jump to a measure.
            </p>
            <div className="mt-4 flex justify-between">
              <button className="glass-input px-4 py-2 text-sm" onClick={() => { localStorage.setItem("cp_tour_seen", "1"); setShow(false); }}>Skip</button>
              <button className="liquid-button px-4 py-2 text-sm" onClick={() => setStep(2)}>Next</button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-gray-900">Verify and adjust</h2>
            <p className="mt-2 text-sm text-gray-700">
              Open a measure to see the TL;DR, What, Who, Pros, and Cons. Toggle reading level and expand cited lines to verify.
            </p>
            <div className="mt-4 flex justify-between">
              <button className="glass-input px-4 py-2 text-sm" onClick={() => setStep(1)}>Back</button>
              <button className="liquid-button px-4 py-2 text-sm" onClick={() => { localStorage.setItem("cp_tour_seen", "1"); setShow(false); }}>Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


