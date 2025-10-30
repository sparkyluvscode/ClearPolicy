"use client";
import { useEffect, useMemo, useState } from "react";

export default function HomeDemo() {
  const lines = useMemo(() => [
    "prop 17 retail theft — what changed and who is affected?",
    "H.R. 50 — campaign finance disclosure: who must report and when?",
    "SB 9 housing — can duplexes be built on single‑family lots?",
  ], []);
  const [idx, setIdx] = useState(0);
  const [key, setKey] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % lines.length);
      setKey((k) => k + 1); // retrigger CSS typing
    }, 4200);
    return () => clearInterval(interval);
  }, [lines]);
  const current = lines[idx];
  const steps = Math.min(60, Math.max(20, current.length));
  return (
    <section className="glass-card p-6 lift" aria-label="How ClearPolicy works">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 w-full">
          <div className="text-sm text-gray-600">Try a search</div>
          <div className="mt-2 glass-input w-full px-3 py-2 text-sm relative">
            <span key={key} className="typewriter animate-typing-once pr-1 block max-w-full text-gray-900 dark:text-gray-100" style={{ ["--typing-steps" as any]: String(steps), ["--typing-duration" as any]: "3.4s" }}>
              {current}
            </span>
            <span className="animate-blink absolute right-3 top-2.5 h-5 w-px bg-gray-800/70 dark:bg-white/70" aria-hidden="true" />
          </div>
          <div className="mt-3 text-xs text-gray-500">Watch the input type, then the summary card appears.</div>
        </div>
        <div className="flex-1 w-full">
          <div className="glass-card p-4 animate-fade-in-up" aria-hidden="true">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Summary</div>
              <div className="h-2 w-24 rounded-full bg-accent/20">
                <div className="h-2 w-12 rounded-full bg-accent" />
              </div>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="h-3 rounded bg-gray-900/10 dark:bg-white/10 w-[92%]" />
              <div className="h-3 rounded bg-gray-900/10 dark:bg-white/10 w-[86%]" />
              <div className="h-3 rounded bg-gray-900/10 dark:bg-white/10 w-[80%]" />
            </div>
            <div className="mt-4 text-xs text-accent">Sources included • Tap to verify</div>
          </div>
        </div>
      </div>
    </section>
  );
}


