"use client";

import { useEffect, useState, useCallback } from "react";

const TOUR_KEY = "cp-tour-seen";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: TourStep[] = [
  {
    title: "Ask in plain English",
    description: "Type any policy question, bill name, or topic. ClearPolicy searches government databases and verified sources to build you a cited brief.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: "Every claim is cited",
    description: "Unlike ChatGPT, every factual claim has a clickable [1] [2] citation linking to the real source. No hallucinated links.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Debate mode & perspectives",
    description: "Toggle Debate mode to see both sides of any policy with a structured comparison table and stakeholder perspectives.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: "Upload any document",
    description: "Drop a PDF, image, or document to get an AI analysis with citations back to the exact sections of your file.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    ),
  },
  {
    title: "Local impact with ZIP",
    description: "Enter your ZIP code to see how federal and state policies affect your specific area. Personalize results by choosing a persona like Student, Renter, or Parent.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function ProductTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_KEY)) {
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const dismiss = useCallback(() => {
    setExiting(true);
    try { localStorage.setItem(TOUR_KEY, "1"); } catch {}
    setTimeout(() => setVisible(false), 300);
  }, []);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  }, [step, dismiss]);

  const prev = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  if (!visible) return null;

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className={`fixed inset-0 z-[100000] flex items-center justify-center p-4 transition-opacity duration-300 ${exiting ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />
      <div className={`relative w-full max-w-md bg-[var(--cp-bg)] rounded-2xl shadow-elevated border border-[var(--cp-border)] overflow-hidden transition-all duration-300 ${exiting ? "scale-95 opacity-0" : "scale-100 opacity-100 animate-fade-up"}`}>
        {/* Progress bar */}
        <div className="h-1 bg-[var(--cp-surface-2)]">
          <div
            className="h-full bg-[var(--cp-accent)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--cp-tertiary)] hover:text-[var(--cp-text)] hover:bg-[var(--cp-surface-2)] transition-all z-10"
          aria-label="Skip tour"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Content */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--cp-accent-soft)] text-[var(--cp-accent)] mx-auto mb-5">
            {current.icon}
          </div>
          <h3 className="font-heading text-xl font-bold text-[var(--cp-text)] text-center mb-2">
            {current.title}
          </h3>
          <p className="text-[14px] text-[var(--cp-muted)] text-center leading-relaxed max-w-sm mx-auto">
            {current.description}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-[var(--cp-accent)] w-5" : "bg-[var(--cp-border)] hover:bg-[var(--cp-muted)]"}`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 pb-6">
          <button
            onClick={prev}
            disabled={step === 0}
            className="text-sm text-[var(--cp-muted)] hover:text-[var(--cp-text)] disabled:opacity-0 disabled:cursor-default transition-all"
          >
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={dismiss}
              className="text-sm text-[var(--cp-muted)] hover:text-[var(--cp-text)] transition-all"
            >
              Skip
            </button>
            <button
              onClick={next}
              className="text-sm font-semibold bg-[var(--cp-accent)] text-white px-5 py-2 rounded-xl hover:brightness-110 active:scale-[0.97] transition-all"
            >
              {step === STEPS.length - 1 ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
